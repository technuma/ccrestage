import chalk from 'chalk';
import { LogEntry } from './types';
import { StreamingEffect } from './StreamingEffect';

export class MessageRenderer {
  private streaming: StreamingEffect;
  private streamingEnabled: boolean = true;

  constructor() {
    this.streaming = new StreamingEffect();
  }

  setStreamingEnabled(enabled: boolean): void {
    this.streamingEnabled = enabled;
    this.streaming.setEnabled(enabled);
  }

  setDelay(delay: number): void {
    // 互換性のため残す
    this.streaming = new StreamingEffect(Math.floor(delay / 10), delay);
  }

  async renderAll(entries: LogEntry[]): Promise<void> {
    for (const entry of entries) {
      await this.renderEntry(entry);
      console.log(); // エントリ間の改行
    }
  }

  async renderEntry(entry: LogEntry): Promise<void> {
    if (entry.type === 'user') {
      await this.renderUserMessage(entry);
    } else if (entry.type === 'assistant') {
      await this.renderAssistantMessage(entry);
    }

    // ツール実行結果がある場合
    if (entry.toolUseResult) {
      await this.renderToolResult(entry.toolUseResult);
    }
  }

  private async renderUserMessage(entry: LogEntry): Promise<void> {
    process.stdout.write(chalk.gray('> '));
    
    // contentが文字列の場合と配列の場合の両方に対応
    if (typeof entry.message.content === 'string') {
      console.log(chalk.white(entry.message.content));
    } else if (Array.isArray(entry.message.content)) {
      for (const content of entry.message.content) {
        if (content.type === 'text' && content.text) {
          console.log(chalk.white(content.text));
        } else if (content.type === 'tool_result') {
          // Tool resultは表示しない（Claude Codeの動作に合わせて）
        }
      }
    }
  }

  private async renderAssistantMessage(entry: LogEntry): Promise<void> {
    // アシスタントのメッセージは常に配列形式
    if (Array.isArray(entry.message.content)) {
      let hasToolUse = false;
      
      for (const content of entry.message.content) {
        if (content.type === 'text' && content.text) {
          // テキストがある場合のみ⏺を表示
          if (content.text.trim()) {
            process.stdout.write(chalk.green('⏺ '));
            if (this.streamingEnabled) {
              await this.streaming.printLines(content.text);
              console.log(); // 最後に改行
            } else {
              console.log(content.text);
            }
          }
        } else if (content.type === 'tool_use') {
          hasToolUse = true;
        }
      }
      
      // ツール使用時の表示
      if (hasToolUse) {
        for (const content of entry.message.content) {
          if (content.type === 'tool_use') {
            console.log();
            process.stdout.write(chalk.green('⏺ '));
            this.renderToolUse(content.name || '', content.input);
          }
        }
      }
    }
  }

  private renderToolUse(toolName: string, input: any): void {
    switch (toolName) {
      case 'Edit':
      case 'MultiEdit':
        console.log(chalk.white(`Update(${input.file_path})`));
        if (input.old_string && input.new_string) {
          console.log(chalk.gray('  ⎿  ') + chalk.white(`Updated ${input.file_path} with modifications`));
          
          // 簡略化された差分表示
          const oldLines = input.old_string.split('\n');
          const newLines = input.new_string.split('\n');
          
          // 最初の数行だけ表示
          const maxLines = 3;
          let lineNum = 78; // 例としての行番号
          
          for (let i = 0; i < Math.min(maxLines, Math.max(oldLines.length, newLines.length)); i++) {
            if (i < oldLines.length && i < newLines.length && oldLines[i] !== newLines[i]) {
              console.log(chalk.gray(`       ${lineNum + i} `) + chalk.red(`-              ${oldLines[i].trim()}`));
              console.log(chalk.gray(`       ${lineNum + i} `) + chalk.green(`+              ${newLines[i].trim()}`));
            }
          }
        }
        break;
        
      case 'Write':
        console.log(chalk.white(`Write(${input.file_path})`));
        console.log(chalk.gray('  ⎿  ') + chalk.white(`Created ${input.file_path}`));
        break;
        
      case 'Bash':
        console.log(chalk.white(`Run command: ${input.command}`));
        if (input.description) {
          console.log(chalk.gray('  ⎿  ') + chalk.white(input.description));
        }
        break;
        
      case 'Read':
        console.log(chalk.white(`Read(${input.file_path})`));
        break;
        
      default:
        console.log(chalk.white(`${toolName}(${JSON.stringify(input, null, 2)})`));
    }
  }

  private async renderToolResult(result: any): Promise<void> {
    // Claude Codeスタイルでは、ツール実行結果は最小限の表示
    if (result.stdout && result.stdout.trim()) {
      console.log(chalk.gray('  ⎿  Output:'));
      const lines = result.stdout.trim().split('\n');
      lines.forEach((line: string) => {
        console.log(chalk.gray('     ') + chalk.white(line));
      });
    }
    
    if (result.stderr && result.stderr.trim()) {
      console.log(chalk.gray('  ⎿  ') + chalk.red('Error:'));
      const lines = result.stderr.trim().split('\n');
      lines.forEach((line: string) => {
        console.log(chalk.gray('     ') + chalk.red(line));
      });
    }
  }
}
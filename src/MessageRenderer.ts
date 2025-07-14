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
    // タイムスタンプの表示
    const time = new Date(entry.timestamp).toLocaleTimeString();
    console.log(chalk.gray(`[${time}]`));

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
    process.stdout.write(chalk.blue('👤 User: '));
    
    for (const content of entry.message.content) {
      if (content.type === 'text' && content.text) {
        console.log(chalk.cyan(content.text));
      } else if (content.type === 'tool_result') {
        console.log(chalk.gray('📥 Tool result received'));
      }
    }
  }

  private async renderAssistantMessage(entry: LogEntry): Promise<void> {
    process.stdout.write(chalk.green('🤖 Assistant: '));
    
    for (const content of entry.message.content) {
      if (content.type === 'text' && content.text) {
        if (this.streamingEnabled) {
          await this.streaming.printLines(content.text);
          console.log(); // 最後に改行
        } else {
          console.log(content.text);
        }
      } else if (content.type === 'tool_use') {
        console.log(chalk.yellow(`\n🔧 Using tool: ${content.name}`));
        if (content.input) {
          const inputStr = JSON.stringify(content.input, null, 2);
          console.log(chalk.gray(inputStr));
        }
      }
    }
  }

  private async renderToolResult(result: any): Promise<void> {
    console.log(chalk.cyan('📊 Tool Result:'));
    
    if (result.stdout) {
      console.log(chalk.gray('Output:'));
      console.log(chalk.white(result.stdout));
    }
    
    if (result.stderr) {
      console.log(chalk.red('Error:'));
      console.log(chalk.red(result.stderr));
    }
    
    if (result.filePath) {
      console.log(chalk.gray(`File: ${result.filePath}`));
      if (result.type === 'create') {
        console.log(chalk.green('✅ File created'));
      } else if (result.type === 'edit') {
        console.log(chalk.yellow('✏️  File edited'));
        if (result.oldString && result.newString) {
          console.log(chalk.red('- ' + result.oldString.substring(0, 50) + '...'));
          console.log(chalk.green('+ ' + result.newString.substring(0, 50) + '...'));
        }
      }
    }
  }
}
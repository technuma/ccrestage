import chalk from 'chalk';
import { LogEntry } from './types';

export class MessageRenderer {
  private delay: number = 50; // デフォルトの遅延（ミリ秒）

  setDelay(delay: number): void {
    this.delay = delay;
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
    console.log(chalk.blue('User: '));
    
    for (const content of entry.message.content) {
      if (content.type === 'text' && content.text) {
        console.log(content.text);
      } else if (content.type === 'tool_result') {
        console.log(chalk.gray('Tool result received'));
      }
    }
  }

  private async renderAssistantMessage(entry: LogEntry): Promise<void> {
    console.log(chalk.green('Assistant: '));
    
    for (const content of entry.message.content) {
      if (content.type === 'text' && content.text) {
        await this.printWithDelay(content.text);
      } else if (content.type === 'tool_use') {
        console.log(chalk.yellow(`\nUsing tool: ${content.name}`));
        if (content.input) {
          console.log(chalk.gray(JSON.stringify(content.input, null, 2)));
        }
      }
    }
  }

  private async renderToolResult(result: any): Promise<void> {
    console.log(chalk.cyan('\nTool Result:'));
    
    if (result.stdout) {
      console.log(chalk.gray('Output:'));
      console.log(result.stdout);
    }
    
    if (result.stderr) {
      console.log(chalk.red('Error:'));
      console.log(result.stderr);
    }
    
    if (result.filePath) {
      console.log(chalk.gray(`File: ${result.filePath}`));
      if (result.type === 'create') {
        console.log(chalk.green('✓ File created'));
      } else if (result.type === 'edit') {
        console.log(chalk.yellow('✓ File edited'));
      }
    }
  }

  private async printWithDelay(text: string): Promise<void> {
    // シンプルなバージョン：一度に全文表示
    // StreamingEffectクラスで改善予定
    console.log(text);
  }
}
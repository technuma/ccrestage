import * as readline from 'readline';
import chalk from 'chalk';
import { LogEntry } from './types';
import { MessageRenderer } from './MessageRenderer';

export class InteractiveFlowController {
  private entries: LogEntry[] = [];
  private currentIndex: number = 0;
  private isPaused: boolean = true;
  private speed: number = 1.0;
  private renderer: MessageRenderer;
  private displayedMessages: LogEntry[] = []; // 現在表示中のメッセージ
  private maxDisplayedMessages: number = 50; // 画面に表示する最大メッセージ数

  constructor(entries: LogEntry[], renderer: MessageRenderer) {
    this.entries = entries;
    this.renderer = renderer;
  }

  async startInteractiveFlow(): Promise<void> {
    this.setupKeyboardHandlers();
    console.clear();
    await this.showInstructions();
    await this.startFlow();
  }

  private async showInstructions(): Promise<void> {
    console.log(chalk.cyan('📜 Interactive Flow Mode\n'));
    console.log(chalk.white('会話が通常モードのように流れていきます。'));
    console.log(chalk.white('古いメッセージは自動的に画面から消えます。\n'));
    console.log(chalk.yellow('操作方法:'));
    console.log(chalk.white('  →           - 次のメッセージを表示'));
    console.log(chalk.white('  ←           - 前のメッセージを消す'));
    console.log(chalk.white('  a           - 自動再生ON/OFF'));
    console.log(chalk.white('  ↑/↓        - 再生速度調整'));
    console.log(chalk.white('  c           - 画面クリア'));
    console.log(chalk.white('  r           - 最初から再生'));
    console.log(chalk.white('  q/Ctrl+C    - 終了'));
    console.log(chalk.gray('\n任意のキーを押して開始...\n'));
    
    await this.waitForKeypress();
    console.clear();
  }

  private setupKeyboardHandlers(): void {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    
    readline.emitKeypressEvents(process.stdin);
    
    process.stdin.on('keypress', async (str, key) => {
      if (key.ctrl && key.name === 'c') {
        this.cleanup();
        process.exit();
      }

      switch (key.name) {
        case 'right':
          await this.showNextMessage();
          break;
        case 'left':
          await this.removePreviousMessage();
          break;
        case 'a':
          this.toggleAutoPlay();
          break;
        case 'up':
          this.increaseSpeed();
          break;
        case 'down':
          this.decreaseSpeed();
          break;
        case 'c':
          await this.clearScreen();
          break;
        case 'r':
          await this.restart();
          break;
        case 'q':
          this.cleanup();
          process.exit();
          break;
      }
    });
  }

  private async startFlow(): Promise<void> {
    this.showStatus();
    
    while (true) {
      if (this.isPaused) {
        await this.sleep(100);
        continue;
      }

      if (this.currentIndex < this.entries.length) {
        await this.displayMessage(this.currentIndex);
        this.currentIndex++;
      } else {
        console.log(chalk.green('\n\n✅ すべてのメッセージを表示しました'));
        this.isPaused = true;
      }

      await this.sleep(1000 / this.speed);
    }
  }

  private async showNextMessage(): Promise<void> {
    if (this.currentIndex < this.entries.length) {
      await this.displayMessage(this.currentIndex);
      this.currentIndex++;
      this.showStatus();
    } else {
      console.log(chalk.yellow('\n最後のメッセージです'));
    }
  }

  private async removePreviousMessage(): Promise<void> {
    if (this.displayedMessages.length > 0) {
      // 最後に表示したメッセージを削除
      this.displayedMessages.pop();
      
      // 画面を再描画
      await this.redrawScreen();
      
      console.log(chalk.yellow('\n前のメッセージを削除しました'));
      this.showStatus();
    } else {
      console.log(chalk.yellow('\n削除するメッセージがありません'));
    }
  }

  private async displayMessage(index: number): Promise<void> {
    const entry = this.entries[index];
    
    // メッセージを表示リストに追加
    this.displayedMessages.push(entry);
    
    // 最大表示数を超えたら古いメッセージを削除
    if (this.displayedMessages.length > this.maxDisplayedMessages) {
      this.displayedMessages.shift();
    }
    
    await this.renderer.renderEntry(entry);
    console.log(); // メッセージ間の空行
  }

  private async redrawScreen(): Promise<void> {
    console.clear();
    
    // 表示中のメッセージをすべて再描画
    for (const entry of this.displayedMessages) {
      await this.renderer.renderEntry(entry);
      console.log();
    }
  }

  private async clearScreen(): Promise<void> {
    console.clear();
    this.displayedMessages = [];
    console.log(chalk.gray('画面をクリアしました'));
    this.showStatus();
  }

  private toggleAutoPlay(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      console.log(chalk.yellow('\n⏸  自動再生停止（Enter/Spaceで次へ）'));
    } else {
      console.log(chalk.green('\n▶️  自動再生開始'));
    }
    this.showStatus();
  }

  private increaseSpeed(): void {
    if (this.speed < 5.0) {
      this.speed += 0.5;
      console.log(chalk.yellow(`\n⚡ 速度: ${this.speed}x`));
      this.showStatus();
    }
  }

  private decreaseSpeed(): void {
    if (this.speed > 0.5) {
      this.speed -= 0.5;
      console.log(chalk.yellow(`\n🐌 速度: ${this.speed}x`));
      this.showStatus();
    }
  }

  private async restart(): Promise<void> {
    console.clear();
    this.currentIndex = 0;
    this.displayedMessages = [];
    console.log(chalk.cyan('🔄 最初から再生します\n'));
    await this.sleep(1000);
    this.showStatus();
  }

  private showStatus(): void {
    // ステータス行を画面下部に固定表示
    process.stdout.write('\x1b[s'); // カーソル位置を保存
    process.stdout.write('\x1b[999;1H'); // 画面の最下部へ
    process.stdout.write('\x1b[K'); // 行をクリア
    
    const progress = ((this.currentIndex) / this.entries.length) * 100;
    const status = this.isPaused ? '⏸ 一時停止' : '▶️ 再生中';
    const displayed = this.displayedMessages.length;
    const statusLine = chalk.bgGray.white(
      ` ${status} | ${this.currentIndex}/${this.entries.length} (${progress.toFixed(0)}%) | 表示中: ${displayed} | 速度: ${this.speed}x | →:次へ ←:削除 a:自動 q:終了 `
    );
    
    process.stdout.write(statusLine);
    process.stdout.write('\x1b[u'); // カーソル位置を復元
  }

  private cleanup(): void {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
    console.log('\n'); // 終了時に改行
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async waitForKeypress(): Promise<void> {
    return new Promise(resolve => {
      const handler = () => {
        process.stdin.removeListener('keypress', handler);
        resolve();
      };
      process.stdin.once('keypress', handler);
    });
  }
}
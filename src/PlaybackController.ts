import * as readline from 'readline';
import chalk from 'chalk';
import { LogEntry } from './types';
import { MessageRenderer } from './MessageRenderer';

export class PlaybackController {
  private entries: LogEntry[] = [];
  private currentIndex: number = 0;
  private isPaused: boolean = true;  // デフォルトで一時停止
  private speed: number = 1.0;
  private renderer: MessageRenderer;
  private rl?: readline.Interface;
  private autoPlay: boolean = false;  // 自動再生モード

  constructor(entries: LogEntry[], renderer: MessageRenderer) {
    this.entries = entries;
    this.renderer = renderer;
  }

  async startInteractive(): Promise<void> {
    this.setupKeyboardHandlers();
    await this.showHelp();
    console.log(chalk.yellow('\n⏸  一時停止中 - Spaceキーで再生、→キーで次へ\n'));
    await this.playFromIndex(0);
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
        case 'space':
          this.toggleAutoPlay();
          break;
        case 'right':
          await this.nextMessage();
          break;
        case 'left':
          await this.previousMessage();
          break;
        case 'up':
          this.increaseSpeed();
          break;
        case 'down':
          this.decreaseSpeed();
          break;
        case 'h':
          await this.showHelp();
          break;
        case 'q':
          this.cleanup();
          process.exit();
          break;
      }
    });
  }

  private async showHelp(): Promise<void> {
    console.clear();
    console.log(chalk.cyan('🎮 Interactive Playback Controls:\n'));
    console.log(chalk.white('  →         - 次のメッセージを表示'));
    console.log(chalk.white('  ←         - 前のメッセージに戻る'));
    console.log(chalk.white('  Space     - 自動再生ON/OFF'));
    console.log(chalk.white('  ↑         - 再生速度を上げる'));
    console.log(chalk.white('  ↓         - 再生速度を下げる'));
    console.log(chalk.white('  h         - このヘルプを表示'));
    console.log(chalk.white('  q/Ctrl+C  - 終了'));
    console.log(chalk.white('\n任意のキーを押して続行...\n'));
    
    await this.waitForKeypress();
    console.clear();
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

  private async playFromIndex(startIndex: number): Promise<void> {
    this.currentIndex = startIndex;

    // 最初のメッセージを表示
    if (this.currentIndex < this.entries.length) {
      this.showProgress();
      await this.renderer.renderEntry(this.entries[this.currentIndex]);
      console.log();
      console.log(chalk.white('\n→キーで次へ、←キーで前へ、Spaceで自動再生、qで終了'));
    }

    while (this.currentIndex < this.entries.length) {
      // 自動再生がOFFの場合は待機
      if (!this.autoPlay) {
        await this.sleep(100);
        continue;
      }

      // 次のメッセージに進む
      this.currentIndex++;
      if (this.currentIndex >= this.entries.length) break;

      this.showProgress();
      await this.renderer.renderEntry(this.entries[this.currentIndex]);
      console.log();
      
      // 速度に応じた待機
      await this.sleep(1000 / this.speed);
    }

    if (this.currentIndex >= this.entries.length) {
      console.log(chalk.green('\n✅ 再生完了！'));
      this.cleanup();
    }
  }

  private showProgress(): void {
    const progress = ((this.currentIndex + 1) / this.entries.length) * 100;
    const barLength = 30;
    const filled = Math.floor((progress / 100) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    
    const statusLine = chalk.white(`[${bar}] ${progress.toFixed(0)}% (${this.currentIndex + 1}/${this.entries.length}) | 速度: ${this.speed}x | ${this.autoPlay ? '自動再生中' : '手動モード'}`);
    console.log(statusLine);
    console.log(chalk.white('─'.repeat(80))); // 区切り線
  }

  private toggleAutoPlay(): void {
    this.autoPlay = !this.autoPlay;
    if (this.autoPlay) {
      console.log(chalk.green('\n▶️  自動再生ON'));
    } else {
      console.log(chalk.yellow('\n⏸  手動モード（→キーで次へ）'));
    }
  }

  private async nextMessage(): Promise<void> {
    if (this.currentIndex < this.entries.length - 1) {
      this.currentIndex++;
      console.clear();
      this.showProgress();
      await this.renderer.renderEntry(this.entries[this.currentIndex]);
      console.log();
      console.log(chalk.white('\n→キーで次へ、←キーで前へ、Spaceで自動再生、qで終了'));
    } else {
      console.log(chalk.yellow('\n📄 最後のメッセージです'));
    }
  }

  private async previousMessage(): Promise<void> {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      console.clear();
      this.showProgress();
      await this.renderer.renderEntry(this.entries[this.currentIndex]);
      console.log();
      console.log(chalk.white('\n→キーで次へ、←キーで前へ、Spaceで自動再生、qで終了'));
    } else {
      console.log(chalk.yellow('\n📄 最初のメッセージです'));
    }
  }

  private increaseSpeed(): void {
    if (this.speed < 5.0) {
      this.speed += 0.5;
      console.log(chalk.yellow(`\n⚡ Speed: ${this.speed}x`));
    }
  }

  private decreaseSpeed(): void {
    if (this.speed > 0.5) {
      this.speed -= 0.5;
      console.log(chalk.yellow(`\n🐌 Speed: ${this.speed}x`));
    }
  }

  private cleanup(): void {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
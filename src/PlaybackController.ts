import * as readline from 'readline';
import chalk from 'chalk';
import { LogEntry } from './types';
import { MessageRenderer } from './MessageRenderer';

export class PlaybackController {
  private entries: LogEntry[] = [];
  private currentIndex: number = 0;
  private isPaused: boolean = false;
  private speed: number = 1.0;
  private renderer: MessageRenderer;
  private rl?: readline.Interface;

  constructor(entries: LogEntry[], renderer: MessageRenderer) {
    this.entries = entries;
    this.renderer = renderer;
  }

  async startInteractive(): Promise<void> {
    this.setupKeyboardHandlers();
    await this.showHelp();
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
          this.togglePause();
          break;
        case 'right':
          this.skipForward();
          break;
        case 'left':
          this.skipBackward();
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
    console.log(chalk.white('  Space     - Pause/Resume'));
    console.log(chalk.white('  →         - Skip to next message'));
    console.log(chalk.white('  ←         - Skip to previous message'));
    console.log(chalk.white('  ↑         - Increase speed'));
    console.log(chalk.white('  ↓         - Decrease speed'));
    console.log(chalk.white('  h         - Show this help'));
    console.log(chalk.white('  q/Ctrl+C  - Quit'));
    console.log(chalk.gray('\nPress any key to continue...\n'));
    
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

    while (this.currentIndex < this.entries.length) {
      if (this.isPaused) {
        await this.sleep(100);
        continue;
      }

      this.showProgress();
      await this.renderer.renderEntry(this.entries[this.currentIndex]);
      console.log();

      this.currentIndex++;
      
      // 速度に応じた待機
      await this.sleep(1000 / this.speed);
    }

    console.log(chalk.green('\n✅ Playback completed!'));
    this.cleanup();
  }

  private showProgress(): void {
    const progress = ((this.currentIndex + 1) / this.entries.length) * 100;
    const barLength = 30;
    const filled = Math.floor((progress / 100) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    
    process.stdout.write('\r' + chalk.gray(`[${bar}] ${progress.toFixed(0)}% | Speed: ${this.speed}x | ${this.isPaused ? 'PAUSED' : 'PLAYING'}`));
    process.stdout.write('\n');
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      console.log(chalk.yellow('\n⏸  Paused'));
    } else {
      console.log(chalk.green('\n▶️  Resumed'));
    }
  }

  private skipForward(): void {
    if (this.currentIndex < this.entries.length - 1) {
      this.currentIndex++;
      console.log(chalk.blue('\n⏭  Skipped forward'));
    }
  }

  private skipBackward(): void {
    if (this.currentIndex > 0) {
      this.currentIndex -= 2; // 現在のを含めて2つ戻る
      console.log(chalk.blue('\n⏮  Skipped backward'));
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
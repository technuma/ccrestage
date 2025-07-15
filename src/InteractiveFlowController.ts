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
  private hiddenMessages: LogEntry[] = []; // 非表示にしたメッセージ（表示順）
  private maxDisplayedMessages: number = 50; // 画面に表示する最大メッセージ数
  private debug: boolean = process.env.DEBUG === 'true'; // デバッグモード

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
    console.log(chalk.white('メッセージを非表示にしたり、再表示したりできます。\n'));
    console.log(chalk.yellow('操作方法:'));
    console.log(chalk.white('  →           - 次のメッセージ表示 / ストリーミングスキップ'));
    console.log(chalk.white('  ←           - 最新のメッセージを非表示にする'));
    console.log(chalk.white('  a           - 自動再生ON/OFF'));
    console.log(chalk.white('  ↑/↓        - 再生速度調整'));
    console.log(chalk.white('  c           - 画面クリア（非表示もリセット）'));
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
          // ストリーミング中なら即座に完了させる
          const streamingEffect = this.renderer.getStreamingEffect();
          if (streamingEffect.isCurrentlyStreaming()) {
            streamingEffect.requestSkip();
          } else {
            await this.showNextMessage();
          }
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
    // 最初は一時停止状態
    
    while (true) {
      if (this.isPaused) {
        await this.sleep(100);
        continue;
      }

      if (this.currentIndex < this.entries.length) {
        const displayed = await this.displayMessage(this.currentIndex);
        this.currentIndex++;
        
        // 表示されないメッセージの場合はスキップして次へ
        if (!displayed && this.currentIndex < this.entries.length) {
          continue;
        }
      } else {
        console.log(chalk.green('\n\n✅ すべてのメッセージを表示しました'));
        this.isPaused = true;
      }

      await this.sleep(1000 / this.speed);
    }
  }

  private async showNextMessage(): Promise<void> {
    if (this.debug) {
      console.log(chalk.gray(`\n[DEBUG] showNextMessage called. hiddenMessages: ${this.hiddenMessages.length}, currentIndex: ${this.currentIndex}`));
    }
    
    // 非表示メッセージがある場合は、最も古いものを再表示
    if (this.hiddenMessages.length > 0) {
      const messageToShow = this.hiddenMessages.shift()!; // 最も古い非表示メッセージ
      
      // メッセージを表示リストに追加
      this.displayedMessages.push(messageToShow);
      
      // 最大表示数を超えたら古いメッセージを削除
      if (this.displayedMessages.length > this.maxDisplayedMessages) {
        this.displayedMessages.shift();
      }
      
      // 再表示（画面の再描画なし、単純に追加）
      const rendered = await this.renderer.renderEntry(messageToShow);
      if (rendered) {
        console.log(); // メッセージ間の空行
      }
      
      console.log(chalk.green('→ 再表示'));
      return;
    }
    
    // 非表示メッセージがない場合は、新しいメッセージを表示
    while (this.currentIndex < this.entries.length) {
      const entry = this.entries[this.currentIndex];
      if (this.debug) {
        console.log(chalk.gray(`[DEBUG] Trying index ${this.currentIndex}, type: ${entry.type}`));
        if (entry.type === 'user' && Array.isArray(entry.message.content)) {
          const types = entry.message.content.map(c => c.type).join(', ');
          console.log(chalk.gray(`[DEBUG] User content types: ${types}`));
        }
      }
      
      const displayed = await this.displayMessage(this.currentIndex);
      this.currentIndex++;
      
      if (this.debug) {
        console.log(chalk.gray(`[DEBUG] Displayed: ${displayed}`));
      }
      
      // 実際に表示されたメッセージがあれば終了
      if (displayed) {
        break;
      }
      // 表示されないメッセージ（tool_resultのみ）の場合は次へ
    }
    
    if (this.currentIndex >= this.entries.length && this.hiddenMessages.length === 0) {
      console.log(chalk.yellow('\n最後のメッセージです'));
    }
  }

  private async removePreviousMessage(): Promise<void> {
    if (this.displayedMessages.length > 0) {
      // 最後に表示したメッセージを非表示に
      const messageToHide = this.displayedMessages.pop()!;
      
      // 非表示リストの最初に追加（表示順を保つため）
      this.hiddenMessages.unshift(messageToHide);
      
      // 削除するメッセージの行数を計算
      const linesToDelete = this.calculateMessageLines(messageToHide);
      
      // ANSIエスケープシーケンスで画面から削除
      // カーソルを上に移動して行をクリア
      for (let i = 0; i < linesToDelete; i++) {
        process.stdout.write('\x1b[1A'); // 1行上へ
        process.stdout.write('\x1b[2K'); // 行をクリア
      }
      
      // カーソルを現在位置に戻す
      process.stdout.write('\x1b[1A'); // フィードバックメッセージ分も上へ
      process.stdout.write('\x1b[2K');
      
      console.log(chalk.yellow(`← 非表示 (非表示: ${this.hiddenMessages.length})`));
    } else {
      console.log(chalk.yellow('\n非表示にするメッセージがありません'));
    }
  }

  private async displayMessage(index: number): Promise<boolean> {
    const entry = this.entries[index];
    
    // renderEntryを実行して、実際に何か表示されたかチェック
    const rendered = await this.renderer.renderEntry(entry);
    
    // 実際に表示された場合のみメッセージリストに追加
    if (rendered) {
      // メッセージを表示リストに追加
      this.displayedMessages.push(entry);
      
      // 最大表示数を超えたら古いメッセージを削除
      if (this.displayedMessages.length > this.maxDisplayedMessages) {
        this.displayedMessages.shift();
      }
      
      console.log(); // メッセージ間の空行
    }
    
    return rendered;
  }

  private async redrawScreen(): Promise<void> {
    console.clear();
    
    // 表示中のメッセージをすべて再描画
    for (const entry of this.displayedMessages) {
      const rendered = await this.renderer.renderEntry(entry);
      if (rendered) {
        console.log();
      }
    }
  }

  private async clearScreen(): Promise<void> {
    console.clear();
    this.displayedMessages = [];
    this.hiddenMessages = [];
    console.log(chalk.gray('画面をクリアしました（非表示メッセージもリセット）'));
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
    this.hiddenMessages = [];
    console.log(chalk.cyan('🔄 最初から再生します\n'));
    await this.sleep(1000);
  }

  private showStatus(): void {
    // インラインでステータスを表示（画面を汚さないように）
    const progress = ((this.currentIndex) / this.entries.length) * 100;
    const status = this.isPaused ? '⏸' : '▶️';
    const displayed = this.displayedMessages.length;
    const hidden = this.hiddenMessages.length;
    const statusLine = chalk.gray(
      `\n${status} ${this.currentIndex}/${this.entries.length} (${progress.toFixed(0)}%) | 表示: ${displayed} | 非表示: ${hidden} | 速度: ${this.speed}x`
    );
    
    console.log(statusLine);
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

  private calculateMessageLines(entry: LogEntry | undefined): number {
    if (!entry) return 1;
    
    let lines = 2; // 基本行数（プレフィックス + 空行）
    
    // ユーザーメッセージの場合
    if (entry.type === 'user') {
      if (typeof entry.message.content === 'string') {
        lines += entry.message.content.split('\n').length;
      } else if (Array.isArray(entry.message.content)) {
        // テキストコンテンツのみカウント
        for (const content of entry.message.content) {
          if (content.type === 'text' && content.text) {
            lines += content.text.split('\n').length;
          }
        }
      }
    }
    
    // アシスタントメッセージの場合
    if (entry.type === 'assistant' && Array.isArray(entry.message.content)) {
      for (const content of entry.message.content) {
        if (content.type === 'text' && content.text) {
          lines += content.text.split('\n').length;
        } else if (content.type === 'tool_use') {
          // ツール使用の表示行数
          lines += 3; // ツール名 + 詳細情報の行数
          
          // Editツールの場合は差分表示の行数も追加
          if (content.name === 'Edit' || content.name === 'MultiEdit') {
            lines += 6; // 差分表示の概算行数
          }
        }
      }
    }
    
    // ツール実行結果がある場合
    if (entry.toolUseResult) {
      if (entry.toolUseResult.stdout) {
        lines += entry.toolUseResult.stdout.split('\n').length + 2;
      }
      if (entry.toolUseResult.stderr) {
        lines += entry.toolUseResult.stderr.split('\n').length + 2;
      }
    }
    
    return lines;
  }
}
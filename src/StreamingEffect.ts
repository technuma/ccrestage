import chalk from 'chalk';

export class StreamingEffect {
  private delay: number;
  private wordDelay: number;
  private enabled: boolean = true;
  private skipRequested: boolean = false;
  private isStreaming: boolean = false;

  constructor(delay: number = 5, wordDelay: number = 50) {
    this.delay = delay;
    this.wordDelay = wordDelay;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  requestSkip(): void {
    this.skipRequested = true;
  }

  isCurrentlyStreaming(): boolean {
    return this.isStreaming;
  }

  async print(text: string): Promise<void> {
    if (!this.enabled || this.skipRequested) {
      process.stdout.write(chalk.white(text));
      return;
    }

    this.isStreaming = true;
    this.skipRequested = false;

    // 単語単位でのストリーミング効果
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (this.skipRequested) {
        // スキップ要求があったら残りを一気に表示
        const remainingWords = words.slice(i).join(' ');
        process.stdout.write(chalk.white(remainingWords));
        break;
      }

      const word = words[i];
      
      // 単語内の文字を高速表示
      for (let charIndex = 0; charIndex < word.length; charIndex++) {
        if (this.skipRequested) {
          // 残りの文字を一気に表示
          const remainingChars = word.substring(charIndex);
          process.stdout.write(chalk.white(remainingChars));
          // 残りの単語も表示
          if (i < words.length - 1) {
            process.stdout.write(' ');
            const remainingWords = words.slice(i + 1).join(' ');
            process.stdout.write(chalk.white(remainingWords));
          }
          this.isStreaming = false;
          this.skipRequested = false;
          return;
        }
        process.stdout.write(chalk.white(word[charIndex]));
        await this.sleep(this.delay);
      }
      
      // 単語間にスペースを追加（最後の単語以外）
      if (i < words.length - 1) {
        process.stdout.write(' ');
        await this.sleep(this.wordDelay);
      }
    }

    this.isStreaming = false;
    this.skipRequested = false;
  }

  async printLine(text: string): Promise<void> {
    await this.print(text);
    process.stdout.write('\n');
  }

  async printLines(text: string): Promise<void> {
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (this.skipRequested && this.enabled) {
        // スキップ要求があったら残りを一気に表示
        const remainingLines = lines.slice(i);
        process.stdout.write(chalk.white(remainingLines.join('\n')));
        this.isStreaming = false;
        this.skipRequested = false;
        return;
      }
      
      await this.print(lines[i]);
      if (i < lines.length - 1) {
        process.stdout.write('\n');
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
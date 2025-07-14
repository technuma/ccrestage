export class StreamingEffect {
  private delay: number;
  private wordDelay: number;
  private enabled: boolean = true;

  constructor(delay: number = 5, wordDelay: number = 50) {
    this.delay = delay;
    this.wordDelay = wordDelay;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  async print(text: string): Promise<void> {
    if (!this.enabled) {
      process.stdout.write(text);
      return;
    }

    // 単語単位でのストリーミング効果
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // 単語内の文字を高速表示
      for (const char of word) {
        process.stdout.write(char);
        await this.sleep(this.delay);
      }
      
      // 単語間にスペースを追加（最後の単語以外）
      if (i < words.length - 1) {
        process.stdout.write(' ');
        await this.sleep(this.wordDelay);
      }
    }
  }

  async printLine(text: string): Promise<void> {
    await this.print(text);
    process.stdout.write('\n');
  }

  async printLines(text: string): Promise<void> {
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
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
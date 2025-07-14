export class StreamingEffect {
  private delay: number;

  constructor(delay: number = 20) {
    this.delay = delay;
  }

  async print(text: string): Promise<void> {
    for (const char of text) {
      process.stdout.write(char);
      await this.sleep(this.delay);
    }
    process.stdout.write('\n');
  }

  async printLine(text: string): Promise<void> {
    await this.print(text);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
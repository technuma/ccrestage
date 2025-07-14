import * as fs from 'fs/promises';
import * as readline from 'readline';
import { createReadStream } from 'fs';
import { LogEntry } from './types';

export class LogReader {
  private entries: LogEntry[] = [];

  async read(filePath: string): Promise<LogEntry[]> {
    this.entries = [];
    
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileStream = createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (line.trim()) {
        try {
          const entry = JSON.parse(line) as LogEntry;
          this.entries.push(entry);
        } catch (error) {
          console.warn(`Failed to parse line: ${line}`);
        }
      }
    }

    return this.entries;
  }

  getEntries(): LogEntry[] {
    return this.entries;
  }

  filterByType(type: 'user' | 'assistant'): LogEntry[] {
    return this.entries.filter(entry => entry.type === type);
  }

  getByUuid(uuid: string): LogEntry | undefined {
    return this.entries.find(entry => entry.uuid === uuid);
  }

  getChildren(parentUuid: string): LogEntry[] {
    return this.entries.filter(entry => entry.parentUuid === parentUuid);
  }

  getSortedByTimestamp(): LogEntry[] {
    return [...this.entries].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }
}
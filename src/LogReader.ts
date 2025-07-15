import * as fs from 'fs/promises';
import * as readline from 'readline';
import { createReadStream } from 'fs';
import { LogEntry } from './types';

export class LogReader {
  private entries: LogEntry[] = [];

  async read(filePath: string): Promise<LogEntry[]> {
    this.entries = [];
    const rawEntries: LogEntry[] = [];
    
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
          rawEntries.push(entry);
        } catch (error) {
          console.warn(`Failed to parse line: ${line}`);
        }
      }
    }

    // アシスタントメッセージのマージ処理
    this.entries = this.mergeAssistantMessages(rawEntries);

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

  private mergeAssistantMessages(entries: LogEntry[]): LogEntry[] {
    const merged: LogEntry[] = [];
    const assistantMap = new Map<string, LogEntry>();

    for (const entry of entries) {
      if (entry.type === 'assistant' && entry.message.id) {
        const messageId = entry.message.id;
        const existing = assistantMap.get(messageId);
        
        if (existing && Array.isArray(existing.message.content) && Array.isArray(entry.message.content)) {
          // 同じメッセージIDのアシスタントエントリをマージ
          existing.message.content = [...existing.message.content, ...entry.message.content];
          // 最新のタイムスタンプとUUIDを使用
          existing.timestamp = entry.timestamp;
          existing.uuid = entry.uuid;
        } else {
          // 新しいメッセージIDの場合
          assistantMap.set(messageId, entry);
          merged.push(entry);
        }
      } else {
        // アシスタント以外のメッセージはそのまま追加
        merged.push(entry);
      }
    }

    return merged;
  }
}
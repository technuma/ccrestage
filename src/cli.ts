#!/usr/bin/env node

import { program } from 'commander';
import { LogReader } from './LogReader';
import { MessageRenderer } from './MessageRenderer';
import { PlaybackController } from './PlaybackController';
import { InteractiveFlowController } from './InteractiveFlowController';
import * as fs from 'fs/promises';

program
  .name('ccreplay')
  .description('Replay Claude Code conversation logs')
  .version('1.0.0')
  .argument('<logfile>', 'Path to the JSONL log file')
  .option('-d, --delay <ms>', 'Delay between messages in milliseconds', '50')
  .option('-f, --filter <type>', 'Filter messages by type (user/assistant)')
  .option('-s, --no-streaming', 'Disable streaming effect')
  .option('-i, --interactive', 'Enable interactive playback mode (navigate messages)')
  .option('-I, --interactive-flow', 'Enable interactive flow mode (continuous display)')
  .action(async (logfile: string, options: any) => {
    try {
      // ファイルの存在確認
      await fs.access(logfile);

      console.log(`Replaying conversation from: ${logfile}\n`);

      const reader = new LogReader();
      const entries = await reader.read(logfile);

      console.log(`Found ${entries.length} entries\n`);

      let filteredEntries = entries;
      if (options.filter) {
        filteredEntries = reader.filterByType(options.filter);
        console.log(`Showing only ${options.filter} messages\n`);
      }

      const renderer = new MessageRenderer();
      renderer.setDelay(parseInt(options.delay));
      renderer.setStreamingEnabled(options.streaming);

      if (options.interactive) {
        const controller = new PlaybackController(filteredEntries, renderer);
        await controller.startInteractive();
      } else if (options.interactiveFlow) {
        const flowController = new InteractiveFlowController(filteredEntries, renderer);
        await flowController.startInteractiveFlow();
      } else {
        await renderer.renderAll(filteredEntries);
        console.log('\n✅ Replay completed');
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
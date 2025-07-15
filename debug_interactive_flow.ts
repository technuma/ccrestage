#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-sys --unstable-sloppy-imports

/**
 * Interactive Flow Mode デバッグ版
 * 各エントリの処理状況を表示しながら実行
 */

import { LogReader } from "./src/LogReader.ts";
import { MessageRenderer } from "./src/MessageRenderer.ts";
import { InteractiveFlowController } from "./src/InteractiveFlowController.ts";

// デバッグ用のInteractiveFlowController
class DebugInteractiveFlowController extends InteractiveFlowController {
  constructor(entries: any[], renderer: any) {
    super(entries, renderer);
  }

  async startInteractiveFlow(): Promise<void> {
    console.log(`[DEBUG] Total entries: ${this.entries.length}`);
    console.log("[DEBUG] Entry types:");
    this.entries.forEach((entry, index) => {
      let contentInfo = "";
      if (entry.type === "user" && Array.isArray(entry.message.content)) {
        const types = entry.message.content.map(c => c.type).join(", ");
        contentInfo = ` (content types: ${types})`;
      } else if (entry.type === "assistant" && Array.isArray(entry.message.content)) {
        const types = entry.message.content.map(c => c.type).join(", ");
        contentInfo = ` (content types: ${types})`;
      }
      console.log(`  ${index}: ${entry.type}${contentInfo}`);
    });
    console.log("\n[DEBUG] Starting interactive flow...\n");
    
    await super.startInteractiveFlow();
  }
}

async function main() {
  const logfile = Deno.args[0];
  if (!logfile) {
    console.error("Usage: ./debug_interactive_flow.ts <logfile>");
    Deno.exit(1);
  }

  const reader = new LogReader();
  const entries = await reader.read(logfile);
  const renderer = new MessageRenderer();
  renderer.setStreamingEnabled(false);

  const controller = new DebugInteractiveFlowController(entries, renderer);
  await controller.startInteractiveFlow();
}

main().catch(console.error);
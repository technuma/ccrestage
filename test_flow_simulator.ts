#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-sys --unstable-sloppy-imports

/**
 * Interactive Flow Mode シミュレーター
 * キー入力を自動化してテスト
 */

import { LogReader } from "./src/LogReader.ts";
import { MessageRenderer } from "./src/MessageRenderer.ts";

async function simulateFlow() {
  const reader = new LogReader();
  const entries = await reader.read("f9446e57-7c4f-4948-828e-6d0c18de6874.jsonl");
  const renderer = new MessageRenderer();
  renderer.setStreamingEnabled(false);

  console.log("=== Flow Simulation ===");
  console.log(`Total entries: ${entries.length}\n`);

  let displayedMessages = [];
  let currentIndex = 0;

  // →キーのシミュレーション
  while (currentIndex < entries.length) {
    const entry = entries[currentIndex];
    
    console.log(`\n--- Index ${currentIndex} ---`);
    console.log(`Type: ${entry.type}`);
    
    if (entry.type === "user" && Array.isArray(entry.message.content)) {
      const types = entry.message.content.map(c => c.type).join(", ");
      console.log(`User content types: ${types}`);
      
      // tool_resultのみかチェック
      const hasOnlyToolResult = entry.message.content.every(c => c.type === "tool_result");
      if (hasOnlyToolResult) {
        console.log("⚠️  SKIP: tool_result only");
        currentIndex++;
        continue;
      }
    }
    
    if (entry.type === "assistant" && Array.isArray(entry.message.content)) {
      const types = entry.message.content.map(c => c.type).join(", ");
      console.log(`Assistant content types: ${types}`);
    }
    
    console.log("✅ DISPLAY: This message would be shown");
    const rendered = await renderer.renderEntry(entry);
    console.log(`Rendered: ${rendered}`);
    
    if (rendered) {
      displayedMessages.push(entry);
    }
    
    currentIndex++;
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Total entries: ${entries.length}`);
  console.log(`Displayed messages: ${displayedMessages.length}`);
  console.log(`Skipped: ${entries.length - displayedMessages.length}`);
}

simulateFlow().catch(console.error);
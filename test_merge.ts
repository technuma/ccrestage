#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-sys --unstable-sloppy-imports

import { LogReader } from "./src/LogReader.ts";

async function testMerge() {
  const reader = new LogReader();
  const entries = await reader.read("f9446e57-7c4f-4948-828e-6d0c18de6874.jsonl");
  
  console.log("=== Merge Test ===");
  console.log(`Total entries after merge: ${entries.length}`);
  
  // 問題のメッセージIDを持つエントリを検索
  const targetMessageId = "msg_01GkAW1HnqqkyAruQzM5UM95";
  const assistantEntries = entries.filter(e => 
    e.type === "assistant" && e.message.id === targetMessageId
  );
  
  console.log(`\nEntries with message ID ${targetMessageId}: ${assistantEntries.length}`);
  
  assistantEntries.forEach((entry, index) => {
    console.log(`\nEntry ${index + 1}:`);
    console.log(`UUID: ${entry.uuid}`);
    console.log(`Content types: ${entry.message.content.map(c => c.type).join(", ")}`);
  });
  
  // 5番目と6番目のエントリを確認（0ベースインデックス）
  console.log("\n=== Checking indices 5 and 6 ===");
  if (entries[5]) {
    console.log(`Index 5: ${entries[5].type}, UUID: ${entries[5].uuid}`);
    if (entries[5].type === "assistant") {
      console.log(`Content types: ${entries[5].message.content.map(c => c.type).join(", ")}`);
    }
  }
  if (entries[6]) {
    console.log(`Index 6: ${entries[6].type}, UUID: ${entries[6].uuid}`);
    if (entries[6].type === "assistant") {
      console.log(`Content types: ${entries[6].message.content.map(c => c.type).join(", ")}`);
    }
  }
}

testMerge().catch(console.error);
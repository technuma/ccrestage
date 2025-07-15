#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-sys --unstable-sloppy-imports

import { LogReader } from "./src/LogReader.ts";
import { MessageRenderer } from "./src/MessageRenderer.ts";

async function testDisplayFlow() {
  const reader = new LogReader();
  const entries = await reader.read("f9446e57-7c4f-4948-828e-6d0c18de6874.jsonl");
  const renderer = new MessageRenderer();
  renderer.setStreamingEnabled(false);
  
  console.log("=== Display Flow Test ===");
  
  // インデックス5（マージされたアシスタントメッセージ）を表示
  console.log("\n--- Testing index 5 (merged assistant message) ---");
  const entry5 = entries[5];
  console.log(`Type: ${entry5.type}`);
  console.log(`Content types: ${entry5.message.content.map(c => c.type).join(", ")}`);
  
  console.log("\nRendering:");
  const rendered5 = await renderer.renderEntry(entry5);
  console.log(`\nRendered result: ${rendered5}`);
  
  // インデックス6（tool_resultのみのユーザーメッセージ）を表示
  console.log("\n--- Testing index 6 (tool_result user message) ---");
  const entry6 = entries[6];
  console.log(`Type: ${entry6.type}`);
  if (Array.isArray(entry6.message.content)) {
    console.log(`Content types: ${entry6.message.content.map(c => c.type).join(", ")}`);
  }
  
  console.log("\nRendering:");
  const rendered6 = await renderer.renderEntry(entry6);
  console.log(`\nRendered result: ${rendered6}`);
  
  // インデックス7を確認
  console.log("\n--- Testing index 7 ---");
  const entry7 = entries[7];
  console.log(`Type: ${entry7.type}`);
  if (entry7.message.content) {
    console.log(`Content types: ${Array.isArray(entry7.message.content) ? entry7.message.content.map(c => c.type).join(", ") : "string"}`);
  }
  
  console.log("\nRendering:");
  const rendered7 = await renderer.renderEntry(entry7);
  console.log(`\nRendered result: ${rendered7}`);
}

testDisplayFlow().catch(console.error);
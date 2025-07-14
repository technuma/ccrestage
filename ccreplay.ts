#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-sys --unstable-sloppy-imports

/**
 * ccreplay - Claude Code会話ログリプレイツール
 * 
 * 使用方法:
 *   deno run --allow-read ccreplay.ts <logfile.jsonl>
 *   または
 *   ./ccreplay.ts <logfile.jsonl>
 */

import "./src/cli.ts";
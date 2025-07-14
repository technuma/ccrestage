# ccreplay

Claude Code会話ログリプレイライブラリ - Claude Codeの会話履歴をストリーミング風に再生します。

## 特徴

- 📜 JSONLフォーマットのログファイル読み込み
- 🎬 ストリーミング風のタイピングアニメーション
- 🎮 インタラクティブな再生制御
- 🎨 カラフルで見やすい表示
- 🔧 ツール実行結果の適切な表示

## インストール

```bash
npm install ccreplay
```

または、グローバルインストール:

```bash
npm install -g ccreplay
```

## 使用方法

### CLIツール

基本的な使用:
```bash
# Node.js版（ビルド必要）
ccreplay <logfile.jsonl>

# Deno版（ビルド不要、直接実行）
deno run --allow-read ccreplay.ts <logfile.jsonl>

# または実行権限を付与して
./ccreplay.ts <logfile.jsonl>
```

オプション:
```bash
# ストリーミング効果を無効化
ccreplay conversation.jsonl --no-streaming

# アシスタントメッセージのみ表示
ccreplay conversation.jsonl --filter assistant

# インタラクティブモード
ccreplay conversation.jsonl --interactive

# 表示速度の調整（ミリ秒）
ccreplay conversation.jsonl --delay 100
```

### インタラクティブモードの操作

`--interactive`オプションを使用すると、以下のキーボード操作が可能:

- **Space**: 一時停止/再開
- **→**: 次のメッセージへスキップ
- **←**: 前のメッセージへスキップ
- **↑**: 再生速度を上げる
- **↓**: 再生速度を下げる
- **h**: ヘルプ表示
- **q/Ctrl+C**: 終了

### ライブラリとして使用

```typescript
import { LogReader, MessageRenderer, PlaybackController } from 'ccreplay';

// ログファイルの読み込み
const reader = new LogReader();
const entries = await reader.read('conversation.jsonl');

// 基本的な再生
const renderer = new MessageRenderer();
await renderer.renderAll(entries);

// インタラクティブ再生
const controller = new PlaybackController(entries, renderer);
await controller.startInteractive();
```

## API

### LogReader

ログファイルの読み込みとパース:

```typescript
const reader = new LogReader();
const entries = await reader.read('path/to/log.jsonl');

// フィルタリング
const userMessages = reader.filterByType('user');
const assistantMessages = reader.filterByType('assistant');

// 特定のエントリを取得
const entry = reader.getByUuid('uuid-string');

// 子エントリを取得
const children = reader.getChildren('parent-uuid');
```

### MessageRenderer

メッセージの表示制御:

```typescript
const renderer = new MessageRenderer();

// ストリーミング効果の有効/無効
renderer.setStreamingEnabled(false);

// 表示速度の設定
renderer.setDelay(100);

// すべてのエントリを表示
await renderer.renderAll(entries);

// 個別のエントリを表示
await renderer.renderEntry(entry);
```

### StreamingEffect

タイピングアニメーション:

```typescript
const streaming = new StreamingEffect(5, 50); // 文字間5ms、単語間50ms

// テキストをストリーミング表示
await streaming.print("Hello, world!");

// 複数行をストリーミング表示
await streaming.printLines("Line 1\nLine 2\nLine 3");
```

## 開発

### Node.js版
```bash
# 依存関係のインストール
npm install

# 開発モード（ウォッチモード）
npm run dev

# ビルド
npm run build

# テスト
npm test

# Linting
npm run lint
```

### Deno版（ビルド不要）
```bash
# 直接実行
deno run --allow-read ccreplay.ts <logfile.jsonl>

# 開発モード（ファイル変更を監視）
deno run --allow-read --allow-write --allow-env --watch ccreplay.ts <logfile.jsonl>

# package.jsonのスクリプトを使用
npm run deno -- <logfile.jsonl>
npm run deno:dev -- <logfile.jsonl>
```

## ログファイル形式

ccreplayは、Claude CodeのJSONL形式のログファイルを読み込みます。各行は以下の構造を持つJSONオブジェクトです:

```json
{
  "uuid": "unique-id",
  "parentUuid": "parent-id",
  "type": "user" | "assistant",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "message": {
    "role": "user" | "assistant",
    "content": [
      {
        "type": "text",
        "text": "メッセージ内容"
      }
    ]
  },
  "toolUseResult": {
    "type": "create" | "edit",
    "filePath": "/path/to/file",
    "stdout": "実行結果"
  }
}
```

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します！バグ報告や機能提案は[Issues](https://github.com/yourname/ccreplay/issues)へお願いします。
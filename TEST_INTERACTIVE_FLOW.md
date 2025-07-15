# Interactive Flow Mode テスト手順

## 問題の症状
- WriteやRun commandの後に→キーを押すと空行が表示される
- 実際のメッセージではなく空行だけが出力される

## テスト方法

### 1. 通常の実行（Deno）
```bash
./ccreplay.ts f9446e57-7c4f-4948-828e-6d0c18de6874.jsonl --interactive-flow
```

### 2. デバッグ版の実行
```bash
./debug_interactive_flow.ts f9446e57-7c4f-4948-828e-6d0c18de6874.jsonl
```

### 3. 手動テストの手順

1. コマンドを実行
2. 説明画面で任意のキーを押して開始
3. →キーを数回押して以下のメッセージまで進む：
   ```
   ⏺ 現在の日時を表示する3行のシェルスクリプトを作成します。
   ```
4. もう一度→キーを押す
5. 期待される表示：
   ```
   ⏺ Write(/Users/kazuya.onuma/works/ccreplay/show_datetime.sh)
     ⎿  Created /Users/kazuya.onuma/works/ccreplay/show_datetime.sh
   ```
6. 実際の表示が空行の場合は問題あり

### 4. 問題のあるインデックス

以下のインデックスで問題が発生する可能性：
- Index 6: tool_result only (SKIP されるべき)
- Index 8: tool_result only (SKIP されるべき)
- Index 10: tool_result only (SKIP されるべき)

### 5. デバッグ情報の確認

問題が発生した場合、以下を確認：
- currentIndexの値
- displayedMessagesの長さ
- 実際に表示されたメッセージの内容

## 修正の確認ポイント

1. LogReaderでアシスタントメッセージが正しくマージされているか
2. showNextMessageでtool_resultがスキップされているか
3. displayMessageが正しくbooleanを返しているか
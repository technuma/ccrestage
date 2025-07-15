#!/bin/bash
# インタラクティブフローモードのテストスクリプト

echo "=== ccreplay Interactive Flow Mode Test ==="
echo "削除と再表示機能のテスト"
echo ""
echo "使い方:"
echo "1. 起動後、→キーを押してメッセージを進める"
echo "2. ←キーで前のメッセージを削除（画面再描画なし）"
echo "3. →キーで削除したメッセージを再表示"
echo "4. qキーで終了"
echo ""
echo "実行コマンド:"
echo "./ccreplay.ts f9446e57-7c4f-4948-828e-6d0c18de6874.jsonl --interactive-flow"
echo ""
echo "Enterキーを押して実行..."
read

./ccreplay.ts f9446e57-7c4f-4948-828e-6d0c18de6874.jsonl --interactive-flow
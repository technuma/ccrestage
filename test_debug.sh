#!/bin/bash
# デバッグモードでインタラクティブフローを実行

echo "=== Interactive Flow Debug Mode ==="
echo "DEBUGログが表示されます"
echo ""
echo "テスト手順:"
echo "1. →キーでメッセージを進める"
echo "2. Writeメッセージの後で問題が発生するか確認"
echo "3. デバッグログを確認"
echo ""
echo "Enterキーを押して開始..."
read

DEBUG=true ./ccreplay.ts f9446e57-7c4f-4948-828e-6d0c18de6874.jsonl --interactive-flow
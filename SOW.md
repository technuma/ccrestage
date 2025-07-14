# Claude Code 会話ログリプレイライブラリ 作業仕様書（SOW）

## 1. プロジェクト概要

### 1.1 目的
Claude Codeの会話ログ（JSONL形式）を読み込み、ストリーミング風に会話を再現するライブラリを開発する。

### 1.2 背景
Claude Codeの会話ログは構造化されたJSON形式で保存されており、この会話履歴を視覚的に再現することで、過去のやり取りを効果的に確認・共有できる。

## 2. 機能要件

### 2.1 コア機能
1. **ログファイル読み込み**
   - JSONL形式のファイルを解析
   - 各エントリのパース処理

2. **会話再現機能**
   - ユーザーメッセージとアシスタントメッセージの表示
   - タイムスタンプに基づく時系列表示
   - ストリーミング風のテキスト表示アニメーション

3. **ツール実行結果の表示**
   - Write, Edit, Bash等のツール実行結果を適切に表示
   - ファイル作成/編集の差分表示

### 2.2 追加機能
1. **インタラクティブ制御**
   - 再生速度の調整
   - 一時停止/再開
   - 特定メッセージへのジャンプ

2. **フィルタリング**
   - メッセージタイプでのフィルタ
   - 時間範囲での絞り込み

## 3. 技術仕様

### 3.1 データ構造
```typescript
interface LogEntry {
  uuid: string;
  parentUuid: string | null;
  type: 'user' | 'assistant';
  timestamp: string;
  message: {
    role: string;
    content: Array<{
      type: string;
      text?: string;
      name?: string;
      input?: any;
    }>;
  };
  toolUseResult?: {
    type: string;
    filePath?: string;
    content?: string;
    stdout?: string;
    stderr?: string;
  };
}
```

### 3.2 主要クラス
1. **LogReader**: ログファイルの読み込みとパース
2. **MessageRenderer**: メッセージの表示制御
3. **StreamingEffect**: ストリーミング風表示の実装
4. **PlaybackController**: 再生制御

## 4. 実装計画

### Phase 1: 基本実装（2-3日）
- LogReaderクラスの実装
- 基本的なメッセージ表示機能
- シンプルなCLIインターフェース

### Phase 2: ストリーミング効果（1-2日）
- StreamingEffectクラスの実装
- タイピングアニメーション
- ツール実行結果の適切な表示

### Phase 3: インタラクティブ機能（2-3日）
- PlaybackControllerの実装
- キーボード操作による制御
- 進行状況バーの表示

### Phase 4: 拡張機能（1-2日）
- フィルタリング機能
- 設定のカスタマイズ
- エクスポート機能

## 5. 成果物

1. **ライブラリ本体**
   - TypeScript/JavaScriptで実装
   - npm パッケージとして配布可能

2. **CLIツール**
   - `ccreplay <logfile.jsonl>` コマンドで実行

3. **ドキュメント**
   - README.md
   - API ドキュメント
   - 使用例

## 6. 技術スタック

- **言語**: TypeScript
- **実行環境**: Node.js
- **依存関係**:
  - 最小限のnpmパッケージ（colors, inquirer等）
  - ストリーミング表示用のターミナル制御ライブラリ

## 7. 品質基準

- ユニットテストのカバレッジ80%以上
- TypeScriptの厳格モードでのコンパイル成功
- エラーハンドリングの適切な実装
- パフォーマンス: 1000エントリのログを5秒以内に読み込み

## 8. リスクと対策

1. **大規模ログファイル**
   - ストリーミング読み込みの実装
   - メモリ効率的なデータ構造

2. **互換性**
   - 複数バージョンのログ形式に対応
   - エラー時の適切なフォールバック
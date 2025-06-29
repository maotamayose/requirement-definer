# 要件定義エージェント詳細仕様書

## 📋 基本情報

- **ファイル名**: `src/mastra/agents/requirement-agent.ts`
- **エージェント名**: 開発要件定義エージェント
- **主要目的**: ユーザーの開発要望を技術的観点から分析し、構造化された開発要件定義書を生成
- **使用モデル**: Google Gemini 1.5 Pro Latest

## 🎯 機能概要

### 核心機能
1. **要望分析**: ユーザーの開発要望を技術的観点から分析
2. **実現可能性評価**: 技術的制約と開発工数からの判定
3. **開発要件定義書生成**: 技術実装に特化したマークダウン形式での出力

### 判定基準
- **実装可能**: 技術的に実現可能で、工数が妥当
- **要検討**: 技術的課題があり、追加調査が必要
- **実装困難**: 技術的制約により実現が困難

## 🔧 技術仕様

### RuntimeContext型定義
```typescript
type RequirementAgentContext = {
  projectType?: string;        // プロジェクトタイプ
  techStack?: string;          // 推奨技術スタック
  complexity?: 'simple' | 'medium' | 'complex';  // 技術複雑度
  timeframe?: string;          // 開発期間
  budget?: 'low' | 'medium' | 'high';  // 開発予算制約
  existingProject?: boolean;   // 既存プロジェクト拡張フラグ
}
```

### 利用ツール
```typescript
tools: {
  codebaseAnalysisTool,      // コードベース分析
  requirementsReaderTool,    // 要件定義書読み込み
}
```

### メモリ設定
```typescript
memory: new Memory({
  storage: new LibSQLStore({
    url: 'file:../mastra.db',
  }),
})
```

## 📝 出力仕様

### 開発要件定義書構造
```markdown
# 開発要件定義書

## 開発概要
- **開発目的**: 実装する機能の技術的目標
- **対象システム**: 開発対象のシステム・モジュール
- **技術的価値**: 技術的な改善効果
- **完了基準**: 開発完了の技術的判定基準

## 機能要件（技術観点）
- **実装機能一覧**: 開発する機能の技術的詳細
- **API仕様**: エンドポイント、リクエスト/レスポンス形式
- **データ構造**: 必要なデータモデルとスキーマ
- **処理フロー**: システム内部の処理手順

## 技術仕様
- **推奨技術スタック**: フレームワーク、ライブラリ、ツール
- **アーキテクチャ方針**: レイヤー構成、設計パターン
- **データベース設計**: テーブル設計、インデックス戦略
- **外部連携**: API連携、サードパーティサービス

## 非機能要件（技術観点）
- **パフォーマンス**: レスポンス時間、スループット要件
- **スケーラビリティ**: 負荷対応、拡張性要件
- **セキュリティ**: 認証、認可、データ保護
- **保守性**: コード品質、テスト戦略

## 開発制約
- **技術制約**: 使用可能な技術、ライブラリの制限
- **環境制約**: 開発・本番環境の制約
- **互換性制約**: 既存システムとの互換性要件
- **リソース制約**: 開発チームのスキル、工数制約

## 実装計画
- **開発フェーズ**: 段階的な実装計画
- **マイルストーン**: 技術的な中間目標
- **依存関係**: 実装順序と依存関係
- **リスク要因**: 技術的リスクと対策

## テスト要件
- **テスト戦略**: 単体、統合、E2Eテストの方針
- **テストケース**: 主要な検証項目
- **品質基準**: コードカバレッジ、品質メトリクス
- **自動化方針**: CI/CD、自動テストの範囲

## 運用・保守要件
- **監視要件**: ログ、メトリクス、アラート
- **デプロイ要件**: リリース手順、ロールバック戦略
- **バックアップ要件**: データバックアップ、復旧手順
- **ドキュメント要件**: 技術文書、運用手順書
```

## 🚀 使用方法

### 基本的な使用例
```typescript
import { requirementAgent } from '../agents/requirement-agent';
import { RuntimeContext } from '@mastra/core/di';

// RuntimeContextの設定
const runtimeContext = new RuntimeContext();
runtimeContext.set('projectType', 'web-app');
runtimeContext.set('techStack', 'react-node');
runtimeContext.set('complexity', 'medium');
runtimeContext.set('budget', 'medium');

// エージェント実行
const result = await requirementAgent.generate(
  "オンラインショップに商品レビュー機能を追加したい",
  { runtimeContext }
);

console.log(result.text);
```

### 既存プロジェクト拡張の場合
```typescript
const runtimeContext = new RuntimeContext();
runtimeContext.set('projectType', 'web-app');
runtimeContext.set('techStack', 'react-typescript');
runtimeContext.set('existingProject', true);
runtimeContext.set('complexity', 'medium');

const result = await requirementAgent.generate(
  "既存のECサイトに在庫管理機能を追加したい。現在の要件定義書: ./REQUIREMENT/current.md",
  { runtimeContext }
);
```

### API経由での使用
```bash
curl -X POST http://localhost:4111/api/agents/requirementAgent/generate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "モバイルアプリに通知機能を追加したい",
    "runtimeContext": {
      "projectType": "mobile-app",
      "techStack": "react-native",
      "complexity": "simple",
      "budget": "low"
    }
  }'
```

## 🎨 動的指示文の仕組み

### 基本指示文
```typescript
let baseInstructions = `
あなたは経験豊富なテックリード兼システムアナリストAIです。

## 🎯 専門領域（責務）
- ユーザーの開発要望を技術的観点から分析
- 開発要件の明確化と構造化
- 技術仕様と実装方針の定義
- 開発工数とリスクの評価

## ❌ 対象外（他エージェントの責務）
- ビジネス価値の評価
- 市場分析や競合調査
- 詳細なアーキテクチャ設計
- UI/UXデザイン

利用可能なツール:
1. readRequirements: 既存の要件定義書を読み込み（既存プロジェクト拡張時）
2. analyzeCodebase: 既存コードベースの分析（既存プロジェクト拡張時）

## 処理フロー
1. **要望分析**: ユーザーの要望を技術的観点から分析し、実現可能性を評価
2. **情報収集**: 必要に応じてツールを使用して既存情報を収集
3. **要件定義**: 技術実装に特化した構造化された要件定義書を生成
`;
```

### 動的追加情報
RuntimeContextの値に応じて、以下の情報が動的に追加されます：

```typescript
// プロジェクトタイプ別ガイダンス
if (projectType) {
  baseInstructions += `\n\nプロジェクトタイプ: ${projectType}`;
}

// 技術スタック別アプローチ
if (techStack) {
  baseInstructions += `\n推奨技術スタック: ${techStack}`;
}

// 複雑度別アプローチ
if (complexity) {
  const complexityGuide: Record<string, string> = {
    simple: '基本的な実装、標準的なパターン使用',
    medium: '中程度の複雑さ、複数技術の組み合わせ',
    complex: '高度な実装、カスタム設計が必要'
  };
  baseInstructions += `\n技術複雑度: ${complexity} (${complexityGuide[complexity]})`;
}

// 予算制約別アプローチ
if (budget) {
  const budgetGuide: Record<string, string> = {
    low: '最小限の実装、既存ライブラリ活用',
    medium: 'バランスの取れた実装、適度なカスタマイズ',
    high: '高品質な実装、最新技術の積極活用'
  };
  baseInstructions += `\n開発予算: ${budget} (${budgetGuide[budget]})`;
}

// 既存プロジェクト拡張時の特別指示
if (existingProject) {
  baseInstructions += `\n\n既存プロジェクトの拡張案件です。まず既存の要件定義書とコードベースを分析してください。`;
}
```

## 🔍 品質保証

### 開発要件定義書の品質基準
1. **技術実装可能性**: 具体的で実装可能な技術仕様
2. **測定可能性**: 明確な技術的完了条件
3. **トレーサビリティ**: 要求から実装まで追跡可能
4. **テスト可能性**: 各要件が技術的に検証可能な形で記述

### 出力検証項目
- [ ] 開発概要が技術的観点で明確に記述されている
- [ ] 機能要件にAPI仕様とデータ構造が含まれている
- [ ] 技術仕様が実装可能なレベルで記述されている
- [ ] 非機能要件が技術的な測定基準で定義されている
- [ ] 実装計画に技術的依存関係が明記されている
- [ ] テスト要件が技術的検証方法を含んでいる

## 🐛 トラブルシューティング

### よくある問題と解決方法

#### 1. 要件定義書が生成されない
**原因**: RuntimeContextの設定不備
**解決方法**: 
```typescript
// 最低限必要な設定
runtimeContext.set('projectType', 'web-app');
runtimeContext.set('complexity', 'medium');
```

#### 2. 既存プロジェクト情報が読み込まれない
**原因**: ファイルパスの指定ミス
**解決方法**:
```typescript
// 正しいパス指定
runtimeContext.set('existingProject', true);
// メッセージ内でパスを明示
const message = "要件を改善したい。既存要件: ./REQUIREMENT/current.md";
```

#### 3. 出力が期待した技術仕様にならない
**原因**: 技術スタックの指定不備
**解決方法**: RuntimeContextでより具体的な技術スタックを指定

## 📊 パフォーマンス

### 実行時間目安
- **新規開発要件定義**: 30-60秒
- **既存プロジェクト拡張**: 60-120秒（分析時間含む）
- **簡単な技術要件**: 15-30秒

### リソース使用量
- **メモリ**: 約50-100MB
- **トークン消費**: 1,000-3,000トークン（入力）、2,000-5,000トークン（出力）

## 🔄 更新履歴

### v1.0.0 (2024年12月)
- 初回リリース
- RuntimeContext対応
- 動的指示文機能
- ツール統合（codebaseAnalysis, requirementsReader）
- 技術仕様中心の出力形式

### 今後の予定
- より詳細な技術分析機能
- コード生成機能との連携
- 自動テストケース生成

---

**最終更新**: 2024年12月  
**担当者**: 開発チーム  
**レビュー**: 未実施 
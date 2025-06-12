# 要件定義エージェント詳細仕様書

## 📋 基本情報

- **ファイル名**: `src/mastra/agents/requirement-agent.ts`
- **エージェント名**: 要件定義エージェント
- **主要目的**: ユーザー要望から構造化された要件定義書を生成
- **使用モデル**: Google Gemini 1.5 Pro Latest

## 🎯 機能概要

### 核心機能
1. **要望分析**: ユーザーの開発要望を多角的に分析
2. **実現可能性評価**: 技術的・ビジネス的観点からの判定
3. **要件定義書生成**: 構造化されたマークダウン形式での出力

### 判定基準
- **実現可能**: 技術的に実現可能で、明確な価値提案がある
- **要検討**: 追加情報が必要、または技術的課題がある  
- **却下**: 技術的に困難、または費用対効果が低い

## 🔧 技術仕様

### RuntimeContext型定義
```typescript
type RequirementAgentContext = {
  projectType?: string;        // プロジェクトタイプ
  targetAudience?: string;     // 対象ユーザー層
  complexity?: 'simple' | 'medium' | 'complex';  // 複雑度
  timeframe?: string;          // 希望期間
  budget?: 'low' | 'medium' | 'high';  // 予算制約
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

### 要件定義書構造
```markdown
# プロジェクト名

## 概要
- 目的と背景
- 対象ユーザー  
- 価値提案

## ユーザーストーリー
- As a [ユーザー], I want [機能] so that [価値]

## 機能要件
- 主要機能一覧
- 各機能の詳細仕様
- 受け入れ基準

## 非機能要件
- パフォーマンス要件
- セキュリティ要件
- 可用性要件

## 技術仕様
- 推奨技術スタック
- アーキテクチャ概要
- 統合要件

## 制約条件
- 時間的制約
- 予算制約
- 技術的制約

## 成果物・マイルストーン
- 開発フェーズ
- 成果物一覧
- 完了基準
```

## 🚀 使用方法

### 基本的な使用例
```typescript
import { requirementAgent } from '../agents/requirement-agent';
import { RuntimeContext } from '@mastra/core/di';

// RuntimeContextの設定
const runtimeContext = new RuntimeContext();
runtimeContext.set('projectType', 'web-app');
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
      "complexity": "simple",
      "budget": "low"
    }
  }'
```

## 🎨 動的指示文の仕組み

### 基本指示文
```typescript
let baseInstructions = `
あなたは優秀なプロダクトマネージャー兼ビジネスアナリストAIです。
ユーザーの開発要望を分析し、実現可能で価値のある要件定義書を作成する専門家として行動してください。

利用可能なツール:
1. readRequirements: 既存の要件定義書を読み込み（既存プロジェクト拡張時）
2. analyzeCodebase: 既存コードベースの分析（既存プロジェクト拡張時）

## 処理フロー
1. **要望分析**: ユーザーの要望を分析し、実現可能性を評価
2. **情報収集**: 必要に応じてツールを使用して既存情報を収集
3. **要件定義**: 構造化された要件定義書を生成
`;
```

### 動的追加情報
RuntimeContextの値に応じて、以下の情報が動的に追加されます：

```typescript
// プロジェクトタイプ別ガイダンス
if (projectType) {
  baseInstructions += `\n\nプロジェクトタイプ: ${projectType}`;
}

// 複雑度別アプローチ
if (complexity) {
  const complexityGuide: Record<string, string> = {
    simple: '基本的な機能のみ、短期間で実現可能',
    medium: '標準的な機能セット、適度な開発期間',
    complex: '高度な機能、長期的な開発計画'
  };
  baseInstructions += `\n複雑度: ${complexity} (${complexityGuide[complexity]})`;
}

// 予算制約別アプローチ
if (budget) {
  const budgetGuide: Record<string, string> = {
    low: 'コストを最小限に抑えた設計',
    medium: 'バランスの取れた機能と品質',
    high: '最高品質の実装を優先'
  };
  baseInstructions += `\n予算制約: ${budget} (${budgetGuide[budget]})`;
}

// 既存プロジェクト拡張時の特別指示
if (existingProject) {
  baseInstructions += `\n\n既存プロジェクトの拡張案件です。まず既存の要件定義書とコードベースを分析してください。`;
}
```

## 🔍 品質保証

### 要件定義書の品質基準
1. **SMART原則**: Specific, Measurable, Achievable, Relevant, Time-bound
2. **受け入れ基準**: 各機能に対する明確な完了条件
3. **トレーサビリティ**: ユーザーストーリーから実装まで追跡可能
4. **テスト可能性**: 各要件が検証可能な形で記述

### 出力検証項目
- [ ] プロジェクト概要が明確に記述されている
- [ ] ユーザーストーリーが適切な形式で記述されている
- [ ] 機能要件に受け入れ基準が含まれている
- [ ] 非機能要件が適切に考慮されている
- [ ] 技術仕様が実装可能なレベルで記述されている
- [ ] 制約条件が明確に定義されている

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

#### 3. 出力が期待した形式にならない
**原因**: 指示文の不備
**解決方法**: RuntimeContextでより具体的な指示を追加

## 📊 パフォーマンス

### 実行時間目安
- **新規要件定義**: 30-60秒
- **既存プロジェクト拡張**: 60-120秒（分析時間含む）
- **簡単な要件**: 15-30秒

### リソース使用量
- **メモリ**: 約50-100MB
- **トークン消費**: 1,000-3,000トークン（入力）、2,000-5,000トークン（出力）

## 🔄 更新履歴

### v1.0.0 (2024年12月)
- 初回リリース
- RuntimeContext対応
- 動的指示文機能
- ツール統合（codebaseAnalysis, requirementsReader）

### 今後の予定
- [ ] 要件品質チェック機能
- [ ] テンプレート機能
- [ ] リスク分析機能
- [ ] 競合分析機能

---

**最終更新**: 2024年12月  
**担当者**: 開発チーム  
**レビュー**: 未実施 
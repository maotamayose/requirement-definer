import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { codebaseAnalysisTool } from '../tools/codebase-analysis-tool';
import { requirementsReaderTool } from '../tools/requirements-tool';

// RuntimeContextの型定義
type RequirementAgentContext = {
  projectType?: string;        // 'web-app', 'mobile-app', 'api', 'desktop-app'
  techStack?: string;          // 'react', 'vue', 'node', 'python'
  complexity?: 'simple' | 'medium' | 'complex';
  timeframe?: string;          // '1ヶ月', '3ヶ月', '6ヶ月'
  budget?: 'low' | 'medium' | 'high';
  existingProject?: boolean;   // 既存プロジェクトの拡張かどうか
};

export const requirementAgent = new Agent({
  name: '開発要件定義エージェント',
  instructions: ({ runtimeContext }) => {
    // RuntimeContextから情報を取得
    const projectType = (runtimeContext?.get('projectType') as string) || '';
    const techStack = (runtimeContext?.get('techStack') as string) || '';
    const complexity = (runtimeContext?.get('complexity') as 'simple' | 'medium' | 'complex') || '';
    const timeframe = (runtimeContext?.get('timeframe') as string) || '';
    const budget = (runtimeContext?.get('budget') as 'low' | 'medium' | 'high') || '';
    const existingProject = (runtimeContext?.get('existingProject') as boolean) || false;

    let baseInstructions = `
    あなたは経験豊富なテックリード兼システムアナリストAIです。
    
    ## 🎯 専門領域（責務）
    - ユーザーの開発要望を技術的観点から分析
    - 開発要件の明確化と構造化
    - 技術仕様と実装方針の定義
    - 開発工数とリスクの評価
    
    ## 🛠️ 利用可能ツール
    - readRequirements: 既存の要件定義書を読み込み（既存プロジェクト拡張時）
    - analyzeCodebase: 既存コードベースの分析（既存プロジェクト拡張時）
    
    ## ❌ 対象外（他エージェントの責務）
    - ビジネス価値の評価
    - 市場分析や競合調査
    - 詳細なアーキテクチャ設計
    - UI/UXデザイン

    ## 📋 開発要件ジャッジ基準
    - **実装可能**: 技術的に実現可能で、工数が妥当
    - **要検討**: 技術的課題があり、追加調査が必要
    - **実装困難**: 技術的制約により実現が困難

    ## 📝 出力形式（開発要件定義書）
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

    応答には、挨拶や確認文は含めず、開発要件定義書のみを出力してください。
    ビジネス価値には言及せず、技術的実装に焦点を当ててください。
    `;

    // 動的に情報を追加
    if (projectType) {
      baseInstructions += `\n\nプロジェクトタイプ: ${projectType}`;
    }

    if (techStack) {
      baseInstructions += `\n推奨技術スタック: ${techStack}`;
    }

    if (complexity) {
      const complexityGuide: Record<string, string> = {
        simple: '基本的な実装、標準的なパターン使用',
        medium: '中程度の複雑さ、複数技術の組み合わせ',
        complex: '高度な実装、カスタム設計が必要'
      };
      baseInstructions += `\n技術複雑度: ${complexity} (${complexityGuide[complexity]})`;
    }

    if (timeframe) {
      baseInstructions += `\n開発期間: ${timeframe}`;
    }

    if (budget) {
      const budgetGuide: Record<string, string> = {
        low: '最小限の実装、既存ライブラリ活用',
        medium: 'バランスの取れた実装、適度なカスタマイズ',
        high: '高品質な実装、最新技術の積極活用'
      };
      baseInstructions += `\n開発予算: ${budget} (${budgetGuide[budget]})`;
    }

    if (existingProject) {
      baseInstructions += `\n\n既存プロジェクトの拡張案件です。まず既存の要件定義書とコードベースを分析してください。`;
    }

    return baseInstructions;
  },
  model: google('gemini-1.5-pro-latest'),
  tools: {
    codebaseAnalysisTool,
    requirementsReaderTool,
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
  }),
});

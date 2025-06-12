import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { requirementsReaderTool } from '../tools/requirements-tool';

// RuntimeContextの型定義
type RefineAgentContext = {
    requirementsPath?: string;   // 要件定義書のファイルパス
    focusArea?: string;          // 重点改善領域
    qualityLevel?: 'basic' | 'standard' | 'high';
    improvementType?: 'clarity' | 'completeness' | 'testability' | 'all';
};

export const refineAgent = new Agent({
    name: '要件品質改善エージェント',
    instructions: ({ runtimeContext }) => {
        // RuntimeContextから情報を取得
        const requirementsPath = (runtimeContext?.get('requirementsPath') as string) || '';
        const focusArea = (runtimeContext?.get('focusArea') as string) || '';
        const qualityLevel = (runtimeContext?.get('qualityLevel') as 'basic' | 'standard' | 'high') || 'standard';
        const improvementType = (runtimeContext?.get('improvementType') as string) || 'all';

        let baseInstructions = `
        あなたは要件定義の品質改善専門のシニアアナリストAIです。
        
        ## 🎯 専門領域（責務）
        - 既存要件定義書の品質分析
        - 要件の明確性・完全性・テスト可能性の向上
        - SMART基準に基づく要件の改善
        - 受け入れ基準の具体化
        
        ## 🛠️ 利用可能ツール
        - readRequirements: 既存の要件定義書を読み込み
        
        ## ❌ 対象外（他エージェントの責務）
        - 新規要件の作成
        - 技術的実装方法の提案
        - ビジネス価値の評価
        - アーキテクチャ設計

        ## 📋 品質改善基準
        - **明確性**: 曖昧な表現を具体的に修正
        - **完全性**: 不足している情報を特定・補完
        - **テスト可能性**: 検証可能な形に修正
        - **一貫性**: 矛盾や重複を解消

        ## 🔍 品質チェック項目
        ### SMART基準
        - **Specific**: 具体的で明確な記述
        - **Measurable**: 測定可能な基準
        - **Achievable**: 実現可能な内容
        - **Relevant**: 関連性のある要件
        - **Time-bound**: 期限が明確

        ### 受け入れ基準
        - Given-When-Then形式での記述
        - 具体的な入力・出力の定義
        - エラーケースの考慮
        - 境界値の明示

        ## 📝 出力形式（改善された要件定義書）
        # 改善された要件定義書

        ## 品質改善サマリー
        - **改善項目数**: X件
        - **主要改善点**: 明確性、完全性、テスト可能性
        - **品質スコア**: Before: X/10 → After: Y/10

        ## [元の構造を維持しつつ改善された内容]
        
        ## 改善詳細
        ### 明確性の改善
        - 曖昧だった表現 → 具体的な表現
        
        ### 完全性の改善
        - 不足していた情報 → 補完された情報
        
        ### テスト可能性の改善
        - 検証困難だった要件 → 検証可能な要件

        ## 残課題・推奨事項
        - さらなる改善が必要な領域
        - 追加で確認すべき事項
        - 次のステップの提案

        応答には、挨拶や確認文は含めず、改善された要件定義書のみを出力してください。
        改善点を明確に示し、品質向上の根拠を説明してください。
        `;

        // 動的に情報を追加
        if (requirementsPath) {
            baseInstructions += `\n\n対象ファイル: ${requirementsPath}`;
        }

        if (focusArea) {
            baseInstructions += `\n重点改善領域: ${focusArea}`;
        }

        if (qualityLevel) {
            const qualityGuide: Record<string, string> = {
                basic: '基本的な品質改善（明確性中心）',
                standard: '標準的な品質改善（SMART基準適用）',
                high: '高品質な改善（包括的な品質向上）'
            };
            baseInstructions += `\n品質レベル: ${qualityLevel} (${qualityGuide[qualityLevel]})`;
        }

        if (improvementType) {
            const typeGuide: Record<string, string> = {
                clarity: '明確性の改善に特化',
                completeness: '完全性の改善に特化',
                testability: 'テスト可能性の改善に特化',
                all: '全般的な品質改善'
            };
            baseInstructions += `\n改善タイプ: ${improvementType} (${typeGuide[improvementType] || '全般的な改善'})`;
        }

        return baseInstructions;
    },
    model: google('gemini-1.5-pro-latest'),
    tools: {
        requirementsReaderTool,
    },
    memory: new Memory({
        storage: new LibSQLStore({
            url: 'file:../mastra.db',
        }),
    }),
});

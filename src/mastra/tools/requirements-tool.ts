import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const requirementsReaderTool = createTool({
    id: 'readRequirements',
    description: '既存の要件定義書を読み込みます。ファイルパスを指定して内容を取得できます。',
    inputSchema: z.object({
        filePath: z.string().describe('要件定義書のファイルパス（例: requirements.md, docs/requirements.md）'),
    }),
    outputSchema: z.object({
        content: z.string(),
        exists: z.boolean(),
        message: z.string(),
    }),
    execute: async ({ context }) => {
        const { filePath } = context;

        try {
            // プロジェクトルートから相対パスで読み込み
            const fullPath = join(process.cwd(), filePath);

            if (!existsSync(fullPath)) {
                return {
                    content: '',
                    exists: false,
                    message: `ファイルが見つかりません: ${filePath}`,
                };
            }

            const content = readFileSync(fullPath, 'utf-8');

            return {
                content,
                exists: true,
                message: `要件定義書を正常に読み込みました: ${filePath}`,
            };
        } catch (error) {
            return {
                content: '',
                exists: false,
                message: `ファイル読み込みエラー: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    },
});

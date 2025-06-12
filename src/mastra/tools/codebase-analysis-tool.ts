import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, extname, relative } from 'path';
import { globSync } from 'glob';

// 分析結果の型定義
const FileInfoSchema = z.object({
    path: z.string(),
    type: z.enum(['file', 'directory']),
    size: z.number(),
    extension: z.string().optional(),
    isConfig: z.boolean(),
    isSource: z.boolean(),
    isDocumentation: z.boolean(),
});

const CodebaseAnalysisSchema = z.object({
    projectStructure: z.object({
        totalFiles: z.number(),
        totalDirectories: z.number(),
        sourceFiles: z.array(FileInfoSchema),
        configFiles: z.array(FileInfoSchema),
        documentFiles: z.array(FileInfoSchema),
    }),
    techStack: z.object({
        languages: z.array(z.string()),
        frameworks: z.array(z.string()),
        dependencies: z.array(z.string()),
    }),
    summary: z.string(),
});

export const codebaseAnalysisTool = createTool({
    id: 'analyzeCodebase',
    description: 'ローカルのコードベースを探索・分析し、プロジェクト構造や技術スタックを特定します',
    inputSchema: z.object({
        projectPath: z.string().describe('分析対象のプロジェクトパス（相対パスまたは絶対パス）'),
        maxDepth: z.number().default(5).describe('ディレクトリの探索深度（デフォルト: 5）'),
        excludePatterns: z.array(z.string()).default([
            'node_modules',
            '.git',
            'dist',
            'build',
            '.next',
            'coverage',
            '.nyc_output'
        ]).describe('除外するディレクトリ/ファイルパターン'),
        includeExtensions: z.array(z.string()).default([
            '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs',
            '.md', '.json', '.yaml', '.yml', '.toml', '.xml'
        ]).describe('分析対象のファイル拡張子'),
    }),
    outputSchema: CodebaseAnalysisSchema,
    execute: async ({ context }) => {
        const { projectPath, maxDepth, excludePatterns, includeExtensions } = context;

        try {
            // プロジェクトパスの解決
            const fullPath = projectPath.startsWith('/')
                ? projectPath
                : join(process.cwd(), projectPath);

            if (!existsSync(fullPath)) {
                throw new Error(`指定されたパス が見つかりません: ${projectPath}`);
            }

            // ファイル探索の実行
            const analysisResult = await analyzeProject(fullPath, maxDepth, excludePatterns, includeExtensions);

            return analysisResult;
        } catch (error) {
            throw new Error(`コードベース分析エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
});

// プロジェクト分析の主要ロジック
async function analyzeProject(
    projectPath: string,
    maxDepth: number,
    excludePatterns: string[],
    includeExtensions: string[]
): Promise<z.infer<typeof CodebaseAnalysisSchema>> {
    const sourceFiles: z.infer<typeof FileInfoSchema>[] = [];
    const configFiles: z.infer<typeof FileInfoSchema>[] = [];
    const documentFiles: z.infer<typeof FileInfoSchema>[] = [];

    let totalFiles = 0;
    let totalDirectories = 0;

    // ファイル探索の実行
    const allFiles = globSync('**/*', {
        cwd: projectPath,
        ignore: excludePatterns,
        nodir: false,
        maxDepth,
    });

    for (const filePath of allFiles) {
        const fullFilePath = join(projectPath, filePath);
        const stats = statSync(fullFilePath);
        const ext = extname(filePath);

        if (stats.isDirectory()) {
            totalDirectories++;
            continue;
        }

        if (!includeExtensions.includes(ext)) {
            continue;
        }

        totalFiles++;

        const fileInfo: z.infer<typeof FileInfoSchema> = {
            path: filePath,
            type: 'file',
            size: stats.size,
            extension: ext,
            isConfig: isConfigFile(filePath),
            isSource: isSourceFile(ext),
            isDocumentation: isDocumentationFile(filePath, ext),
        };

        // ファイルタイプ別に分類
        if (fileInfo.isConfig) {
            configFiles.push(fileInfo);
        } else if (fileInfo.isDocumentation) {
            documentFiles.push(fileInfo);
        } else if (fileInfo.isSource) {
            sourceFiles.push(fileInfo);
        }
    }

    // 技術スタック分析
    const techStack = await analyzeTechStack(projectPath, configFiles, sourceFiles);

    // サマリー生成
    const summary = generateProjectSummary(sourceFiles, configFiles, documentFiles, techStack);

    return {
        projectStructure: {
            totalFiles,
            totalDirectories,
            sourceFiles,
            configFiles,
            documentFiles,
        },
        techStack,
        summary,
    };
}

// ファイルタイプ判定関数群
function isConfigFile(filePath: string): boolean {
    const configPatterns = [
        'package.json', 'tsconfig.json', 'webpack.config.js', 'vite.config.ts',
        'next.config.js', 'tailwind.config.js', '.env', '.env.local',
        'docker-compose.yml', 'Dockerfile', '.gitignore', '.eslintrc'
    ];

    return configPatterns.some(pattern =>
        filePath.includes(pattern) || filePath.endsWith(pattern)
    );
}

function isSourceFile(extension: string): boolean {
    const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.php'];
    return sourceExtensions.includes(extension);
}

function isDocumentationFile(filePath: string, extension: string): boolean {
    return extension === '.md' ||
        filePath.includes('README') ||
        filePath.includes('docs/') ||
        filePath.includes('CHANGELOG');
}

// 技術スタック分析
async function analyzeTechStack(
    projectPath: string,
    configFiles: z.infer<typeof FileInfoSchema>[],
    sourceFiles: z.infer<typeof FileInfoSchema>[]
): Promise<z.infer<typeof CodebaseAnalysisSchema>['techStack']> {
    const languages: string[] = [];
    const frameworks: string[] = [];
    const dependencies: string[] = [];

    // 言語の特定
    const extensions = [...new Set(sourceFiles.map(f => f.extension).filter(Boolean))];
    const languageMap: Record<string, string> = {
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript',
        '.js': 'JavaScript',
        '.jsx': 'JavaScript',
        '.py': 'Python',
        '.java': 'Java',
        '.go': 'Go',
        '.rs': 'Rust',
        '.php': 'PHP',
    };

    extensions.forEach(ext => {
        if (ext && languageMap[ext]) {
            languages.push(languageMap[ext]);
        }
    });

    // package.jsonからフレームワーク・依存関係を分析
    const packageJsonFile = configFiles.find(f => f.path.endsWith('package.json'));
    if (packageJsonFile) {
        try {
            const packageJsonPath = join(projectPath, packageJsonFile.path);
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies,
            };

            dependencies.push(...Object.keys(allDeps));

            // フレームワークの特定
            const frameworkPatterns: Record<string, string> = {
                'react': 'React',
                'next': 'Next.js',
                'vue': 'Vue.js',
                'nuxt': 'Nuxt.js',
                'angular': 'Angular',
                'express': 'Express.js',
                'fastify': 'Fastify',
                'nestjs': 'NestJS',
                '@mastra/core': 'Mastra',
                'zendframework': 'Zend Framework',
                'laravel': 'Laravel',
                'symfony': 'Symfony',
                'cakephp': 'CakePHP',
                'codeigniter': 'CodeIgniter',
                'yii': 'Yii',
                'phalcon': 'Phalcon',
            };

            Object.keys(allDeps).forEach(dep => {
                Object.entries(frameworkPatterns).forEach(([pattern, framework]) => {
                    if (dep.includes(pattern) && !frameworks.includes(framework)) {
                        frameworks.push(framework);
                    }
                });
            });
        } catch (error) {
            console.warn('package.json の解析に失敗しました:', error);
        }
    }

    return {
        languages: [...new Set(languages)],
        frameworks: [...new Set(frameworks)],
        dependencies: dependencies.slice(0, 20), // 上位20個に制限
    };
}

// プロジェクトサマリー生成
function generateProjectSummary(
    sourceFiles: z.infer<typeof FileInfoSchema>[],
    configFiles: z.infer<typeof FileInfoSchema>[],
    documentFiles: z.infer<typeof FileInfoSchema>[],
    techStack: z.infer<typeof CodebaseAnalysisSchema>['techStack']
): string {
    const totalSourceFiles = sourceFiles.length;
    const totalConfigFiles = configFiles.length;
    const totalDocFiles = documentFiles.length;

    return `
プロジェクト分析結果:
- 総ソースファイル数: ${totalSourceFiles}
- 設定ファイル数: ${totalConfigFiles}  
- ドキュメントファイル数: ${totalDocFiles}
- 使用言語: ${techStack.languages.join(', ') || 'なし'}
- フレームワーク: ${techStack.frameworks.join(', ') || 'なし'}
- 主要依存関係: ${techStack.dependencies.slice(0, 5).join(', ')}
  `.trim();
}

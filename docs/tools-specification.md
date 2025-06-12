# Mastraツール仕様書

## 📋 概要

このドキュメントでは、Mastraエージェントで使用する共通ツールの詳細仕様をまとめています。

## 🛠️ ツール一覧

### 1. requirementsReaderTool

#### 📝 基本情報
- **ファイル名**: `src/mastra/tools/requirements-tool.ts`
- **ツールID**: `read-requirements`
- **目的**: 要件定義書ファイルの読み込みと解析

#### 🔧 技術仕様
```typescript
export const requirementsReaderTool = createTool({
  id: "read-requirements",
  description: "要件定義書ファイルを読み込み、内容を解析します",
  inputSchema: z.object({
    filePath: z.string().describe("要件定義書のファイルパス"),
  }),
  outputSchema: z.object({
    content: z.string().describe("ファイルの内容"),
    metadata: z.object({
      fileSize: z.number(),
      lastModified: z.string(),
      encoding: z.string(),
    }),
  }),
  execute: async ({ context }) => {
    // 実装詳細
  },
});
```

#### 📊 入力・出力仕様

**入力パラメータ**:
```typescript
{
  filePath: string  // 例: "./REQUIREMENT/current-requirements.md"
}
```

**出力データ**:
```typescript
{
  content: string,     // ファイルの全内容
  metadata: {
    fileSize: number,    // ファイルサイズ（バイト）
    lastModified: string, // 最終更新日時（ISO形式）
    encoding: string     // 文字エンコーディング
  }
}
```

#### 🚀 使用例
```typescript
// エージェント内での使用
const result = await context.useTool("read-requirements", {
  filePath: "./REQUIREMENT/current-requirements.md"
});

console.log("要件定義書の内容:", result.content);
console.log("ファイルサイズ:", result.metadata.fileSize);
```

#### 🔍 対応ファイル形式
- **Markdown**: `.md`, `.markdown`
- **テキスト**: `.txt`
- **その他**: UTF-8エンコーディングのテキストファイル

#### ⚠️ 制限事項
- ファイルサイズ上限: 10MB
- 対応エンコーディング: UTF-8のみ
- バイナリファイルは非対応

---

### 2. codebaseAnalysisTool

#### 📝 基本情報
- **ファイル名**: `src/mastra/tools/codebase-analysis-tool.ts`
- **ツールID**: `analyze-codebase`
- **目的**: プロジェクト構造とコードベースの包括的分析

#### 🔧 技術仕様
```typescript
export const codebaseAnalysisTool = createTool({
  id: "analyze-codebase",
  description: "プロジェクトの構造とコードベースを分析します",
  inputSchema: z.object({
    projectPath: z.string().describe("プロジェクトのルートパス"),
    includeNodeModules: z.boolean().optional().default(false),
    maxDepth: z.number().optional().default(5),
  }),
  outputSchema: z.object({
    structure: z.object({
      directories: z.array(z.string()),
      files: z.array(z.string()),
      totalFiles: z.number(),
      totalDirectories: z.number(),
    }),
    techStack: z.object({
      languages: z.record(z.number()),
      frameworks: z.array(z.string()),
      databases: z.array(z.string()),
      tools: z.array(z.string()),
    }),
    dependencies: z.object({
      production: z.array(z.string()),
      development: z.array(z.string()),
      total: z.number(),
    }),
    fileTypes: z.record(z.number()),
    complexity: z.object({
      score: z.number().min(1).max(10),
      level: z.enum(['low', 'medium', 'high']),
      factors: z.array(z.string()),
    }),
  }),
  execute: async ({ context }) => {
    // 実装詳細
  },
});
```

#### 📊 入力・出力仕様

**入力パラメータ**:
```typescript
{
  projectPath: string,           // プロジェクトルートパス
  includeNodeModules?: boolean,  // node_modulesを含むか（デフォルト: false）
  maxDepth?: number             // 探索する最大階層（デフォルト: 5）
}
```

**出力データ**:
```typescript
{
  structure: {
    directories: string[],      // ディレクトリ一覧
    files: string[],           // ファイル一覧
    totalFiles: number,        // 総ファイル数
    totalDirectories: number   // 総ディレクトリ数
  },
  techStack: {
    languages: Record<string, number>,  // 言語別ファイル数
    frameworks: string[],               // 検出されたフレームワーク
    databases: string[],               // データベース関連技術
    tools: string[]                    // 開発ツール
  },
  dependencies: {
    production: string[],      // 本番依存関係
    development: string[],     // 開発依存関係
    total: number             // 総依存関係数
  },
  fileTypes: Record<string, number>,  // 拡張子別ファイル数
  complexity: {
    score: number,            // 複雑度スコア（1-10）
    level: 'low' | 'medium' | 'high',  // 複雑度レベル
    factors: string[]         // 複雑度に影響する要因
  }
}
```

#### 🚀 使用例
```typescript
// エージェント内での使用
const analysis = await context.useTool("analyze-codebase", {
  projectPath: "./",
  includeNodeModules: false,
  maxDepth: 3
});

console.log("技術スタック:", analysis.techStack);
console.log("複雑度:", analysis.complexity);
```

#### 🔍 分析対象

**ファイル種別**:
- **ソースコード**: `.ts`, `.js`, `.tsx`, `.jsx`, `.py`, `.java`, `.go`, etc.
- **設定ファイル**: `package.json`, `tsconfig.json`, `.env`, etc.
- **ドキュメント**: `.md`, `.txt`, `.rst`
- **スタイル**: `.css`, `.scss`, `.less`

**検出技術**:
- **フレームワーク**: React, Vue, Angular, Express, Next.js, etc.
- **データベース**: MongoDB, PostgreSQL, MySQL, Redis, etc.
- **ツール**: Webpack, Vite, ESLint, Prettier, etc.

#### 📈 複雑度算出ロジック

**評価要因**:
1. **ファイル数**: 総ファイル数
2. **ディレクトリ階層**: 最大階層の深さ
3. **依存関係数**: package.jsonの依存関係数
4. **言語多様性**: 使用言語の種類数
5. **設定ファイル数**: 設定ファイルの複雑さ

**スコア計算**:
```typescript
const complexityScore = Math.min(10, Math.max(1, 
  (fileCount / 100) * 2 +
  (maxDepth / 5) * 2 +
  (dependencyCount / 50) * 2 +
  (languageCount / 3) * 2 +
  (configComplexity / 10) * 2
));
```

#### ⚠️ 制限事項
- 最大分析ファイル数: 10,000ファイル
- 最大探索階層: 10階層
- タイムアウト: 60秒
- メモリ使用量上限: 500MB

---

## 🔄 ツール連携パターン

### パターン1: 要件分析 → コードベース分析
```typescript
// 1. 既存要件定義書を読み込み
const requirements = await context.useTool("read-requirements", {
  filePath: "./REQUIREMENT/current.md"
});

// 2. コードベースを分析
const codebase = await context.useTool("analyze-codebase", {
  projectPath: "./"
});

// 3. 両方の情報を統合して判断
const analysis = `
既存要件: ${requirements.content}
技術スタック: ${JSON.stringify(codebase.techStack)}
複雑度: ${codebase.complexity.level}
`;
```

### パターン2: 段階的分析
```typescript
// 1. 高レベル分析
const overview = await context.useTool("analyze-codebase", {
  projectPath: "./",
  maxDepth: 2
});

// 2. 詳細分析（必要に応じて）
if (overview.complexity.level === 'high') {
  const detailed = await context.useTool("analyze-codebase", {
    projectPath: "./src",
    maxDepth: 5
  });
}
```

## 🧪 テスト仕様

### requirementsReaderTool テスト
```typescript
describe('requirementsReaderTool', () => {
  it('should read markdown file correctly', async () => {
    const result = await requirementsReaderTool.execute({
      context: { filePath: './test/sample.md' }
    });
    
    expect(result.content).toContain('# Sample Requirements');
    expect(result.metadata.fileSize).toBeGreaterThan(0);
  });

  it('should handle non-existent file', async () => {
    await expect(requirementsReaderTool.execute({
      context: { filePath: './non-existent.md' }
    })).rejects.toThrow('File not found');
  });
});
```

### codebaseAnalysisTool テスト
```typescript
describe('codebaseAnalysisTool', () => {
  it('should analyze project structure', async () => {
    const result = await codebaseAnalysisTool.execute({
      context: { projectPath: './test-project' }
    });
    
    expect(result.structure.totalFiles).toBeGreaterThan(0);
    expect(result.techStack.languages).toBeDefined();
    expect(result.complexity.score).toBeBetween(1, 10);
  });
});
```

## 📊 パフォーマンス指標

### requirementsReaderTool
- **小ファイル** (< 1KB): ~10ms
- **中ファイル** (1KB-100KB): ~50ms
- **大ファイル** (100KB-1MB): ~200ms
- **超大ファイル** (1MB-10MB): ~1000ms

### codebaseAnalysisTool
- **小プロジェクト** (< 100ファイル): ~500ms
- **中プロジェクト** (100-1000ファイル): ~2000ms
- **大プロジェクト** (1000-5000ファイル): ~10000ms
- **超大プロジェクト** (5000+ファイル): ~30000ms

## 🔒 セキュリティ考慮事項

### ファイルアクセス制限
- プロジェクトディレクトリ外へのアクセス禁止
- シンボリックリンクの追跡制限
- 機密ファイルの除外（`.env`, `.secret`, etc.）

### データ保護
- 読み込んだファイル内容の一時保存のみ
- 機密情報の自動マスキング
- ログ出力時の個人情報除外

## 🔄 更新履歴

### v1.0.0 (2024年12月)
- 初回リリース
- requirementsReaderTool実装
- codebaseAnalysisTool実装
- 基本的なエラーハンドリング

### 今後の予定
- [ ] バイナリファイル対応
- [ ] Git履歴分析機能
- [ ] コード品質メトリクス
- [ ] セキュリティ脆弱性検出

---

**最終更新**: 2024年12月  
**担当者**: 開発チーム  
**レビュー**: 未実施 
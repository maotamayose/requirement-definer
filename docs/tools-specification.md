# Mastraツール仕様書

## 📋 概要

このドキュメントでは、Mastraエージェントで使用する共通ツールの詳細仕様をまとめています。

## 🛠️ ツール一覧

### 1. requirementsReaderTool

#### 📝 基本情報
- **ファイル名**: `src/mastra/tools/requirements-tool.ts`
- **ツールID**: `readRequirements`
- **目的**: 要件定義書ファイルの読み込みと解析

#### 🔧 技術仕様
```typescript
export const requirementsReaderTool = createTool({
  id: "readRequirements",
  description: "既存の要件定義書を読み込みます。ファイルパスを指定して内容を取得できます。",
  inputSchema: z.object({
    filePath: z.string().describe("要件定義書のファイルパス"),
  }),
  outputSchema: z.object({
    content: z.string().describe("ファイルの内容"),
    exists: z.boolean().describe("ファイルの存在確認"),
    message: z.string().describe("処理結果メッセージ"),
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
  exists: boolean,     // ファイルの存在確認
  message: string,     // 処理結果メッセージ
}
```

#### 🚀 使用例
```typescript
// エージェント内での使用
const result = await context.useTool("readRequirements", {
  filePath: "./REQUIREMENT/current-requirements.md"
});

console.log("要件定義書の内容:", result.content);
console.log("ファイル存在:", result.exists);
```

#### 🔍 対応ファイル形式
- **Markdown**: `.md`, `.markdown`
- **テキスト**: `.txt`
- **その他**: UTF-8エンコーディングのテキストファイル

#### ⚠️ 制限事項
- 対応エンコーディング: UTF-8のみ
- バイナリファイルは非対応
- 相対パスはプロジェクトルートから

---

### 2. codebaseAnalysisTool

#### 📝 基本情報
- **ファイル名**: `src/mastra/tools/codebase-analysis-tool.ts`
- **ツールID**: `analyzeCodebase`
- **目的**: プロジェクト構造とコードベースの包括的分析

#### 🔧 技術仕様
```typescript
export const codebaseAnalysisTool = createTool({
  id: "analyzeCodebase",
  description: "ローカルのコードベースを探索・分析し、プロジェクト構造や技術スタックを特定します",
  inputSchema: z.object({
    projectPath: z.string().describe("分析対象のプロジェクトパス"),
    maxDepth: z.number().default(5).describe("ディレクトリの探索深度"),
    excludePatterns: z.array(z.string()).default([
      'node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.nyc_output'
    ]).describe("除外するディレクトリ/ファイルパターン"),
    includeExtensions: z.array(z.string()).default([
      '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs',
      '.md', '.json', '.yaml', '.yml', '.toml', '.xml'
    ]).describe("分析対象のファイル拡張子"),
  }),
  outputSchema: z.object({
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
  maxDepth?: number,            // 探索する最大階層（デフォルト: 5）
  excludePatterns?: string[],   // 除外パターン
  includeExtensions?: string[]  // 対象ファイル拡張子
}
```

**出力データ**:
```typescript
{
  projectStructure: {
    totalFiles: number,           // 総ファイル数
    totalDirectories: number,     // 総ディレクトリ数
    sourceFiles: FileInfo[],      // ソースファイル一覧
    configFiles: FileInfo[],      // 設定ファイル一覧
    documentFiles: FileInfo[],    // ドキュメントファイル一覧
  },
  techStack: {
    languages: string[],          // 検出された言語
    frameworks: string[],         // 検出されたフレームワーク
    dependencies: string[],       // 依存関係一覧
  },
  summary: string                 // 分析結果のサマリー
}
```

#### 🚀 使用例
```typescript
// エージェント内での使用
const analysis = await context.useTool("analyzeCodebase", {
  projectPath: "./",
  maxDepth: 3
});

console.log("技術スタック:", analysis.techStack);
console.log("プロジェクト構造:", analysis.projectStructure);
```

#### 🔍 分析対象

**ファイル種別**:
- **ソースコード**: `.ts`, `.js`, `.tsx`, `.jsx`, `.py`, `.java`, `.go`, etc.
- **設定ファイル**: `package.json`, `tsconfig.json`, `.env`, etc.
- **ドキュメント**: `.md`, `.txt`, `.rst`

**検出技術**:
- **フレームワーク**: React, Vue, Angular, Express, Next.js, etc.
- **ツール**: Webpack, Vite, ESLint, Prettier, etc.
- **言語**: TypeScript, JavaScript, Python, Java, Go, etc.

#### 📈 分析ロジック

**評価要因**:
1. **ファイル分類**: ソースコード、設定、ドキュメントの分類
2. **技術検出**: package.jsonや設定ファイルからの技術スタック検出
3. **依存関係**: 依存パッケージの分析
4. **プロジェクト構造**: ディレクトリ構造とファイル配置の分析

#### ⚠️ 制限事項
- 探索深度上限: 10階層
- 対象ファイル数上限: 10,000ファイル
- バイナリファイルは除外
- シンボリックリンクは追跡しない

---

## 🔧 共通仕様

### エラーハンドリング

**共通エラー形式**:
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

**エラーコード一覧**:
- `FILE_NOT_FOUND`: ファイルが見つからない
- `ACCESS_DENIED`: ファイルアクセス権限がない
- `INVALID_PATH`: 無効なパス指定
- `PARSING_ERROR`: ファイル解析エラー
- `SYSTEM_ERROR`: システムレベルのエラー

### パフォーマンス

**実行時間目安**:
- `readRequirements`: 100-500ms
- `analyzeCodebase`: 1-10秒（プロジェクトサイズによる）

**メモリ使用量**:
- `readRequirements`: ~10MB
- `analyzeCodebase`: ~50-200MB

### ログ出力

**ログレベル**:
- `DEBUG`: 詳細な実行情報
- `INFO`: 通常の処理情報
- `WARN`: 警告（処理は継続）
- `ERROR`: エラー（処理停止）

## 🧪 テスト

### 単体テスト

**テストファイル**:
- `tests/tools/requirements-tool.test.ts`
- `tests/tools/codebase-analysis-tool.test.ts`

**実行方法**:
```bash
npm test -- --testPathPattern=tools
```

### 統合テスト

**テストシナリオ**:
1. 実際のプロジェクトファイルを使った分析
2. エージェントとツールの連携動作
3. エラーケースの検証

## 📚 関連資料

- [Mastra Core Tools Documentation](https://mastra.ai/docs/tools)
- [エージェント設計ガイド](./agents-overview.md)
- [テスト戦略ドキュメント](./testing-strategy.md)

---

**最終更新**: 2024年12月  
**バージョン**: 2.0.0（実装統一版） 
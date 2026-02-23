# npm Package Architecture Research

**Research Date:** 2026-02-18
**Product:** @blackunicorn/bonklm
**Purpose:** Best practices for building extensible, pluggable npm packages in TypeScript/JavaScript

---

## Table of Contents

1. [Plugin Architecture Patterns](#1-plugin-architecture-patterns)
2. [Detection Engine Patterns](#2-detection-engine-patterns)
3. [TypeScript Plugin Systems](#3-typescript-plugin-systems)
4. [Package Distribution Best Practices](#4-package-distribution-best-practices)
5. [Synthesis & Recommendations](#5-synthesis--recommendations)

---

## 1. Plugin Architecture Patterns

### 1.1 ESLint Plugin Architecture

**Source:** [ESLint Plugin Documentation](https://eslint.org/docs/latest/extend/plugins)

ESLint uses a structured object-based plugin system with clear separation of concerns:

```typescript
interface ESLintPlugin {
  // Plugin metadata
  meta?: {
    name: string;
    version?: string;
  };

  // Rule definitions - core extensibility point
  rules?: {
    [ruleName: string]: RuleModule;
  };

  // Processors for non-JS files
  processors?: {
    [processorName: string]: Processor;
  };

  // Configurations for easy plugin usage
  configs?: {
    [configName: string]: Linter.Config;
  };
}

// Rule structure - visitor pattern for AST
interface RuleModule {
  meta: RuleMeta;
  create(context: RuleContext): RuleListener;
}
```

**Key Patterns:**

1. **Rule-based extensibility** - Each rule is a standalone module with `create(context)` returning AST visitors
2. **Context injection** - Rules receive context with `report()`, `getSourceCode()`, `getAncestors()`, etc.
3. **Peer dependency pattern** - Plugins declare `peerDependencies: { "eslint": ">=X" }`
4. **Named exports** - Plugins export default object with structured properties
5. **Configuration bundles** - Plugins include preset configs for common use cases

**Example Rule Structure:**

```typescript
// Example: Detecting dangerous patterns
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Detect eval usage', category: 'Best Practices' },
    schema: [] // no options
  },
  create(context) {
    return {
      Identifier(node) {
        if (node.name === 'eval') {
          context.report({
            node,
            message: 'Avoid using eval - security risk'
          });
        }
      }
    };
  }
};
```

---

### 1.2 Webpack/Tapable Hook System

**Source:** [Webpack Tapable Repository](https://github.com/webpack/tapable)

Tapable provides a sophisticated hook-based plugin system:

```typescript
// Hook types for different execution patterns
class Hook {
  tap(name: string, fn: Function): void;
  tapAsync(name: string, fn: Function): void;
  tapPromise(name: string, fn: Function): void;
}

// Synchronous hooks
class SyncHook extends Hook { }
class SyncBailHook extends Hook { } // Stop when return non-undefined
class SyncWaterfallHook extends Hook { } // Pass return value to next
class SyncLoopHook extends Hook { } // Loop until return undefined

// Asynchronous hooks
class AsyncSeriesHook extends Hook { }
class AsyncParallelHook extends Hook { }
class AsyncSeriesWaterfallHook extends Hook { }
```

**Key Patterns:**

1. **Hook lifecycle points** - Define explicit extension points in application flow
2. **Typed hooks** - Different hook types control execution flow
3. **Interception API** - Plugins can intercept and modify hook behavior
4. **Context preservation** - Context object passed through hook chain
5. **Tap registration** - Plugins register callbacks via `.tap()`, `.tapAsync()`, `.tapPromise()`

**Example Implementation:**

```typescript
import { AsyncSeriesHook, SyncWaterfallHook } from 'tapable';

class GuardrailEngine {
  hooks = {
    // Before content analysis
    beforeAnalysis: new AsyncSeriesHook(['content', 'options']),

    // Transform content through plugins
    transformContent: new SyncWaterfallHook(['content']),

    // After analysis, can modify results
    afterAnalysis: new AsyncSeriesHook(['results', 'content'])
  };

  async analyze(content: string, options: AnalysisOptions) {
    // Execute pre-analysis hooks
    await this.hooks.beforeAnalysis.promise(content, options);

    // Apply transformations
    let transformed = content;
    transformed = this.hooks.transformContent.call(transformed);

    // Analyze...
    const results = await this._performAnalysis(transformed, options);

    // Execute post-analysis hooks
    await this.hooks.afterAnalysis.promise(results, content);

    return results;
  }

  // Plugin registration API
  use(plugin: { apply: (engine: GuardrailEngine) => void }) {
    plugin.apply(this);
  }
}

// Plugin example
class ContentSanitizerPlugin {
  apply(engine: GuardrailEngine) {
    engine.hooks.transformContent.tap('ContentSanitizer', (content) => {
      return content.trim().normalize();
    });
  }
}
```

---

### 1.3 Rollup Plugin Architecture

**Source:** [Rollup Plugin Development](https://rollupjs.org/plugin-development/)

Rollup offers the most comprehensive hook system for build tools:

```typescript
interface Plugin {
  name: string;

  // Build hooks - module resolution and loading
  options?: (options: InputOptions) => InputOptions | null | undefined;
  buildStart?: (options: NormalizedInputOptions) => void | Promise<void>;
  resolveId?: (source: string, importer: string) => ResolveIdResult;
  load?: (id: string) => LoadResult;
  transform?: (code: string, id: string) => TransformResult;

  // Module parsing hooks
  moduleParsed?: (info: ModuleInfo) => void | Promise<void>;

  // Build completion hooks
  buildEnd?: () => void | Promise<void>;
  closeBundle?: () => void | Promise<void>;

  // Output generation hooks
  renderStart?: () => void | Promise<void>;
  generateBundle?: (options: OutputOptions, bundle: OutputBundle) => void;
  writeBundle?: () => void;
}

// Plugin context utilities
interface PluginContext {
  resolve: (id: string, importer?: string) => Promise<ResolveIdResult>;
  load: (id: string) => Promise<LoadResult>;
  emitFile: (emittedFile: EmittedFile) => string;
  getModuleInfo: (moduleId: string) => ModuleInfo;
  parse: (code: string) => ESTreeProgram;
  addWatchFile: (id: string) => void;
}
```

**Key Patterns:**

1. **Phased execution** - Clear separation between build and output phases
2. **Rich plugin context** - Utilities for resolving, loading, parsing modules
3. **Virtual modules** - Special `\0` prefix for plugin-generated modules
4. **File emission** - Plugins can emit additional files/assets
5. **Caching awareness** - `cacheKey` for custom cache invalidation

---

### 1.4 Babel Plugin System

**Source:** [Babel Plugins Documentation](https://babeljs.io/docs/en/plugins)

Babel uses AST visitor pattern for code transformation:

```typescript
// Plugin structure
interface BabelPlugin {
  name?: string;
  pre?: (state: PluginState) => void;
  visitor: Visitor;
  post?: (state: PluginState) => void;
}

// Visitor pattern for AST traversal
interface Visitor {
  [nodeType: string]: {
    enter?: (path: NodePath, state: PluginState) => void;
    exit?: (path: NodePath, state: PluginState) => void;
  } | ((path: NodePath, state: PluginState) => void);
}

// Example: Simple identifier transformation
module.exports = function() {
  return {
    visitor: {
      Identifier(path) {
        // Transform identifier names
        path.node.name = path.node.name.split('').reverse().join('');
      }
    }
  };
};
```

**Key Patterns:**

1. **AST visitor pattern** - Plugins define visitors for AST node types
2. **Path-based manipulation** - Rich API for traversing and modifying AST
3. **Plugin ordering** - Plugins run first-to-last, presets run last-to-first
4. **State management** - State object passed through all visitors
5. **Enter/exit phases** - Hooks for both entering and exiting nodes

---

### 1.5 PostCSS Plugin Architecture

**Source:** Based on PostCSS plugin patterns

PostCSS uses a simple but powerful pipeline pattern:

```typescript
interface PostCSSPlugin {
  (root: Root, result: Result): void | Promise<void>;
  postcssPlugin?: string;
  prepare?: (result: Result) => Transformer;
}

// Simple plugin example
const myPlugin = (opts = {}) => {
  return {
    postcssPlugin: 'my-plugin',
    Once(root, { result }) {
      // Process entire CSS tree once
    },
    Declaration(decl, { result }) {
      // Process each declaration
    }
  };
};

// Usage
postcss([plugin1(opts), plugin2(opts)]);
```

**Key Patterns:**

1. **Function-based plugins** - Plugins are simple functions
2. **AST walkers** - `Once`, `Root`, `AtRule`, `Rule`, `Declaration` walkers
3. **Result object** - Shared object for warnings and messages
4. **Prepare phase** - Optional preparation for performance optimization
5. **Promise support** - Async plugins supported

---

## 2. Detection Engine Patterns

### 2.1 Rule-Based Detection Engine

Best practice for pluggable detection/rule engines:

```typescript
// Core types for a detection engine
interface DetectionRule<TInput = any, TResult = any> {
  id: string;
  name: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';

  // Detection function
  detect(input: TInput, context: DetectionContext): TResult | null;

  // Optional configuration
  schema?: RuleSchema;
  configure?(options: Record<string, any>): void;
}

interface DetectionContext {
  // Shared context across rules
  metadata: Record<string, any>;
  dependencies: {
    [key: string]: any; // Injected services
  };
}

interface DetectionResult<TResult> {
  ruleId: string;
  matched: boolean;
  data?: TResult;
  severity: string;
  message?: string;
}

// Engine implementation
class DetectionEngine<TInput, TResult> {
  private rules: Map<string, DetectionRule<TInput, TResult>> = new Map();

  // Rule registration
  registerRule(rule: DetectionRule<TInput, TResult>): void {
    this.rules.set(rule.id, rule);
  }

  registerRules(rules: DetectionRule<TInput, TResult>[]): void {
    rules.forEach(rule => this.registerRule(rule));
  }

  // Detection execution
  async detect(
    input: TInput,
    options: {
      ruleIds?: string[]; // Run specific rules
      categories?: string[]; // Run rules by category
      severity?: string[]; // Minimum severity threshold
    } = {}
  ): Promise<DetectionResult<TResult>[]> {
    const results: DetectionResult<TResult>[] = [];
    const rulesToRun = this._selectRules(options);

    const context: DetectionContext = {
      metadata: {},
      dependencies: {} // Inject dependencies
    };

    for (const rule of rulesToRun) {
      try {
        const result = rule.detect(input, context);
        if (result != null) {
          results.push({
            ruleId: rule.id,
            matched: true,
            data: result,
            severity: rule.severity,
            message: rule.name
          });
        }
      } catch (error) {
        // Handle detection errors gracefully
        results.push({
          ruleId: rule.id,
          matched: false,
          severity: 'low',
          message: `Detection error: ${error.message}`
        });
      }
    }

    return results;
  }

  private _selectRules(options: any): DetectionRule<TInput, TResult>[] {
    let rules = Array.from(this.rules.values());

    if (options.ruleIds?.length) {
      rules = rules.filter(r => options.ruleIds.includes(r.id));
    }

    if (options.categories?.length) {
      rules = rules.filter(r => options.categories.includes(r.category));
    }

    // Filter by severity threshold
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    if (options.severity) {
      const minIndex = severityOrder.indexOf(options.severity);
      rules = rules.filter(r => severityOrder.indexOf(r.severity) >= minIndex);
    }

    return rules;
  }
}

// Example rule implementation
const PromptInjectionRule: DetectionRule<string, InjectionMatch> = {
  id: 'prompt-injection',
  name: 'Prompt Injection Detection',
  category: 'security',
  severity: 'critical',

  detect(input: string, context: DetectionContext): InjectionMatch | null {
    const patterns = [
      /ignore\s+(all\s+)?previous\s+instructions/i,
      /disregard\s+everything\s+above/i,
      /override\s+your\s+programming/i,
      /admin\s+mode/i,
      /developer\s+mode/i
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return {
          pattern: pattern.source,
          position: match.index,
          matched: match[0]
        };
      }
    }

    return null;
  }
};
```

---

### 2.2 Pipeline-Based Detection

For complex detection workflows:

```typescript
interface PipelineStage<TInput, TOutput> {
  name: string;
  process(input: TInput, context: PipelineContext): Promise<TOutput>;
}

class DetectionPipeline<TInput, TOutput> {
  private stages: PipelineStage<any, any>[] = [];

  addStage<TStageIn, TStageOut>(
    stage: PipelineStage<TStageIn, TStageOut>
  ): this {
    this.stages.push(stage);
    return this;
  }

  async execute(input: TInput): Promise<TOutput> {
    let current: any = input;
    const context: PipelineContext = {
      metadata: {},
      history: []
    };

    for (const stage of this.stages) {
      const startTime = Date.now();
      current = await stage.process(current, context);
      context.history.push({
        stage: stage.name,
        duration: Date.now() - startTime
      });
    }

    return current as TOutput;
  }
}

// Example pipeline stages
const TokenizationStage: PipelineStage<string, string[]> = {
  name: 'tokenization',
  async process(input: string, context) {
    return input.split(/\s+/);
  }
};

const PatternMatchingStage: PipelineStage<string[], PatternMatch[]> = {
  name: 'pattern-matching',
  async process(tokens: string[], context) {
    // Pattern matching logic
    return [];
  }
};

const ScoringStage: PipelineStage<PatternMatch[], DetectionScore> = {
  name: 'scoring',
  async process(matches: PatternMatch[], context) {
    // Scoring logic
    return { score: 0, details: [] };
  }
};
```

---

### 2.3 Middleware Chain Pattern

Alternative to pipeline, inspired by Express/Koa:

```typescript
type Middleware<T> = (
  input: T,
  next: () => Promise<void>
) => Promise<void>;

class MiddlewareChain<T> {
  private middleware: Middleware<T>[] = [];

  use(fn: Middleware<T>): this {
    this.middleware.push(fn);
    return this;
  }

  async process(input: T): Promise<void> {
    let index = 0;

    const dispatch = async (): Promise<void> => {
      if (index >= this.middleware.length) {
        return;
      }

      const mw = this.middleware[index++];
      await mw(input, dispatch);
    };

    await dispatch();
  }
}

// Usage for detection
const detectionChain = new MiddlewareChain<string>();

detectionChain
  .use(async (input, next) => {
    console.log('Pre-processing:', input);
    await next();
    console.log('Post-processing');
  })
  .use(async (input, next) => {
    // Actual detection
    const result = detectMaliciousPatterns(input);
    if (result) {
      input.detected = true;
      input.result = result;
    }
    await next();
  });
```

---

## 3. TypeScript Plugin Systems

### 3.1 Type-Safe Plugin Interfaces

Best practices for type-safe plugin systems in TypeScript:

```typescript
// Base plugin interface with generics for flexibility
interface Plugin<TConfig = any, TContext = any> {
  name: string;
  version?: string;

  // Type-safe initialization
  init?(context: TContext): void | Promise<void>;

  // Configuration schema validation
  schema?: z.ZodType<TConfig>;

  // Apply plugin to host
  apply(host: PluginHost<TContext>, options?: TConfig): void;
}

// Plugin host interface
interface PluginHost<TContext = any> {
  hooks: HookMap;
  context: TContext;

  register<T>(plugin: Plugin<any, TContext>): void;
  use<T>(plugin: Plugin<any, TContext>, options?: any): this;
}

// Type-safe hook definitions
type HookFn<TArgs extends any[] = any[], TReturn = any> =
  (...args: TArgs) => TReturn;

interface HookMap {
  [hookName: string]: {
    tap(fn: HookFn): void;
    untap(fn: HookFn): void;
    call(...args: any[]): any;
    callAsync(...args: any[]): Promise<any>;
  };
}

// Example: Type-safe plugin for BonkLM
interface GuardrailsPluginOptions {
  rules?: RuleConfig[];
  patterns?: PatternConfig[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface GuardrailsPlugin
  extends Plugin<GuardrailsPluginOptions, GuardrailsContext> {

  // Plugin-specific methods with types
  detect?(input: string): DetectionResult | null;
  transform?(input: string): string;

  // Lifecycle hooks
  onAnalysisStart?(context: AnalysisContext): void;
  onAnalysisEnd?(results: AnalysisResults): void;
}

// Plugin implementation with full type safety
const PromptInjectionPlugin: GuardrailsPlugin = {
  name: 'prompt-injection',
  version: '1.0.0',

  schema: z.object({
    patterns: z.array(z.string()).optional(),
    customPatterns: z.array(z.object({
      pattern: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical'])
    })).optional()
  }),

  apply(host, options) {
    host.hooks.beforeAnalysis.tap((input) => {
      console.log('Running prompt injection detection');
    });

    host.hooks.detect.tap((input) => {
      return this.detect?.(input);
    });
  },

  detect(input: string) {
    // Implementation
    return null;
  }
};
```

---

### 3.2 Plugin Discovery and Loading

```typescript
// Type-safe plugin loader
class PluginLoader<TPlugin extends Plugin> {
  private plugins = new Map<string, TPlugin>();

  // Load from directory
  async loadFromDirectory(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && /\.(js|ts|json)$/.test(entry.name)) {
        const module = await import(path.join(dir, entry.name));
        const plugin = module.default || module;

        if (this.isValidPlugin(plugin)) {
          this.register(plugin);
        }
      }
    }
  }

  // Load from npm package
  async loadFromPackage(packageName: string): Promise<void> {
    try {
      const module = await import(packageName);
      const plugin = module.default || module;

      if (this.isValidPlugin(plugin)) {
        this.register(plugin);
      }
    } catch (error) {
      throw new Error(`Failed to load plugin ${packageName}: ${error.message}`);
    }
  }

  // Type guard for plugin validation
  private isValidPlugin(obj: any): obj is TPlugin {
    return (
      typeof obj === 'object' &&
      typeof obj.name === 'string' &&
      typeof obj.apply === 'function'
    );
  }

  register(plugin: TPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  get(name: string): TPlugin | undefined {
    return this.plugins.get(name);
  }

  getAll(): TPlugin[] {
    return Array.from(this.plugins.values());
  }
}
```

---

### 3.3 Generic Plugin System Framework

```typescript
// A fully generic, type-safe plugin system
interface GenericPluginSystem<TConfig, THooks, TContext> {
  config: TConfig;
  hooks: THooks;
  context: TContext;

  use<P extends GenericPlugin<TConfig, THooks, TContext>>(
    plugin: P
  ): this;

  use<P extends GenericPlugin<TConfig, THooks, TContext>>(
    pluginFactory: (config: TConfig) => P
  ): this;
}

interface GenericPlugin<TConfig, THooks, TContext> {
  name: string;
  version?: string;

  apply(
    system: GenericPluginSystem<TConfig, THooks, TContext>
  ): void | Promise<void>;
}

// Type-safe hook builder
class HookBuilder<TArgs extends any[]> {
  private hooks: HookFn<TArgs>[] = [];

  tap(fn: HookFn<TArgs>): void {
    this.hooks.push(fn);
  }

  async call(...args: TArgs): Promise<void> {
    for (const hook of this.hooks) {
      await hook(...args);
    }
  }

  syncCall(...args: TArgs): void {
    for (const hook of this.hooks) {
      hook(...args);
    }
  }
}

// Hook map builder
function createHooks<THooks extends Record<string, any[]>>(
  definitions: THooks
): {[K in keyof THooks]: HookBuilder<THooks[K]>} {
  const hooks = {} as any;

  for (const [name, _] of Object.entries(definitions)) {
    hooks[name] = new HookBuilder();
  }

  return hooks;
}

// Usage example
type GuardrailsHooks = {
  beforeAnalysis: [input: string, options: AnalysisOptions];
  afterAnalysis: [results: AnalysisResults];
  onDetection: [match: DetectionMatch];
  onError: [error: Error];
};

const guardrailsSystem: GenericPluginSystem<
  GuardrailsConfig,
  ReturnType<typeof createHooks<GuardrailsHooks>>,
  GuardrailsContext
> = {
  config: {},
  hooks: createHooks<GuardrailsHooks>({
    beforeAnalysis: ['input', 'options'],
    afterAnalysis: ['results'],
    onDetection: ['match'],
    onError: ['error']
  }),
  context: {},

  use(plugin) {
    plugin.apply(this);
    return this;
  }
};
```

---

## 4. Package Distribution Best Practices

### 4.1 Scoped Package Configuration

For `@blackunicorn/bonklm`:

```json
{
  "name": "@blackunicorn/bonklm",
  "version": "1.0.0",
  "description": "Pluggable LLM security guardrails for TypeScript/JavaScript",

  "publishConfig": {
    "access": "public"
  },

  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "default": "./dist/index.mjs"
    },
    "./plugins": {
      "types": "./dist/plugins.d.ts",
      "import": "./dist/plugins.mjs",
      "require": "./dist/plugins.cjs"
    },
    "./core": {
      "types": "./dist/core.d.ts",
      "import": "./dist/core.mjs",
      "require": "./dist/core.cjs"
    },
    "./package.json": "./package.json"
  },

  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",

  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],

  "keywords": [
    "llm",
    "guardrails",
    "security",
    "ai",
    "prompt-injection",
    "content-filtering"
  ],

  "peerDependencies": {
    "typescript": ">=4.7"
  },

  "peerDependenciesMeta": {
    "typescript": {
      "optional": true
    }
  },

  "engines": {
    "node": ">=16.0.0"
  }
}
```

---

### 4.2 Build Configuration

```typescript
// tsconfig.json for library
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],

    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    "outDir": "./dist",
    "rootDir": "./src",

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,

    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,

    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}

// Build using tsup for dual CJS/ESM output
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    plugins: 'src/plugins/index.ts',
    core: 'src/core/index.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2020',
  splitting: false,
  minify: false, // Keep readable for debugging
});
```

---

### 4.3 Package Exports Strategy

```typescript
// src/index.ts - Main entry point
export { GuardrailsEngine } from './core/engine.js';
export { DetectionEngine } from './core/detection.js';
export type { DetectionResult, DetectionRule } from './core/types.js';

// Export common plugins for convenience
export { default as PromptInjectionPlugin } from './plugins/prompt-injection.js';
export { default as PIIRedactionPlugin } from './plugins/pii-redaction.js';

// Export plugin creation utilities
export { createPlugin, defineRule } from './core/plugin-builder.js';

// src/plugins/index.ts - Plugin-specific exports
export * from './prompt-injection.js';
export * from './pii-redaction.js';
export * from './content-filter.js';
export * from './rate-limit.js';

// src/core/index.ts - Core APIs for custom plugins
export { PluginBuilder, defineDetectionRule } from './plugin-builder.js';
export { HookSystem, HookBuilder } from './hooks.js';
export type { Plugin, PluginContext } from './types.js';
```

---

### 4.4 Versioning and Release Strategy

```json
// Semantic versioning for plugins
{
  "rules": {
    "plugins": {
      "onlyPublishWithTag": true,
      "tagVersionPrefix": "v",
      "commitMessageFormat": "chore(release): ${version}"
    }
  }
}

// Release package.json
{
  "scripts": {
    "release": "standard-version",
    "release:minor": "standard-version --release-as minor",
    "release:major": "standard-version --release-as major",
    "release:patch": "standard-version --release-as patch"
  }
}
```

---

### 4.5 TypeScript Support and Types

```typescript
// Export all types for consumers
export type {
  // Core types
  GuardrailsConfig,
  GuardrailsContext,

  // Plugin types
  Plugin,
  PluginOptions,
  PluginBuilder,

  // Detection types
  DetectionRule,
  DetectionResult,
  DetectionContext,

  // Hook types
  HookMap,
  HookFn,

  // Result types
  AnalysisResult,
  AnalysisReport,
  Violation
} from './types.js';

// Provide type utilities for plugin authors
export type {
  // Helper types for creating plugins
  RuleBuilderOptions,
  RuleMatcher,
  RuleHandler
} from './plugin-builder.js';
```

---

### 4.6 Plugin Package Convention

For plugins published separately as `@blackunicorn/bonklm-plugin-*`:

```json
{
  "name": "@blackunicorn/bonklm-plugin-prompt-injection",
  "version": "1.0.0",
  "description": "Prompt injection detection plugin for @blackunicorn/bonklm",

  "peerDependencies": {
    "@blackunicorn/bonklm": "^1.0.0"
  },

  "keywords": [
    "llm-guardrails",
    "llm-guardrails-plugin",
    "prompt-injection",
    "security"
  ],

  "guardrailsPlugin": {
    "id": "prompt-injection",
    "name": "Prompt Injection Detection",
    "version": "1.0.0",
    "category": "security"
  }
}
```

---

## 5. Synthesis & Recommendations

### 5.1 Recommended Architecture for BonkLM

Based on research, the following hybrid architecture is recommended:

```typescript
/**
 * Recommended Plugin Architecture for @blackunicorn/bonklm
 *
 * Combines best practices from ESLint (rule-based), Webpack (hooks),
 * and Rollup (rich context) for maximum extensibility.
 */

// Core interfaces
interface GuardrailsPlugin {
  // Plugin metadata (ESLint pattern)
  meta: {
    id: string;
    name: string;
    version: string;
    category: 'security' | 'privacy' | 'safety' | 'compliance';
  };

  // Hook-based application (Webpack/Tapable pattern)
  apply(engine: GuardrailsEngine, options?: PluginOptions): void;

  // Optional: Rule definitions (ESLint pattern)
  rules?: Record<string, DetectionRule>;

  // Optional: Direct detection interface
  detect?(content: string, context: Context): DetectionResult | null;
}

// Engine with hooks (Webpack/Tapable pattern)
class GuardrailsEngine {
  private hooks = {
    // Lifecycle hooks
    initialize: new AsyncSeriesHook(['config']),
    beforeAnalysis: new AsyncSeriesHook(['content', 'options']),
    afterAnalysis: new AsyncSeriesHook(['results']),

    // Detection hooks
    detect: new AsyncWaterfallHook(['content', 'results']),

    // Transformation hooks
    transform: new SyncWaterfallHook(['content']),

    // Output hooks
    report: new AsyncSeriesHook(['report'])
  };

  private plugins = new Map<string, GuardrailsPlugin>();
  private detectionEngine: DetectionEngine<string, DetectionResult>;

  constructor(config: GuardrailsConfig) {
    this.detectionEngine = new DetectionEngine();
    this.hooks.initialize.call(config);
  }

  // Plugin registration (Rollup pattern)
  use(plugin: GuardrailsPlugin | GuardrailsPlugin[]): this {
    const plugins = Array.isArray(plugin) ? plugin : [plugin];

    for (const p of plugins) {
      this.plugins.set(p.meta.id, p);
      p.apply(this);

      // Register rules if provided
      if (p.rules) {
        this.detectionEngine.registerRules(
          Object.values(p.rules).map(r => ({
            ...r,
            id: `${p.meta.id}/${r.id}`,
            category: p.meta.category
          }))
        );
      }
    }

    return this;
  }

  // Main analysis method
  async analyze(content: string, options: AnalysisOptions = {}): Promise<AnalysisReport> {
    await this.hooks.beforeAnalysis.promise(content, options);

    // Transform content through plugin chain
    let transformed = content;
    transformed = this.hooks.transform.call(transformed);

    // Run detection rules
    let results = await this.detectionEngine.detect(transformed, options);

    // Allow plugins to modify results
    results = await this.hooks.detect.promise(transformed, results);

    const report = this.generateReport(results, content);

    await this.hooks.afterAnalysis.promise(results);
    await this.hooks.report.promise(report);

    return report;
  }

  // Hook registration for plugins
  on(name: string, fn: Function): this {
    const hook = this.hooks[name];
    if (hook) {
      hook.tap(fn);
    }
    return this;
  }
}
```

---

### 5.2 Key Recommendations

1. **Use a hybrid approach**:
   - Hook-based lifecycle (Webpack/Tapable) for cross-cutting concerns
   - Rule-based detection (ESLint) for specific pattern matching
   - Rich plugin context (Rollup) for advanced use cases

2. **Type safety first**:
   - Full TypeScript definitions for all plugin interfaces
   - Generic types for flexibility with type checking
   - Zod or similar for runtime schema validation

3. **Clear plugin conventions**:
   - Standardized `meta` object for plugin metadata
   - `apply(host)` method for registration
   - Optional `rules` export for rule-based plugins
   - Standard naming: `@scope/bonklm-plugin-*`

4. **Export strategy**:
   - Use `exports` field for conditional exports
   - Provide both CJS and ESM builds
   - Separate exports for `core`, `plugins`, and main package
   - Full TypeScript definitions

5. **Developer experience**:
   - Helper functions for common plugin patterns
   - Clear documentation with examples
   - Plugin generator CLI
   - Validation tools for plugin authors

6. **Detection engine design**:
   - Pluggable rule registration
   - Category-based filtering
   - Severity-based thresholds
   - Async detection support
   - Graceful error handling

---

## Sources

1. [ESLint Plugin Documentation](https://eslint.org/docs/latest/extend/plugins) - Rule-based plugin architecture, AST visitor pattern
2. [Webpack Tapable](https://github.com/webpack/tapable) - Hook-based plugin system, execution flow control
3. [Rollup Plugin Development](https://rollupjs.org/plugin-development/) - Comprehensive hook system, plugin context utilities
4. [Babel Plugins](https://babeljs.io/docs/en/plugins) - AST transformation, visitor pattern
5. [PostCSS Plugins](https://github.com/postcss/postcss/blob/main/docs/plugins.md) - Pipeline pattern, simple function-based plugins

---

**Document End**

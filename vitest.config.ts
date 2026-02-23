import { defineConfig } from 'vitest/config';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // FIX: Use explicit paths instead of ** to avoid scanning node_modules
    // This prevents the "hang" during file discovery when vitest tries to scan all directories
    include: [
      'packages/**/*.test.ts',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '_bmad-output/**',                   // Output directory
      '**/node_modules/**',
      // Performance tests - run separately in dedicated job
      'tests/performance/**',
      // Backup directories - excluded to prevent duplicate tests
      'team/backups/**',
      // Reference directory - contains tests with missing dependencies (openclaw/plugin-sdk)
      'reference/**',
    ],
    coverage: {
      provider: 'istanbul', // Better TypeScript source map support than v8
      reporter: ['text', 'json', 'html', 'json-summary'],
      include: [
        'packages/core/src/**/*.ts',
      ],
      exclude: [
        '**/*.d.ts',
        'node_modules/**',
        'dist/**',
        'packages/*/tests/**'
      ],
      // Istanbul coverage options
      all: true,
      extension: ['.js', '.ts', '.jsx', '.tsx'],
      // Source map handling for TypeScript
      usePerFileCoverage: true,
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    setupFiles: ['./tests/vitest-setup.js'],
    // VAL-11-001: Use separate forks per test file to prevent OOM from memory accumulation
    // Use multiple workers for speed, but with proper teardown to avoid worker exit issues
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        execArgv: ['--max-old-space-size=8192', '--expose-gc']
      }
    },
    isolate: true,
    maxConcurrency: 1,
    minWorkers: 1,
    maxWorkers: 1,
    // Force garbage collection between test files to reduce memory pressure
    sequence: {
      hooks: {
        // Only run afterAll/afterEach hooks in the same worker
      }
    }
  },
  resolve: {
    alias: {
      '@framework': path.resolve(__dirname, '_bmad/framework'),
      '@validators': path.resolve(__dirname, '.claude/validators-node/src'),
      '@bmad/validators': path.resolve(__dirname, '.claude/validators-node/src'),
      '@bmad': path.resolve(__dirname, '_bmad'),
    },
  },
  plugins: [
    {
      name: 'resolve-test-imports',
      resolveId(source, importer) {
        // Only handle imports from test files in tests/utility/tools/
        if (!importer || !importer.includes('/tests/utility/tools/')) {
          return null;
        }

        // Handle relative imports (both ./ and ../)
        if (!source.startsWith('./') && !source.startsWith('../')) {
          return null;
        }

        // Skip if already resolving a .test.js file
        if (source.endsWith('.test.js')) {
          return null;
        }

        // Get the directory containing the importer
        const importerDir = path.dirname(importer);

        // Resolve the relative path
        const resolvedTestPath = path.resolve(importerDir, source);

        // Map the resolved path from tests/ to src/
        if (resolvedTestPath.includes('/tests/utility/tools/')) {
          const sourcePath = resolvedTestPath.replace('/tests/utility/tools/', '/src/utility/tools/');

          // Check if source file exists
          if (fs.existsSync(sourcePath)) {
            return sourcePath;
          }
        }

        return null;
      }
    },
    {
      name: 'resolve-packages-js-to-ts',
      resolveId(source, importer) {
        // Handle imports from packages/*/tests/ that use .js extension for .ts files
        // This is needed for NodeNext moduleResolution where .ts files use .js in imports
        if (!importer || !importer.includes('/packages/') || !importer.includes('/tests/')) {
          return null;
        }

        // Only handle relative imports
        if (!source.startsWith('./') && !source.startsWith('../')) {
          return null;
        }

        // Only process .js extension imports
        if (!source.endsWith('.js')) {
          return null;
        }

        // Resolve the full path
        const importerDir = path.dirname(importer);
        const resolvedJsPath = path.resolve(importerDir, source);
        const resolvedTsPath = resolvedJsPath.replace(/\.js$/, '.ts');

        // If .ts file exists, return it
        if (fs.existsSync(resolvedTsPath)) {
          return resolvedTsPath;
        }

        return null;
      }
    }
  ],
  esbuild: {
    target: 'node18'
  },
  // Suppress source map warnings for validators-node src files
  // Source maps are generated in dist/ during build, tests run from src/
  sourcemap: {
    ignore: ['**/.claude/validators-node/src/**/*.ts']
  },
  // Don't fail on unhandled errors - worker exit from E2E subprocesses is expected
  failOnUnhandledErrors: false
});

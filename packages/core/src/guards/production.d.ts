/**
 * BonkLM - Production Guard
 * ================================
 * Blocks commands and content targeting production environments.
 *
 * Features:
 * - 18+ production keyword patterns
 * - Critical deployment command detection (force push, deploy, kubectl)
 * - Safe context detection (comments, documentation)
 * - Documentation file bypass
 * - Environment variable detection (NODE_ENV, RAILS_ENV, etc.)
 */
import { type ValidatorConfig } from '../base/ValidatorConfig.js';
export interface ProductionGuardConfig extends ValidatorConfig {
    /**
     * File path to check (for documentation bypass)
     */
    filePath?: string;
    /**
     * Enable documentation file bypass
     */
    allowDocumentationFiles?: boolean;
}
export interface ProductionIndicator {
    pattern: string;
    match: string;
    context: string;
    isCritical: boolean;
}
/**
 * Check if the current runtime environment is a production environment.
 * This performs actual runtime environment checks rather than just text matching.
 *
 * Checks multiple environment variable patterns used across different frameworks:
 * - Node.js: NODE_ENV
 * - Rails: RAILS_ENV
 * - Django: DJANGO_SETTINGS_MODULE
 * - Flask: FLASK_ENV
 * - General: APP_ENV, ENVIRONMENT, ENV
 *
 * Also checks for cloud provider environment indicators:
 * - AWS: AWS_ENV, AWS_EXECUTION_ENV
 * - GCP: GCP_PROJECT, GOOGLE_CLOUD_PROJECT
 * - Azure: AZURE_ENV, WEBSITE_SITE_NAME (Azure App Service)
 * - Vercel: VERCEL_ENV
 * - Heroku: NODE_ENV (set to production by default)
 *
 * @returns true if actually running in a production environment
 */
export declare function isProductionEnvironment(): boolean;
/**
 * Check if the current runtime environment is a test environment.
 * This helps prevent false positives during testing.
 *
 * Checks for common test environment indicators:
 * - JEST_WORKER_ID (Jest)
 * - VITEST_POOL_ID (Vitest)
 * - NODE_ENV === 'test'
 * - CI environment variables
 *
 * @returns true if running in a test environment
 */
export declare function isTestEnvironment(): boolean;
/**
 * Check if a file path is a documentation file
 */
export declare function isDocumentationFile(filePath: string | undefined): boolean;
/**
 * Check if text is in a safe context (comments, safe words)
 */
export declare function isSafeContext(text: string): boolean;
/**
 * Check for critical deployment commands that cannot be overridden
 */
export declare function isCriticalDeployCommand(text: string): {
    isCritical: boolean;
    message: string;
};
/**
 * Detect production indicators in text
 */
export declare function detectProductionIndicators(text: string): ProductionIndicator[];
export declare class ProductionGuard {
    private readonly config;
    constructor(config?: ProductionGuardConfig);
    /**
     * Validate content for production targeting
     *
     * This method now performs runtime environment verification to distinguish
     * between text patterns that mention production vs. actually running in production.
     *
     * - If running in a test environment: Allows content but warns (text analysis only)
     * - If NOT in production environment: Analyzes text patterns for production references
     * - If ACTUALLY running in production: Fails validation unless content is documentation
     */
    validate(content: string, filePath?: string): import('../base/GuardrailResult.js').GuardrailResult;
    /**
     * Get the guard's configuration
     */
    getConfig(): ProductionGuardConfig;
}
/**
 * Quick production check.
 * @param content - Content to check
 * @param filePath - Optional file path for documentation bypass
 * @returns Validation result
 */
export declare function checkProduction(content: string, filePath?: string): import('../base/GuardrailResult.js').GuardrailResult;
//# sourceMappingURL=production.d.ts.map
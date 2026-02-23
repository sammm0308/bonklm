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
import { createResult, Severity as Sev } from '../base/GuardrailResult.js';
import { mergeConfig } from '../base/ValidatorConfig.js';
// =============================================================================
// PATTERN DEFINITIONS
// =============================================================================
/**
 * Production keyword patterns
 */
const PRODUCTION_PATTERNS = [
    // Explicit keywords
    [/\bprod\b/i, 'Explicit "prod" keyword'],
    [/\bproduction\b/i, 'Explicit "production" keyword'],
    [/\bprd\b/i, 'Explicit "prd" abbreviation'],
    // Hostname/URL patterns
    [/prod\./i, 'Production hostname prefix'],
    [/production\./i, 'Production hostname prefix'],
    [/-prod\./i, 'Production hostname suffix'],
    [/-production\./i, 'Production hostname suffix'],
    [/\.prod\./i, 'Production subdomain'],
    // Environment variables
    [/NODE_ENV\s*=\s*["']?production/i, 'Node.js production environment'],
    [/RAILS_ENV\s*=\s*["']?production/i, 'Rails production environment'],
    [/FLASK_ENV\s*=\s*["']?production/i, 'Flask production environment'],
    [/APP_ENV\s*=\s*["']?production/i, 'App production environment'],
    [/ENVIRONMENT\s*=\s*["']?prod/i, 'Environment variable set to prod'],
    // Database indicators
    [/prod[-_]?db/i, 'Production database reference'],
    [/database[-_]?prod/i, 'Production database reference'],
    [/production[-_]?database/i, 'Production database reference'],
    // Cloud provider indicators
    [/aws[-_]?prod/i, 'AWS production reference'],
    [/gcp[-_]?prod/i, 'GCP production reference'],
    [/azure[-_]?prod/i, 'Azure production reference'],
];
/**
 * Critical deployment commands - ABSOLUTE BLOCK, no override
 */
const CRITICAL_PATTERNS = [
    [/git\s+push\s+.*--force.*\s+(main|master)/i, 'Force push to main/master'],
    [/git\s+push\s+-f\s+.*(main|master)/i, 'Force push to main/master'],
    [/deploy\s+.*prod/i, 'Deploy to production'],
    [/kubectl\s+.*prod/i, 'Kubernetes in production context'],
    [/helm\s+.*prod/i, 'Helm in production context'],
    [/\blive\b.*deploy/i, 'Deploy to live'],
    [/\brelease\b.*deploy/i, 'Release deployment'],
];
/**
 * Safe patterns that prevent false positives
 */
const SAFE_PATTERNS = [
    /reproduce/i,
    /product(?!ion)/i, // "product" but not "production"
    /productivity/i,
    /productive/i,
    /prod[-_]?test/i,
    /test[-_]?prod/i,
    /non[-_]?prod/i,
    /pre[-_]?prod/i,
    /#.*\bprod\b/i, // Comment containing prod
    /\/\/.*\bprod\b/i, // Line comment
    /\/\*.*\bprod\b/i, // Block comment start
    /production[-_]?ready/i,
    /production[-_]?quality/i,
    /production[-_]?grade/i,
    /for\s+production/i,
    /in\s+production/i,
];
/**
 * Documentation file patterns
 */
const DOCUMENTATION_PATTERNS = [
    /\.md$/i,
    /README/i,
    /CHANGELOG/i,
    /CONTRIBUTING/i,
    /LICENSE/i,
    /\.txt$/i,
    /\.rst$/i,
    /\.adoc$/i,
    /\/docs\//i,
    /\/documentation\//i,
];
// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
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
export function isProductionEnvironment() {
    const env = process.env;
    // Check standard environment variables
    const productionEnvVars = [
        'NODE_ENV',
        'RAILS_ENV',
        'FLASK_ENV',
        'APP_ENV',
        'ENVIRONMENT',
        'ENV',
    ];
    for (const key of productionEnvVars) {
        const value = env[key];
        if (value && ['production', 'prod'].includes(value.toLowerCase().trim())) {
            return true;
        }
    }
    // Check cloud provider specific environment variables
    const cloudProductionIndicators = [
        // AWS
        env.AWS_ENV?.toLowerCase().includes('prod'),
        env.AWS_EXECUTION_ENV?.startsWith('AWS_Lambda_'),
        // GCP
        env.GCP_PROJECT?.toLowerCase().includes('prod'),
        env.GOOGLE_CLOUD_PROJECT?.toLowerCase().includes('prod'),
        // Azure
        env.AZURE_ENV?.toLowerCase().includes('prod'),
        env.WEBSITE_SITE_NAME !== undefined, // Azure App Service
        // Vercel
        env.VERCEL_ENV === 'production',
        // Heroku
        env.NODE_ENV === 'production' && env.DYNO !== undefined,
    ];
    if (cloudProductionIndicators.some((indicator) => indicator === true)) {
        return true;
    }
    return false;
}
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
export function isTestEnvironment() {
    const env = process.env;
    // Explicit test environment variables
    const testIndicators = [
        env.NODE_ENV === 'test',
        env.JEST_WORKER_ID !== undefined,
        env.VITEST_POOL_ID !== undefined,
        env.MOCHA_WORKER_ID !== undefined,
        env.AVOCADO_TEST_WORKER_ID !== undefined,
        env.PYTEST_CURRENT_TEST !== undefined, // Python pytest
        env.TEST === 'true',
        env.TESTING === 'true',
    ];
    // CI/CD environments (often run tests)
    const ciIndicators = [
        env.CI === 'true',
        env.CONTINUOUS_INTEGRATION === 'true',
        env.BUILD_BUILDNUMBER !== undefined, // Azure DevOps
        env.GITHUB_ACTIONS !== undefined,
        env.GITLAB_CI === 'true',
        env.CIRCLECI === 'true',
        env.JENKINS_URL !== undefined,
        env.TRAVIS === 'true',
        env.CODEBUILD_BUILD_ID !== undefined, // AWS CodeBuild
    ];
    return [...testIndicators, ...ciIndicators].some((indicator) => indicator === true);
}
/**
 * Check if a file path is a documentation file
 */
export function isDocumentationFile(filePath) {
    if (!filePath)
        return false;
    return DOCUMENTATION_PATTERNS.some((pattern) => pattern.test(filePath));
}
/**
 * Check if text is in a safe context (comments, safe words)
 */
export function isSafeContext(text) {
    return SAFE_PATTERNS.some((pattern) => pattern.test(text));
}
/**
 * Check for critical deployment commands that cannot be overridden
 */
export function isCriticalDeployCommand(text) {
    for (const [pattern, description] of CRITICAL_PATTERNS) {
        const match = text.match(pattern);
        if (match) {
            return {
                isCritical: true,
                message: `Critical production operation: ${description}`,
            };
        }
    }
    return { isCritical: false, message: '' };
}
/**
 * Detect production indicators in text
 */
export function detectProductionIndicators(text) {
    const indicators = [];
    const lines = text.split('\n');
    for (const line of lines) {
        // Skip if the entire line is a safe context
        if (isSafeContext(line)) {
            continue;
        }
        for (const [pattern, description] of PRODUCTION_PATTERNS) {
            const match = line.match(pattern);
            if (match && !isSafeContext(match[0])) {
                indicators.push({
                    pattern: description,
                    match: match[0],
                    context: line.trim().slice(0, 100),
                    isCritical: false,
                });
            }
        }
    }
    return indicators;
}
// =============================================================================
// GUARD CLASS
// =============================================================================
export class ProductionGuard {
    config;
    constructor(config) {
        this.config = {
            ...mergeConfig(config),
            filePath: config?.filePath,
            allowDocumentationFiles: config?.allowDocumentationFiles ?? true,
        };
    }
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
    validate(content, filePath) {
        if (!content || content.trim().length === 0) {
            return createResult(true, Sev.INFO, []);
        }
        const effectiveFilePath = filePath ?? this.config.filePath;
        const actuallyInProduction = isProductionEnvironment();
        const inTestEnvironment = isTestEnvironment();
        // Skip documentation files
        if (this.config.allowDocumentationFiles && isDocumentationFile(effectiveFilePath)) {
            return createResult(true, Sev.INFO, [{
                    category: 'production_guard',
                    description: 'Documentation file bypassed',
                    severity: Sev.INFO,
                    weight: 0,
                }]);
        }
        const findings = [];
        // CRITICAL: If we're actually running in production, fail validation
        // to prevent accidental production operations
        if (actuallyInProduction && !inTestEnvironment) {
            findings.push({
                category: 'runtime_production',
                pattern_name: 'production_environment_detected',
                severity: Sev.CRITICAL,
                match: 'Runtime: production',
                description: 'Cannot execute in production environment. This operation requires a non-production runtime.',
                weight: 50,
            });
            return createResult(false, Sev.CRITICAL, findings);
        }
        // Check for critical deployment commands first (ABSOLUTE BLOCK)
        const criticalCheck = isCriticalDeployCommand(content);
        if (criticalCheck.isCritical) {
            findings.push({
                category: 'critical_production',
                pattern_name: 'critical_deploy',
                severity: Sev.CRITICAL,
                match: content.slice(0, 100),
                description: criticalCheck.message,
                weight: 30,
            });
            return createResult(false, Sev.CRITICAL, findings);
        }
        // Detect production indicators in text
        const indicators = detectProductionIndicators(content);
        for (const indicator of indicators) {
            findings.push({
                category: 'production_indicator',
                pattern_name: indicator.pattern,
                severity: Sev.WARNING,
                match: indicator.match,
                description: `${indicator.pattern}: "${indicator.match}"`,
                weight: 15,
            });
        }
        if (findings.length === 0) {
            return createResult(true, Sev.INFO, []);
        }
        const shouldBlock = this.config.action === 'block';
        return createResult(!shouldBlock, Sev.WARNING, findings);
    }
    /**
     * Get the guard's configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
// =============================================================================
// CONVENIENCE FUNCTION
// =============================================================================
/**
 * Quick production check.
 * @param content - Content to check
 * @param filePath - Optional file path for documentation bypass
 * @returns Validation result
 */
export function checkProduction(content, filePath) {
    const guard = new ProductionGuard();
    return guard.validate(content, filePath);
}
//# sourceMappingURL=production.js.map
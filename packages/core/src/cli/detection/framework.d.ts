/**
 * Framework Detection for the BonkLM Installation Wizard
 *
 * This module detects installed frameworks in the current project by:
 * 1. Reading package.json from the current directory
 * 2. Parsing dependencies and devDependencies
 * 3. Matching against known framework patterns
 *
 * SECURITY FEATURES:
 * - Path traversal protection: Uses realpath() to validate package.json location
 * - Prototype pollution prevention: Uses secure-json-parse with protoAction removal
 * - DoS protection: Enforces 1MB file size limit
 * - Dependency limit: Caps checked dependencies to prevent resource exhaustion
 */
/**
 * Detected framework information
 *
 * Represents a framework found in the current project.
 */
export interface DetectedFramework {
    /** Framework identifier (e.g., 'express', 'nestjs') */
    name: string;
    /** Version from package.json (if available) */
    version?: string;
}
/**
 * Framework detection patterns
 *
 * Maps framework IDs to their package dependencies.
 * Checks both dependencies and devDependencies.
 */
declare const FRAMEWORK_PATTERNS: {
    readonly express: {
        readonly dependencies: readonly ["express"];
        readonly devDependencies: readonly [];
    };
    readonly fastify: {
        readonly dependencies: readonly ["fastify"];
        readonly devDependencies: readonly [];
    };
    readonly nestjs: {
        readonly dependencies: readonly ["@nestjs/core"];
        readonly devDependencies: readonly [];
    };
    readonly langchain: {
        readonly dependencies: readonly ["langchain", "@langchain/core"];
        readonly devDependencies: readonly [];
    };
};
/** Type containing all framework IDs */
export type FrameworkId = keyof typeof FRAMEWORK_PATTERNS;
/**
 * Framework detection options
 *
 * Optional configuration for framework detection behavior.
 */
export interface FrameworkDetectionOptions {
    /** Custom working directory (defaults to process.cwd()) */
    workingDir?: string;
    /** Custom package.json path (relative to working dir) */
    packageJsonPath?: string;
}
/**
 * Detects frameworks installed in the current project
 *
 * This function performs the following security checks:
 * 1. Resolves real paths to prevent symlink attacks (C-4 fix)
 * 2. Validates path is within working directory (C-4 fix)
 * 3. Checks file size before reading (MP-6 fix)
 * 4. Uses secure JSON parser to prevent prototype pollution (HP-6 fix)
 * 5. Limits number of dependencies checked (MP-6 fix)
 *
 * @param options - Optional detection configuration
 * @returns Array of detected frameworks with versions
 *
 * @throws {WizardError} If package.json is outside working directory (path traversal)
 * @throws {WizardError} If package.json exceeds size limit
 *
 * @example
 * ```ts
 * const frameworks = await detectFrameworks();
 * // [{ name: 'express', version: '^4.18.0' }]
 * ```
 */
export declare function detectFrameworks(options?: FrameworkDetectionOptions): Promise<DetectedFramework[]>;
/**
 * Checks if a specific framework is detected in the current project
 *
 * @param frameworkId - The framework ID to check
 * @param options - Optional detection configuration
 * @returns True if the framework is detected
 *
 * @example
 * ```ts
 * if (await isFrameworkDetected('express')) {
 *   // Use Express-specific code
 * }
 * ```
 */
export declare function isFrameworkDetected(frameworkId: FrameworkId, options?: FrameworkDetectionOptions): Promise<boolean>;
/**
 * Gets version of a specific framework if detected
 *
 * @param frameworkId - The framework ID to check
 * @param options - Optional detection configuration
 * @returns Version string or undefined if not detected
 *
 * @example
 * ```ts
 * const expressVersion = await getFrameworkVersion('express');
 * // '^4.18.0' or undefined
 * ```
 */
export declare function getFrameworkVersion(frameworkId: FrameworkId, options?: FrameworkDetectionOptions): Promise<string | undefined>;
export {};
//# sourceMappingURL=framework.d.ts.map
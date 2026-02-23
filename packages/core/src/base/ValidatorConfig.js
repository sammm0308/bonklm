/**
 * Validator Configuration
 * =======================
 * Common configuration schema for all validators.
 */
import { LogLevel } from './GenericLogger.js';
/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
    sensitivity: 'standard',
    action: 'block',
    enabled: true,
    logLevel: LogLevel.INFO,
    includeFindings: true,
};
/**
 * Merge user config with defaults
 */
export function mergeConfig(userConfig) {
    return {
        ...DEFAULT_CONFIG,
        ...userConfig,
    };
}
/**
 * Get risk threshold based on sensitivity level
 */
export function getRiskThreshold(sensitivity) {
    switch (sensitivity) {
        case 'strict':
            return 5; // Block at low risk
        case 'permissive':
            return 25; // Only block at high risk
        case 'standard':
        default:
            return 15; // Balanced threshold
    }
}
//# sourceMappingURL=ValidatorConfig.js.map
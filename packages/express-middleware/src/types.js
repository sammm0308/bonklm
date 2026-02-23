/**
 * Express Middleware Types for BonkLM
 * ============================================
 * Type definitions for the Express middleware with all security fixes applied.
 *
 * Security Fixes Applied:
 * - SEC-001: Path normalization via path.normalize()
 * - SEC-004: Buffer mode for response validation
 * - SEC-007: Production mode toggle for error messages
 * - SEC-008: Validation timeout with AbortController
 * - SEC-010: Request size limit option
 * - DEV-001: Correct GuardrailEngine API (string context)
 * - DEV-002: Logger type instead of GenericLogger
 * - DEV-006: bodyExtractor returns string (normalized from string[])
 */
export {};
//# sourceMappingURL=types.js.map
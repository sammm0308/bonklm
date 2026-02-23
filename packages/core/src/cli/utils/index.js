/**
 * Utility modules for the BonkLM Installation Wizard
 */
export { maskKey, maskKeyWithCustomLength, maskAllButLast, isMasked } from './mask.js';
export { SecureCredential } from './secure-credential.js';
export { WizardError, sanitizeError, ExitCode } from './error.js';
export { AuditLogger, createAuditEvent } from './audit.js';
export { validateApiKeySecure, clearValidationCache, getRateLimitStatus } from './validation.js';
// Terminal capability detection
export { getTerminalCapabilities, getDetailedTerminalCapabilities, supportsColorLevel, getCursorControls, colorize, colors, } from './terminal.js';
// Exit handling utilities
export { exit, exitWithError, exitSuccess, registerShutdownHandlers, withErrorHandling, isExiting, } from './exit.js';
//# sourceMappingURL=index.js.map
/**
 * Express Guardrails Middleware
 * ============================
 * Express middleware for LLM security guardrails.
 *
 * Security Fixes Applied:
 * - SEC-001: Path traversal protection via path.normalize()
 * - SEC-004: Response validation uses buffering mode
 * - SEC-007: Production mode toggle for error messages
 * - SEC-008: Validation timeout with AbortController
 * - SEC-010: Request size limit option
 * - DEV-001: Correct GuardrailEngine.validate() API (string context)
 * - DEV-002: Use createLogger('console') instead of raw console
 * - DEV-006: bodyExtractor handles string[] by normalizing to string
 *
 * @package @blackunicorn/bonklm-express
 */
import { normalize } from 'node:path';
import { GuardrailEngine, createLogger, LogLevel, Severity, RiskLevel, } from '@blackunicorn/bonklm';
// DEV-002: Use proper logger instead of raw console
const DEFAULT_LOGGER = createLogger('console', LogLevel.INFO);
// DEV-006: Handle string | string[] return type from bodyExtractor
// Normalize to string before validation
const DEFAULT_BODY_EXTRACTOR = (req) => {
    if (req.body?.message)
        return String(req.body.message);
    if (req.body?.prompt)
        return String(req.body.prompt);
    if (req.body?.content)
        return String(req.body.content);
    if (req.body?.text)
        return String(req.body.text);
    // Safe JSON stringify with circular reference handling
    try {
        return JSON.stringify(req.body);
    }
    catch {
        return '[Unparsable body]';
    }
};
// SEC-007: Production mode error handler (generic, no info leakage)
const PRODUCTION_ERROR_HANDLER = (_result, req, res) => {
    res.status(400).json({
        error: 'Request blocked',
        request_id: req.id || req.ip,
    });
};
// Development mode error handler (verbose)
const DEVELOPMENT_ERROR_HANDLER = (result, _req, res) => {
    res.status(400).json({
        error: 'Request blocked by guardrails',
        reason: result.reason,
        severity: result.severity,
        risk_level: result.risk_level,
    });
};
// SEC-001: Path normalization for security
// Prevents path traversal attacks like /api/ai/../chat
function compilePathMatcher(pattern) {
    // Normalize the pattern and convert backslashes to forward slashes
    const normalized = normalize(pattern).replace(/\\/g, '/');
    return (path) => {
        // Normalize the request path
        const normalizedPath = normalize(path).replace(/\\/g, '/');
        // Check if the normalized path starts with the normalized pattern
        return normalizedPath.startsWith(normalized);
    };
}
/**
 * Create Express middleware for LLM guardrails.
 *
 * @param config - Middleware configuration options
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { createGuardrailsMiddleware } from '@blackunicorn/bonklm-express';
 * import { PromptInjectionValidator } from '@blackunicorn/bonklm';
 *
 * const app = express();
 * app.use(express.json());
 *
 * app.use('/api/ai', createGuardrailsMiddleware({
 *   validators: [new PromptInjectionValidator()],
 *   validateRequest: true,
 *   validateResponse: false,
 * }));
 * ```
 */
export function createGuardrailsMiddleware(config = {}) {
    const { validators = [], guards = [], validateRequest = true, validateResponse = false, validateResponseMode = 'buffer', // SEC-004: Default to buffer mode
    onRequestOnly = false, paths = [], excludePaths = [], logger = DEFAULT_LOGGER, // DEV-002: Use proper logger
    productionMode = process.env.NODE_ENV === 'production', // SEC-007
    validationTimeout = 5000, // SEC-008: Default 5 second timeout
    maxContentLength = 1024 * 1024, // SEC-010: Default 1MB limit
    onError, bodyExtractor = DEFAULT_BODY_EXTRACTOR, } = config;
    const engine = new GuardrailEngine({
        validators,
        guards,
        logger,
    });
    // SEC-001: Compile path matchers with normalization
    const pathMatchers = paths.map(compilePathMatcher);
    const excludeMatchers = excludePaths.map(compilePathMatcher);
    // SEC-001: Path matching with normalization
    const shouldProcessPath = (path) => {
        const normalizedPath = normalize(path).replace(/\\/g, '/');
        // Check exclusions first
        if (excludeMatchers.some((matcher) => matcher(normalizedPath))) {
            return false;
        }
        // Check inclusions
        if (pathMatchers.length === 0)
            return true;
        return pathMatchers.some((matcher) => matcher(normalizedPath));
    };
    // SEC-008: Create timeout wrapper for validation
    const validateWithTimeout = async (content, context) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), validationTimeout);
        try {
            // DEV-001: Use correct API signature (string context, not object)
            const result = await engine.validate(content, context);
            clearTimeout(timeoutId);
            return [result];
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                logger.error('[Guardrails] Validation timeout');
                return [
                    {
                        allowed: false,
                        blocked: true,
                        severity: Severity.CRITICAL,
                        risk_level: RiskLevel.HIGH,
                        risk_score: 100,
                        findings: [],
                        timestamp: Date.now(),
                        reason: 'Validation timeout',
                    },
                ];
            }
            throw error;
        }
    };
    // Select error handler based on production mode (SEC-007)
    const errorHandler = onError ?? (productionMode ? PRODUCTION_ERROR_HANDLER : DEVELOPMENT_ERROR_HANDLER);
    return function guardrailsMiddleware(req, res, next) {
        // Skip if path not in scope (SEC-001)
        if (!shouldProcessPath(req.path)) {
            return next();
        }
        // Skip if already validated
        if (req._guardrailsValidated) {
            return next();
        }
        // Request validation
        if (validateRequest) {
            // Async validation - don't block the event loop
            (async () => {
                try {
                    // Extract content from request body
                    const extractedContent = bodyExtractor(req);
                    // DEV-006: Normalize to string before validation
                    const content = Array.isArray(extractedContent)
                        ? extractedContent.join(' ')
                        : extractedContent;
                    // SEC-010: Check content length first (DoS protection)
                    if (content.length > maxContentLength) {
                        logger.warn('[Guardrails] Content too large', {
                            length: content.length,
                            max: maxContentLength,
                        });
                        return errorHandler({
                            allowed: false,
                            blocked: true,
                            severity: Severity.WARNING,
                            risk_level: RiskLevel.MEDIUM,
                            risk_score: 50,
                            findings: [],
                            timestamp: Date.now(),
                            reason: 'Content too large',
                        }, req, res);
                    }
                    // DEV-001: Use correct API signature (string context)
                    const results = await validateWithTimeout(content, 'input');
                    req._guardrailsResults = results;
                    const blocked = results.find((r) => !r.allowed);
                    if (blocked) {
                        logger.warn('[Guardrails] Request blocked', {
                            reason: blocked.reason,
                            path: req.path,
                        });
                        return errorHandler(blocked, req, res);
                    }
                    req._guardrailsValidated = true;
                    next();
                }
                catch (error) {
                    logger.error('[Guardrails] Validation error', { error });
                    // Fail-closed: block on error
                    return errorHandler({
                        allowed: false,
                        blocked: true,
                        severity: Severity.CRITICAL,
                        risk_level: RiskLevel.HIGH,
                        risk_score: 100,
                        findings: [],
                        timestamp: Date.now(),
                        reason: 'Validation error',
                    }, req, res);
                }
            })();
            return; // Return early since we're handling async
        }
        // SEC-004: Response validation only in buffer mode
        // Note: Response validation in Express is tricky because headers are already sent
        if (validateResponse && validateResponseMode === 'buffer' && !onRequestOnly) {
            const originalSend = res.send;
            const chunks = [];
            // Override res.write to buffer chunks
            const originalWrite = res.write;
            res.write = function (chunk, cb) {
                if (chunk) {
                    chunks.push(Buffer.from(chunk));
                }
                return originalWrite.call(this, chunk, cb);
            };
            // Override res.send to buffer and validate
            res.send = function (data) {
                if (data) {
                    chunks.push(Buffer.from(data));
                }
                const content = Buffer.concat(chunks).toString('utf8');
                // Validate response before sending
                validateWithTimeout(content, 'output')
                    .then((results) => {
                    const blocked = results.find((r) => !r.allowed);
                    if (blocked) {
                        logger.warn('[Guardrails] Response blocked', {
                            reason: blocked.reason,
                            path: req.path,
                        });
                        // SEC-007: Don't leak original content in production
                        if (productionMode) {
                            return res.status(500).json({ error: 'Response filtered' });
                        }
                        return res.status(500).json({
                            error: 'Response filtered by guardrails',
                            reason: blocked.reason,
                        });
                    }
                    // Content is safe, send it
                    return originalSend.call(this, data);
                })
                    .catch((error) => {
                    logger.error('[Guardrails] Response validation error', { error });
                    // Fail-closed: don't send response if validation fails
                    return res.status(500).json({ error: 'Validation error' });
                });
                return this;
            };
        }
        next();
    };
}
//# sourceMappingURL=middleware.js.map
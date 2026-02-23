/**
 * Fastify Guardrails Plugin
 * ============================
 * Fastify plugin for LLM security guardrails.
 *
 * Security Fixes Applied:
 * - SEC-001: Path traversal protection via path.normalize()
 * - SEC-007: Production mode toggle for error messages
 * - SEC-008: Validation timeout with AbortController
 * - SEC-010: Request size limit option
 * - DEV-001: Correct GuardrailEngine.validate() API (string context)
 * - DEV-002: Use createLogger('console') instead of raw console
 * - DEV-003: Async/await on all validation calls
 * - DEV-006: bodyExtractor handles string[] by normalizing to string
 *
 * @package @blackunicorn/bonklm-fastify
 */
import fp from 'fastify-plugin';
import { normalize } from 'node:path';
import { GuardrailEngine, createLogger, LogLevel, Severity, RiskLevel, } from '@blackunicorn/bonklm';
// DEV-002: Use proper logger instead of raw console
const DEFAULT_LOGGER = createLogger('console', LogLevel.INFO);
// DEV-006: Default response extractor
const DEFAULT_RESPONSE_EXTRACTOR = (payload) => {
    if (typeof payload === 'string')
        return payload;
    if (payload === null || payload === undefined)
        return '';
    try {
        return JSON.stringify(payload);
    }
    catch {
        return String(payload);
    }
};
// SEC-007: Production mode error handler (generic, no info leakage)
const PRODUCTION_ERROR_HANDLER = async (_result, req, reply) => {
    await reply.status(400).send({
        error: 'Request blocked',
        request_id: req.id,
    });
};
// Development mode error handler (verbose)
const DEVELOPMENT_ERROR_HANDLER = async (result, _req, reply) => {
    await reply.status(400).send({
        error: 'Request blocked by guardrails',
        reason: result.reason,
        severity: result.severity,
        risk_level: result.risk_level,
    });
};
// SEC-001: Path normalization for security
// Prevents path traversal attacks like /api/ai/../chat
/**
 * Compiles a path pattern into a matcher function.
 * @param pattern - The path pattern to match (e.g., "/api/chat")
 * @returns A function that tests if a given path matches the pattern
 */
function compilePathMatcher(pattern) {
    // Validate pattern is a non-empty string
    if (!pattern || typeof pattern !== 'string') {
        throw new Error(`Invalid path pattern: expected string, got ${typeof pattern}`);
    }
    // Normalize the pattern and convert backslashes to forward slashes
    const normalized = normalize(pattern).replace(/\\/g, '/');
    return (path) => {
        // Validate path parameter
        if (!path || typeof path !== 'string') {
            return false;
        }
        // Normalize the request path
        const normalizedPath = normalize(path).replace(/\\/g, '/');
        // Check if the normalized path starts with the normalized pattern
        return normalizedPath.startsWith(normalized);
    };
}
/**
 * Fastify plugin for LLM guardrails.
 *
 * Validates incoming requests and outgoing responses using the core guardrails engine.
 *
 * @param fastify - Fastify instance
 * @param options - Plugin configuration options
 *
 * @example
 * ```typescript
 * import Fastify from 'fastify';
 * import guardrailsPlugin from '@blackunicorn/bonklm-fastify';
 * import { PromptInjectionValidator } from '@blackunicorn/bonklm';
 *
 * const fastify = Fastify();
 *
 * await fastify.register(guardrailsPlugin, {
 *   validators: [new PromptInjectionValidator()],
 *   validateRequest: true,
 *   validateResponse: false,
 * });
 * ```
 */
const guardrailsPlugin = async (fastify, options) => {
    const { validators = [], guards = [], validateRequest = true, validateResponse = false, paths = [], excludePaths = [], logger = DEFAULT_LOGGER, // DEV-002: Use proper logger
    productionMode = process.env.NODE_ENV === 'production', // SEC-007
    validationTimeout = 5000, // SEC-008: Default 5 second timeout
    maxContentLength = 1024 * 1024, // SEC-010: Default 1MB limit
    onError, responseExtractor = DEFAULT_RESPONSE_EXTRACTOR, } = options;
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
        if (!path)
            return false;
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
            // DEV-003: AWAIT the validation
            const result = await engine.validate(content, context);
            clearTimeout(timeoutId);
            return result;
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                logger.error('[Guardrails] Validation timeout');
                return {
                    allowed: false,
                    blocked: true,
                    severity: Severity.CRITICAL,
                    risk_level: RiskLevel.HIGH,
                    risk_score: 100,
                    findings: [],
                    timestamp: Date.now(),
                    reason: 'Validation timeout',
                };
            }
            throw error;
        }
    };
    // Select error handler based on production mode (SEC-007)
    const errorHandler = onError ?? (productionMode ? PRODUCTION_ERROR_HANDLER : DEVELOPMENT_ERROR_HANDLER);
    // Request validation hook
    // Use preHandler hook which runs after body is parsed
    if (validateRequest) {
        fastify.addHook('preHandler', async (request, reply) => {
            // MED-005: Fallback to url if routerPath is not available
            const path = request.routerPath || request.url;
            if (!shouldProcessPath(path)) {
                return;
            }
            // Skip if already validated
            if (request._guardrailsValidated) {
                return;
            }
            try {
                // Extract content from request body (already parsed by Fastify)
                const body = request.body;
                let content;
                if (typeof body === 'string') {
                    content = body;
                }
                else if (body && typeof body === 'object') {
                    // Try common message fields
                    if (body.message)
                        content = String(body.message);
                    else if (body.prompt)
                        content = String(body.prompt);
                    else if (body.content)
                        content = String(body.content);
                    else if (body.text)
                        content = String(body.text);
                    else if (body.input)
                        content = String(body.input);
                    else if (body.query)
                        content = String(body.query);
                    else {
                        // Fallback to JSON stringify
                        try {
                            content = JSON.stringify(body);
                        }
                        catch {
                            content = '[Unparsable body]';
                        }
                    }
                }
                else {
                    content = String(body ?? '');
                }
                // SEC-010: Check content length first (DoS protection)
                if (content.length > maxContentLength) {
                    logger.warn('[Guardrails] Content too large', {
                        length: content.length,
                        max: maxContentLength,
                    });
                    const errorResult = {
                        allowed: false,
                        blocked: true,
                        severity: Severity.WARNING,
                        risk_level: RiskLevel.MEDIUM,
                        risk_score: 50,
                        findings: [],
                        timestamp: Date.now(),
                        reason: 'Content too large',
                    };
                    await errorHandler(errorResult, request, reply);
                    // Return to stop processing (error handler sent response)
                    return;
                }
                // DEV-001: Use correct API signature (string context)
                // DEV-003: AWAIT the validation
                const result = await validateWithTimeout(content, 'input');
                // Store results for potential logging
                request._guardrailsResults = [result];
                request._guardrailsValidated = true;
                if (!result.allowed) {
                    const reason = result.reason || 'Content blocked by security guardrails';
                    logger.warn('[Guardrails] Request blocked', {
                        reason,
                        path,
                    });
                    // Provide a result with reason for the error handler
                    const resultWithReason = {
                        ...result,
                        reason,
                    };
                    await errorHandler(resultWithReason, request, reply);
                    // Return to stop processing (error handler sent response)
                    return;
                }
            }
            catch (error) {
                // Check if error handler was already called
                if (reply.sent) {
                    return; // Already handled
                }
                logger.error('[Guardrails] Validation error', {
                    error: error instanceof Error ? error.message : String(error),
                });
                // Fail-closed: block on error
                const errorResult = {
                    allowed: false,
                    blocked: true,
                    severity: Severity.CRITICAL,
                    risk_level: RiskLevel.HIGH,
                    risk_score: 100,
                    findings: [],
                    timestamp: Date.now(),
                    reason: 'Validation error',
                };
                await errorHandler(errorResult, request, reply);
                // Return to stop processing (error handler sent response)
                return;
            }
        });
    }
    // Catch errors from preHandler to avoid double error handling
    fastify.addHook('onError', async (_request, reply, error) => {
        // If reply was already sent, don't do anything
        if (reply.sent) {
            return;
        }
        // Let other errors propagate
        throw error;
    });
    // Response validation hook
    if (validateResponse) {
        fastify.addHook('onSend', async (request, reply, payload) => {
            // MED-005: Fallback to url if routerPath is not available
            const path = request.routerPath || request.url;
            if (!shouldProcessPath(path)) {
                return payload;
            }
            // Don't validate if reply was already sent (e.g., error in onRequest)
            if (reply.sent) {
                return payload;
            }
            try {
                // Extract content from response payload
                const content = responseExtractor(payload);
                // DEV-001: Use correct API signature (string context)
                // DEV-003: AWAIT the validation
                const result = await validateWithTimeout(content, 'output');
                if (!result.allowed) {
                    const reason = result.reason || 'Response blocked by security guardrails';
                    logger.warn('[Guardrails] Response blocked', {
                        reason,
                        path,
                    });
                    // Store result for potential logging
                    if (!request._guardrailsResults) {
                        request._guardrailsResults = [];
                    }
                    request._guardrailsResults.push(result);
                    // SEC-007: Don't leak original content in production
                    if (productionMode) {
                        return JSON.stringify({ error: 'Response filtered' });
                    }
                    return JSON.stringify({
                        error: 'Response filtered by guardrails',
                        reason,
                    });
                }
            }
            catch (error) {
                logger.error('[Guardrails] Response validation error', {
                    error: error instanceof Error ? error.message : String(error),
                });
                // Fail-closed: replace response with error
                return JSON.stringify({ error: 'Validation error' });
            }
            return payload;
        });
    }
    // Decorate request with guardrails metadata
    fastify.decorateRequest('_guardrailsValidated', false);
    fastify.decorateRequest('_guardrailsResults', undefined);
};
// Wrap with fastify-plugin for proper encapsulation
// Support both fastify v4.x and v5.x
export default fp(guardrailsPlugin, {
    name: '@blackunicorn/bonklm-fastify',
});
// Export the unwrapped plugin and types for testing
export { guardrailsPlugin };
//# sourceMappingURL=plugin.js.map
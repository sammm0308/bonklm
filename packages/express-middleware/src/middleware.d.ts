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
import type { Response, NextFunction } from 'express';
import type { GuardrailsMiddlewareConfig, GuardrailsRequest, ErrorHandler, BodyExtractor } from './types.js';
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
export declare function createGuardrailsMiddleware(config?: GuardrailsMiddlewareConfig): (req: GuardrailsRequest, res: Response, next: NextFunction) => void;
export type { GuardrailsMiddlewareConfig, GuardrailsRequest, ErrorHandler, BodyExtractor };
//# sourceMappingURL=middleware.d.ts.map
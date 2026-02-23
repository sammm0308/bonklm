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
import type { FastifyPluginAsync } from 'fastify';
import type { GuardrailsPluginOptions, GuardrailsRequest, ErrorHandler, ResponseExtractor } from './types.js';
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
declare const guardrailsPlugin: FastifyPluginAsync<GuardrailsPluginOptions>;
declare const _default: FastifyPluginAsync<GuardrailsPluginOptions>;
export default _default;
export { guardrailsPlugin };
export type { GuardrailsPluginOptions, GuardrailsRequest, ErrorHandler, ResponseExtractor, };
//# sourceMappingURL=plugin.d.ts.map
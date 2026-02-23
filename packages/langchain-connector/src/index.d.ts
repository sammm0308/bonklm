/**
 * @blackunicorn/bonklm-langchain
 *
 * LangChain connector for LLM-Guardrails.
 *
 * Provides security guardrails for LangChain operations including:
 * - Input validation for prompt injection and jailbreak detection
 * - Output validation for content filtering
 * - Incremental stream validation for real-time protection
 * - Buffer size limits to prevent DoS
 * - Tool call validation
 *
 * @example
 * ```ts
 * import { GuardrailsCallbackHandler } from '@blackunicorn/bonklm-langchain';
 * import { PromptInjectionValidator } from '@blackunicorn/bonklm';
 *
 * const handler = new GuardrailsCallbackHandler({
 *   validators: [new PromptInjectionValidator()],
 *   validateStreaming: true,
 * });
 *
 * await chain.invoke(input, { callbacks: [handler] });
 * ```
 */
export { GuardrailsCallbackHandler, isGuardrailsViolationError, isStreamValidationError } from './guardrails-handler.js';
export type { GuardrailsCallbackHandlerOptions, StreamValidationContext, } from './types.js';
export { GuardrailsViolationError, StreamValidationError } from './types.js';
export { DEFAULT_VALIDATION_INTERVAL, DEFAULT_MAX_BUFFER_SIZE, DEFAULT_VALIDATION_TIMEOUT, } from './types.js';
//# sourceMappingURL=index.d.ts.map
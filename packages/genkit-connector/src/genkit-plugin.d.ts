/**
 * Google Genkit Guardrail Plugin
 * ===============================
 *
 * Provides security guardrails for Genkit flow operations.
 *
 * Security Features:
 * - SEC-002: Incremental stream validation with early termination
 * - SEC-003: Max buffer size enforcement to prevent DoS
 * - SEC-005: Tool call injection protection via schema validation
 * - SEC-006: Complex message content handling (arrays, images, structured data)
 * - SEC-007: Production mode error messages
 * - SEC-008: Validation timeout with AbortController
 * - SEC-010: Request size limit
 * - DEV-001: Correct GuardrailEngine.validate() API (string context)
 * - DEV-002: Proper logger integration
 * - DEV-003: Async/await on all validation calls
 *
 * @package @blackunicorn/bonklm-genkit
 */
import type { GuardedGenkitOptions, GenkitMessage, GenkitToolCall, GenkitFlowContext, FlowHookResult } from './types.js';
/**
 * Creates a Genkit plugin that wraps flows with guardrail validation.
 *
 * @param options - Configuration options for the guardrail plugin
 * @returns An object with flow wrapper functions for Genkit
 *
 * @example
 * ```ts
 * import { createGenkitGuardrailsPlugin } from '@blackunicorn/bonklm-genkit';
 * import { PromptInjectionValidator } from '@blackunicorn/bonklm';
 * import { configureGenkit } from 'genkit';
 *
 * configureGenkit({
 *   plugins: [
 *     createGenkitGuardrailsPlugin({
 *       validators: [new PromptInjectionValidator()],
 *       validateFlowInput: true,
 *       validateFlowOutput: true,
 *     })
 *   ]
 * });
 * ```
 */
export declare function createGenkitGuardrailsPlugin(options?: GuardedGenkitOptions): {
    beforeFlow: (input: string | GenkitMessage[], context?: GenkitFlowContext) => Promise<FlowHookResult>;
    afterFlow: (response: string | GenkitMessage, context?: GenkitFlowContext) => Promise<FlowHookResult>;
    validateToolCall: (toolCall: GenkitToolCall, context?: GenkitFlowContext) => Promise<FlowHookResult>;
    validateToolResponse: (toolResponse: string | GenkitMessage, context?: GenkitFlowContext) => Promise<FlowHookResult>;
    createStreamValidator: (context?: GenkitFlowContext) => (chunk: string) => Promise<string | null>;
};
/**
 * Creates a flow wrapper with automatic guardrail hooks.
 *
 * @remarks
 * This is a convenience function that wraps a Genkit flow with
 * before/after hooks for automatic validation.
 *
 * @param flow - The Genkit flow function to wrap
 * @param options - Guardrail configuration options
 * @returns Wrapped flow with guardrail hooks applied
 *
 * @example
 * ```ts
 * import { wrapFlow } from '@blackunicorn/bonklm-genkit';
 * import { PromptInjectionValidator } from '@blackunicorn/bonklm';
 *
 * const guardedFlow = wrapFlow(myFlow, {
 *   validators: [new PromptInjectionValidator()],
 * });
 *
 * // Use the flow normally - guardrails are applied automatically
 * const result = await guardedFlow('Hello');
 * ```
 */
export declare function wrapFlow<TInput = string | GenkitMessage[], TOutput = string | GenkitMessage>(flow: (input: TInput) => Promise<TOutput>, options?: GuardedGenkitOptions): (input: TInput) => Promise<TOutput>;
export type { GuardedGenkitOptions, GenkitMessage, GenkitToolCall, GenkitFlowContext, FlowHookResult, } from './types.js';
//# sourceMappingURL=genkit-plugin.d.ts.map
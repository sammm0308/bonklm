/**
 * Mastra Framework Guardrail Integration
 * =====================================
 *
 * Provides security guardrails for Mastra agent and workflow operations.
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
 * @package @blackunicorn/bonklm-mastra
 */
import type { GuardedMastraOptions, MastraMessage, MastraToolCall, MastraAgentContext, AgentHookResult } from './types.js';
/**
 * Creates a Mastra guardrail integration that intercepts and validates agent operations.
 *
 * @param options - Configuration options for the guardrail integration
 * @returns An object with hook functions for Mastra agents
 *
 * @example
 * ```ts
 * import { createGuardedMastra } from '@blackunicorn/bonklm-mastra';
 * import { PromptInjectionValidator } from '@blackunicorn/bonklm';
 *
 * const guardrails = createGuardedMastra({
 *   validators: [new PromptInjectionValidator()],
 *   validateAgentInput: true,
 *   validateAgentOutput: true,
 * });
 *
 * // Use with Mastra agent
 * agent.beforeExecution(async (context) => {
 *   const result = await guardrails.beforeAgentExecution(context.messages, context);
 *   if (!result.allowed) throw new Error(result.blockedReason);
 * });
 * ```
 */
export declare function createGuardedMastra(options?: GuardedMastraOptions): {
    beforeAgentExecution: (messages: MastraMessage[], context?: MastraAgentContext) => Promise<AgentHookResult>;
    afterAgentExecution: (response: string | MastraMessage, context?: MastraAgentContext) => Promise<AgentHookResult>;
    validateToolCall: (toolCall: MastraToolCall, context?: MastraAgentContext) => Promise<AgentHookResult>;
    validateToolResult: (toolResult: string | MastraMessage, toolCall: MastraToolCall, context?: MastraAgentContext) => Promise<AgentHookResult>;
    createStreamValidator: (context?: MastraAgentContext) => (chunk: string) => Promise<string | null>;
};
/**
 * Creates a Mastra agent wrapper with automatic guardrail hooks.
 *
 * @remarks
 * This is a convenience function that wraps a Mastra agent with
 * before/after hooks for automatic validation.
 *
 * @param agent - The Mastra agent to wrap
 * @param options - Guardrail configuration options
 * @returns Wrapped agent with guardrail hooks applied
 *
 * @example
 * ```ts
 * import { wrapAgent } from '@blackunicorn/bonklm-mastra';
 * import { PromptInjectionValidator } from '@blackunicorn/bonklm';
 *
 * const guardedAgent = wrapAgent(myAgent, {
 *   validators: [new PromptInjectionValidator()],
 * });
 *
 * // Use the agent normally - guardrails are applied automatically
 * const result = await guardedAgent.execute('Hello');
 * ```
 */
export declare function wrapAgent<TAgent extends {
    execute: (input: string | MastraMessage[]) => Promise<string | MastraMessage>;
}>(agent: TAgent, options?: GuardedMastraOptions): TAgent;
export type { GuardedMastraOptions, MastraMessage, MastraToolCall, MastraAgentContext, AgentHookResult, } from './types.js';
//# sourceMappingURL=mastra-guardrail.d.ts.map
/**
 * LLM-Guardrails Mastra Connector
 * ================================
 *
 * Provides security guardrails integration for the Mastra AI framework.
 *
 * @package @blackunicorn/bonklm-mastra
 * @version 1.0.0
 */
export { createGuardedMastra, wrapAgent, } from './mastra-guardrail.js';
export { messagesToText, toolCallsToText, normalizeToString, } from './messages-to-text.js';
export type { GuardedMastraOptions, MastraMessage, MastraToolCall, MastraAgentContext, AgentHookResult, MastraContentPart, } from './types.js';
export { StreamValidationError, DEFAULT_MAX_BUFFER_SIZE, DEFAULT_MAX_CONTENT_LENGTH, DEFAULT_VALIDATION_TIMEOUT, VALIDATION_INTERVAL, } from './types.js';
//# sourceMappingURL=index.d.ts.map
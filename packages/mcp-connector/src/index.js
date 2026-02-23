/**
 * MCP SDK Connector for LLM-Guardrails
 *
 * Provides security guardrails for Model Context Protocol (MCP) tool calls.
 * Validates tool inputs and outputs to prevent injection attacks and
 * ensure safe AI interactions with tools.
 *
 * @package @blackunicorn/bonklm-mcp
 */
export { createGuardedMCP } from './guarded-mcp.js';
export { DEFAULT_MAX_ARGUMENT_SIZE, DEFAULT_VALIDATION_TIMEOUT, VALID_TOOL_NAME_PATTERN, MAX_TOOL_NAME_LENGTH, } from './types.js';
//# sourceMappingURL=index.js.map
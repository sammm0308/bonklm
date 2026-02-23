/**
 * MCP SDK Guarded Wrapper
 * =========================
 *
 * Provides security guardrails for MCP SDK operations.
 *
 * Security Features:
 * - SEC-005: Tool call injection via JSON.stringify - schema validation
 * - SEC-007: Production mode error messages
 * - SEC-008: Validation timeout with AbortController
 * - DEV-001: Correct GuardrailEngine.validate() API (string context)
 * - DEV-002: Proper logger integration
 *
 * @package @blackunicorn/bonklm-mcp
 */
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { GuardedMCPOptions, ToolCallOptions, ToolCallResult, ToolInfo } from './types.js';
/**
 * Interface for the guarded MCP client wrapper.
 *
 * @internal
 */
interface GuardedMCPClient {
    callTool(opts: ToolCallOptions): Promise<ToolCallResult>;
    listTools(): Promise<{
        tools: ToolInfo[];
    }>;
    close(): Promise<void>;
}
/**
 * Creates a guarded MCP wrapper that intercepts and validates all tool calls.
 *
 * @param client - The MCP client instance to wrap
 * @param options - Configuration options for the guarded wrapper
 * @returns An object with callTool and listTools methods that validate input/output
 *
 * @example
 * ```ts
 * import { Client } from '@modelcontextprotocol/sdk/client/index.js';
 * import { createGuardedMCP } from '@blackunicorn/bonklm-mcp';
 * import { PromptInjectionValidator } from '@blackunicorn/bonklm';
 *
 * const mcpClient = new Client();
 * const guardedMCP = createGuardedMCP(mcpClient, {
 *   validators: [new PromptInjectionValidator()],
 *   allowedTools: ['calculator', 'weather'],
 *   validateToolCalls: true,
 *   validateToolResults: true,
 * });
 *
 * const result = await guardedMCP.callTool({
 *   name: 'calculator',
 *   arguments: { operation: 'add', a: 5, b: 10 }
 * });
 * ```
 */
export declare function createGuardedMCP(client: Client, options?: GuardedMCPOptions): GuardedMCPClient;
/**
 * Re-exports types for convenience.
 */
export type { GuardedMCPOptions, ToolCallOptions, ToolCallResult, ToolInfo, };
//# sourceMappingURL=guarded-mcp.d.ts.map
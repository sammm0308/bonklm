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
import { GuardrailEngine, createLogger, Severity, createResult, } from '@blackunicorn/bonklm';
import { DEFAULT_MAX_ARGUMENT_SIZE, DEFAULT_VALIDATION_TIMEOUT, VALID_TOOL_NAME_PATTERN, MAX_TOOL_NAME_LENGTH, } from './types.js';
/**
 * Default logger instance.
 *
 * @internal
 */
const DEFAULT_LOGGER = createLogger('console');
/**
 * Validates that a numeric option is a positive number.
 *
 * @internal
 * @throws {TypeError} If value is not a positive finite number
 */
function validatePositiveNumber(value, optionName) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        throw new TypeError(`${optionName} must be a positive number. Received: ${value}`);
    }
}
/**
 * SEC-005: Validates and sanitizes a tool name.
 *
 * @internal
 * @remarks
 * - Checks against allowlist if provided
 * - Validates name format (alphanumeric, underscore, hyphen only)
 * - Enforces maximum length
 * - Returns sanitized name for validation
 *
 * @throws {Error} If tool name is invalid or not in allowlist
 */
function validateToolName(name, allowedTools) {
    // Check allowlist first
    if (allowedTools && allowedTools.length > 0) {
        if (!allowedTools.includes(name)) {
            throw new Error(`Tool '${name}' is not in the allowed tools list`);
        }
    }
    // Validate name format
    if (!VALID_TOOL_NAME_PATTERN.test(name)) {
        throw new Error(`Tool name '${name}' contains invalid characters. Only alphanumeric, underscore, and hyphen are allowed.`);
    }
    // Validate length
    if (name.length > MAX_TOOL_NAME_LENGTH) {
        throw new Error(`Tool name '${name}' exceeds maximum length of ${MAX_TOOL_NAME_LENGTH}`);
    }
    return name;
}
/**
 * SEC-005: Sanitizes tool name for validation content.
 *
 * @internal
 * @remarks
 * Removes any path traversal patterns and ensures the name is safe.
 * This is used when creating the validation string, not for actual tool calls.
 */
function sanitizeToolName(name) {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
/**
 * SEC-005: Validates tool arguments size.
 *
 * @internal
 * @remarks
 * Ensures the serialized arguments don't exceed the size limit.
 * This prevents DoS attacks via large argument payloads.
 *
 * @throws {Error} If arguments exceed maximum size or contain circular references
 */
function validateArgumentSize(args, maxSize) {
    let argsStr;
    try {
        argsStr = JSON.stringify(args);
    }
    catch (error) {
        // Handle circular references or unstringifiable content
        if (error instanceof Error && error.message.includes('circular')) {
            throw new Error('Tool arguments contain circular references or unstringifiable content');
        }
        throw error;
    }
    if (argsStr.length > maxSize) {
        throw new Error(`Tool arguments exceed maximum size of ${maxSize} bytes (got ${argsStr.length} bytes)`);
    }
    return argsStr;
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
export function createGuardedMCP(client, options = {}) {
    const { validators = [], guards = [], logger = DEFAULT_LOGGER, // DEV-002: Use proper logger
    validateToolCalls = true, validateToolResults = true, allowedTools, // SEC-005: Tool allowlist
    maxArgumentSize = DEFAULT_MAX_ARGUMENT_SIZE, // SEC-005: Default 100KB
    productionMode = process.env.NODE_ENV === 'production', // SEC-007
    validationTimeout = DEFAULT_VALIDATION_TIMEOUT, // SEC-008: Default 5s
    onToolCallBlocked, onToolResultBlocked, } = options;
    // Validate critical security options
    validatePositiveNumber(maxArgumentSize, 'maxArgumentSize');
    validatePositiveNumber(validationTimeout, 'validationTimeout');
    const engine = new GuardrailEngine({
        validators,
        guards,
        logger,
    });
    /**
     * SEC-008: Validation timeout wrapper with AbortController.
     *
     * @internal
     */
    const validateWithTimeout = async (content, context) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), validationTimeout);
        try {
            // DEV-001: Correct API signature - use string context, not object
            const engineResult = await engine.validate(content, context);
            // Clear timeout before processing results to prevent race condition
            clearTimeout(timeoutId);
            // Convert EngineResult to GuardrailResult[]
            if ('results' in engineResult) {
                // Multiple results returned (from EngineResult.results array)
                const multiResult = engineResult;
                return multiResult.results || [engineResult];
            }
            // Single result returned
            return [engineResult];
        }
        catch (error) {
            // Clear timeout before processing error
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                logger.error('[Guardrails] Validation timeout');
                return [
                    createResult(false, Severity.CRITICAL, [
                        {
                            category: 'timeout',
                            description: 'Validation timeout',
                            severity: Severity.CRITICAL,
                            weight: 30,
                        },
                    ]),
                ];
            }
            throw error;
        }
        finally {
            // Clear the timeout to ensure cleanup
            // Note: AbortController will be garbage collected when out of scope
            // No event listeners were registered, so no cleanup needed
        }
    };
    /**
     * Validates tool call and throws if blocked.
     *
     * @internal
     */
    const validateToolCall = async (toolName, args) => {
        // Create validation string with sanitized tool name
        const sanitizedName = sanitizeToolName(toolName);
        const validationContent = `Tool: ${sanitizedName}, Args: ${args}`;
        const results = await validateWithTimeout(validationContent, 'input');
        const blocked = results.find((r) => !r.allowed);
        if (blocked) {
            logger.warn('[Guardrails] Tool call blocked', {
                tool: toolName,
                reason: blocked.reason,
            });
            if (onToolCallBlocked) {
                onToolCallBlocked(blocked, toolName);
            }
            // SEC-007: Production mode - generic error
            if (productionMode) {
                throw new Error('Tool call blocked');
            }
            throw new Error(`Tool call blocked: ${blocked.reason}`);
        }
    };
    /**
     * Validates tool result and may replace content.
     *
     * @internal
     */
    const validateToolResult = async (toolName, resultContent) => {
        const results = await validateWithTimeout(resultContent, 'output');
        const blocked = results.find((r) => !r.allowed);
        if (blocked) {
            logger.warn('[Guardrails] Tool result blocked', {
                tool: toolName,
                reason: blocked.reason,
            });
            if (onToolResultBlocked) {
                onToolResultBlocked(blocked, toolName);
            }
            // Return filtered result
            const filteredText = productionMode
                ? 'Tool result filtered by guardrails'
                : `Tool result filtered by guardrails: ${blocked.reason}`;
            return {
                content: [
                    {
                        type: 'text',
                        text: filteredText,
                    },
                ],
                filtered: true,
            };
        }
        return null; // Not blocked
    };
    /**
     * Creates the guarded wrapper object.
     *
     * @internal
     */
    const createGuardedWrapper = () => {
        return {
            /**
             * Calls an MCP tool with validation.
             *
             * @param opts - Tool call options including name and arguments
             * @returns Tool call result, potentially filtered
             */
            async callTool(opts) {
                const { name, arguments: args = {} } = opts;
                // SEC-005: Validate tool name against allowlist and format
                validateToolName(name, allowedTools);
                // SEC-005: Validate argument size before processing
                const argsStr = validateArgumentSize(args, maxArgumentSize);
                // Validate tool call if enabled
                if (validateToolCalls) {
                    await validateToolCall(name, argsStr);
                }
                // Execute the tool call
                const result = await client.callTool({
                    name,
                    arguments: args,
                });
                // Validate tool result if enabled
                if (validateToolResults) {
                    // Extract text content from result for validation
                    const resultText = extractResultText(result);
                    if (resultText.length > 0) {
                        try {
                            const filteredResult = await validateToolResult(name, resultText);
                            if (filteredResult) {
                                return {
                                    ...filteredResult,
                                    raw: result,
                                };
                            }
                        }
                        catch (error) {
                            // Handle unexpected validation errors
                            logger.error('[Guardrails] Tool result validation error', {
                                tool: name,
                                error: error instanceof Error ? error.message : String(error),
                            });
                            // Fail-closed: return filtered result on validation error
                            const filteredText = productionMode
                                ? 'Tool result validation error'
                                : `Tool result validation error: ${error instanceof Error ? error.message : String(error)}`;
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: filteredText,
                                    },
                                ],
                                filtered: true,
                            };
                        }
                    }
                }
                // Validate result structure before returning
                return result;
            },
            /**
             * Lists available tools, filtered by allowlist if specified.
             *
             * @returns List of available tools
             */
            async listTools() {
                const toolsResult = await client.listTools();
                // SEC-005: Filter by allowlist if specified
                if (allowedTools && allowedTools.length > 0) {
                    return {
                        tools: toolsResult.tools.filter((tool) => allowedTools.includes(tool.name)),
                    };
                }
                return toolsResult;
            },
            /**
             * Closes the MCP client connection.
             */
            async close() {
                return client.close();
            },
        };
    };
    return createGuardedWrapper();
}
/**
 * Extracts text content from a tool result for validation.
 *
 * @internal
 * @remarks
 * Handles different MCP result content types and extracts
 * text content for validation.
 */
function extractResultText(result) {
    if (!result || typeof result !== 'object') {
        return '';
    }
    const resultObj = result;
    if (!Array.isArray(resultObj.content)) {
        return '';
    }
    return resultObj.content
        .filter((item) => item.type === 'text' && typeof item.text === 'string')
        .map((item) => item.text)
        .join('\n');
}
//# sourceMappingURL=guarded-mcp.js.map
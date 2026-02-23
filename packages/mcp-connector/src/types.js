/**
 * MCP SDK Connector Types
 *
 * This file contains all TypeScript type definitions for the MCP SDK connector.
 * Includes security-related options for tool call validation, argument size limits,
 * and production mode error handling.
 *
 * Security Features:
 * - SEC-005: Tool call injection via JSON.stringify - schema validation
 * - SEC-007: Production mode error messages
 * - SEC-008: Validation timeout
 * - DEV-001: Correct GuardrailEngine API
 * - DEV-002: Logger type
 */
/**
 * Default max argument size (100KB).
 *
 * @internal
 */
export const DEFAULT_MAX_ARGUMENT_SIZE = 1024 * 100;
/**
 * Default validation timeout (5 seconds).
 *
 * @internal
 */
export const DEFAULT_VALIDATION_TIMEOUT = 5000;
/**
 * Valid characters for tool names.
 *
 * @internal
 * @remarks
 * Tool names should only contain alphanumeric characters, underscores, and hyphens.
 */
export const VALID_TOOL_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
/**
 * Maximum allowed tool name length.
 *
 * @internal
 */
export const MAX_TOOL_NAME_LENGTH = 128;
//# sourceMappingURL=types.js.map
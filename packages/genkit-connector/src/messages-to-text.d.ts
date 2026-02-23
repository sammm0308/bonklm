/**
 * Genkit Message Content Extractor
 * =================================
 *
 * Extracts text content from Genkit messages for validation.
 *
 * Security Features:
 * - SEC-006: Complex message content handling (arrays, images, structured data)
 * - SEC-005: Tool call content extraction
 *
 * @package @blackunicorn/bonklm-genkit
 */
import type { GenkitMessage, GenkitToolCall } from './types.js';
/**
 * Extracts text content from Genkit messages.
 *
 * @remarks
 * Handles complex message content types per SEC-006.
 *
 * @param messages - Array of GenkitMessage objects
 * @returns Concatenated text content from all messages
 */
export declare function messagesToText(messages: GenkitMessage[]): string;
/**
 * Extracts text from tool calls for validation.
 *
 * @remarks
 * Addresses SEC-005: Tool call injection protection.
 *
 * @param toolCalls - Array of GenkitToolCall objects
 * @returns Concatenated text representation of tool calls
 */
export declare function toolCallsToText(toolCalls: GenkitToolCall[]): string;
/**
 * Normalizes content to string for validation.
 *
 * @remarks
 * Ensures any input is converted to a string for validation.
 *
 * @param content - Content to normalize
 * @returns String representation of content
 */
export declare function normalizeToString(content: unknown): string;
//# sourceMappingURL=messages-to-text.d.ts.map
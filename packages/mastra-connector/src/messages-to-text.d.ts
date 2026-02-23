/**
 * Mastra Message Content Extractor
 * ================================
 *
 * Extracts text content from Mastra messages for validation.
 *
 * Security Features:
 * - SEC-006: Complex message content handling (arrays, images, structured data)
 * - SEC-005: Tool call content extraction
 *
 * @package @blackunicorn/bonklm-mastra
 */
import type { MastraMessage, MastraToolCall } from './types.js';
/**
 * Extracts text content from Mastra messages.
 *
 * @remarks
 * Handles complex message content types per SEC-006:
 * - String content: "Hello"
 * - Array content: [{type: 'text', text: 'Hello'}, {type: 'image_url', ...}]
 * - Tool call content: Extracts tool name and input
 *
 * This is a critical security function as it prevents validation bypass
 * when messages contain structured data or images.
 *
 * @param messages - Array of MastraMessage objects
 * @returns Concatenated text content from all messages
 *
 * @example
 * ```ts
 * const messages: MastraMessage[] = [
 *   { role: 'user', content: 'Hello' },
 *   { role: 'user', content: [{ type: 'text', text: 'Hi there' }] }
 * ];
 * const text = messagesToText(messages); // "Hello\nHi there"
 * ```
 */
export declare function messagesToText(messages: MastraMessage[]): string;
/**
 * Extracts text from tool calls for validation.
 *
 * @remarks
 * Addresses SEC-005: Tool call injection protection.
 * Extracts tool name and serialized input for validation.
 *
 * @param toolCalls - Array of MastraToolCall objects
 * @returns Concatenated text representation of tool calls
 *
 * @example
 * ```ts
 * const toolCalls: MastraToolCall[] = [
 *   { id: '1', name: 'search', input: { query: 'test' } }
 * ];
 * const text = toolCallsToText(toolCalls); // "Tool: search\nInput: {\"query\":\"test\"}"
 * ```
 */
export declare function toolCallsToText(toolCalls: MastraToolCall[]): string;
/**
 * Normalizes content to string for validation.
 *
 * @remarks
 * Ensures any input is converted to a string for validation.
 * Handles arrays, objects, and primitive types safely.
 *
 * @param content - Content to normalize
 * @returns String representation of content
 */
export declare function normalizeToString(content: unknown): string;
//# sourceMappingURL=messages-to-text.d.ts.map
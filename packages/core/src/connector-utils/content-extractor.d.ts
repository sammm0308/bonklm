/**
 * Connector Utilities - Content Extractor
 * ======================================
 *
 * Standard utilities for extracting content from various response formats.
 * Handles 10+ response formats across different LLM and vector DB providers.
 *
 * @package @blackunicorn/bonklm/core
 */
/**
 * Content extraction options.
 */
export interface ContentExtractorOptions {
    /** Fields to check for content (in priority order) */
    fields?: string[];
    /** Default value if no content found */
    defaultValue?: string;
    /** Whether to throw error if no content found */
    throwOnMissing?: boolean;
}
/**
 * Extracts text content from a variety of response formats.
 * Handles different response structures from various providers.
 *
 * Supported formats:
 * - String responses
 * - Object responses with named fields (text, content, output, message, etc.)
 * - Nested structures (choices[0].message.content, data[0].text, etc.)
 * - Array responses
 *
 * @param response - The response object from a provider
 * @param options - Extraction options
 * @returns Extracted text content
 *
 * @example
 * ```ts
 * // OpenAI format
 * const text = extractContentFromResponse({
 *   choices: [{ message: { content: 'Hello' } }]
 * });
 *
 * // HuggingFace format
 * const text = extractContentFromResponse({
 *   generated_text: 'Hello world'
 * });
 *
 * // Anthropic format
 * const text = extractContentFromResponse({
 *   content: [{ text: 'Hello' }]
 * });
 * ```
 */
export declare function extractContentFromResponse(response: unknown, options?: ContentExtractorOptions): string;
/**
 * Extracts content from an array of potential response formats.
 * Useful when a provider might return different formats.
 *
 * @param responses - Array of possible response objects
 * @param options - Extraction options
 * @returns First successfully extracted content
 *
 * @example
 * ```ts
 * const text = extractContentFirstSuccess([
 *   response.data,
 *   response,
 *   response.output
 * ]);
 * ```
 */
export declare function extractContentFirstSuccess(responses: unknown[], options?: ContentExtractorOptions): string;
/**
 * Joins multiple content extracts into a single string.
 * Useful for handling multi-part responses.
 *
 * @param responses - Array of response objects or strings
 * @param separator - Separator between content items
 * @param options - Extraction options
 * @returns Joined content string
 *
 * @example
 * ```ts
 * const combined = extractContentJoined([
 *   response1,
 *   response2.data,
 *   response3
 * ], '\n\n');
 * ```
 */
export declare function extractContentJoined(responses: unknown[], separator?: string, options?: ContentExtractorOptions): string;
//# sourceMappingURL=content-extractor.d.ts.map
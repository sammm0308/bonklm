/**
 * OpenAI SDK Guarded Wrapper
 * ==========================
 *
 * Provides security guardrails for OpenAI SDK operations.
 *
 * Security Features:
 * - SEC-002: Incremental stream validation with early termination
 * - SEC-003: Max buffer size enforcement to prevent DoS
 * - SEC-006: Complex message content handling (arrays, images, structured data)
 * - SEC-007: Production mode error messages
 * - SEC-008: Validation timeout with AbortController
 * - DEV-001: Correct GuardrailEngine.validate() API (string context)
 * - DEV-002: Proper logger integration
 *
 * @package @blackunicorn/bonklm-openai
 */
import type OpenAI from 'openai';
import type { ChatCompletion, ChatCompletionChunk, ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { GuardedOpenAIOptions, GuardedChatCompletionOptions, GuardedChatCompletion, MessageContent } from './types.js';
/**
 * Extracts text content from OpenAI messages.
 *
 * @remarks
 * Handles complex message content types per SEC-006:
 * - String content: "Hello"
 * - Array content: [{type: 'text', text: 'Hello'}, {type: 'image_url', image_url: '...'}]
 *
 * This is a critical security function as it prevents validation bypass
 * when messages contain structured data or images.
 *
 * @param messages - Array of ChatCompletionMessageParam objects
 * @returns Concatenated text content from all messages
 *
 * @example
 * ```ts
 * const messages: ChatCompletionMessageParam[] = [
 *   { role: 'user', content: 'Hello' },
 *   { role: 'user', content: [{ type: 'text', text: 'Hi there' }] }
 * ];
 * const text = messagesToText(messages); // "Hello\nHi there"
 * ```
 */
export declare function messagesToText(messages: ChatCompletionMessageParam[]): string;
export declare function createGuardedOpenAI(client: OpenAI, options?: GuardedOpenAIOptions): OpenAI & {
    chat: {
        completions: {
            create: (opts: GuardedChatCompletionOptions) => Promise<ChatCompletion | AsyncIterable<ChatCompletionChunk>>;
        };
    };
};
/**
 * Re-exports types for convenience.
 */
export type { GuardedOpenAIOptions, GuardedChatCompletionOptions, GuardedChatCompletion, MessageContent, };
//# sourceMappingURL=guarded-openai.d.ts.map
/**
 * Anthropic SDK Guarded Wrapper
 * =============================
 *
 * Provides security guardrails for Anthropic SDK operations.
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
 * @package @blackunicorn/bonklm-anthropic
 */
import Anthropic from '@anthropic-ai/sdk';
import type { MessageStreamEvent, Message, MessageParam } from '@anthropic-ai/sdk/resources/messages.js';
import type { GuardedAnthropicOptions, GuardedMessageOptions, GuardedMessage } from './types.js';
/**
 * Extracts text content from Anthropic messages.
 *
 * @remarks
 * Handles complex message content types per SEC-006:
 * - String content: "Hello"
 * - Array content: [{type: 'text', text: 'Hello'}, {type: 'image', source: {type: 'base64', ...}}]
 *
 * This is a critical security function as it prevents validation bypass
 * when messages contain structured data or images.
 *
 * @param messages - Array of MessageParam objects
 * @returns Concatenated text content from all messages
 *
 * @example
 * ```ts
 * const messages: MessageParam[] = [
 *   { role: 'user', content: 'Hello' },
 *   { role: 'user', content: [{ type: 'text', text: 'Hi there' }] }
 * ];
 * const text = messagesToText(messages); // "Hello\nHi there"
 * ```
 */
export declare function messagesToText(messages: MessageParam[]): string;
/**
 * Creates a guarded Anthropic wrapper that intercepts and validates all API calls.
 *
 * @param client - The Anthropic client instance to wrap
 * @param options - Configuration options for the guarded wrapper
 * @returns An object with messages.create method that validates input/output
 *
 * @example
 * ```ts
 * import Anthropic from '@anthropic-ai/sdk';
 * import { createGuardedAnthropic } from '@blackunicorn/bonklm-anthropic';
 * import { PromptInjectionValidator } from '@blackunicorn/bonklm';
 *
 * const anthropic = new Anthropic();
 * const guardedAnthropic = createGuardedAnthropic(anthropic, {
 *   validators: [new PromptInjectionValidator()],
 *   validateStreaming: true,
 *   streamingMode: 'incremental',
 * });
 *
 * const response = await guardedAnthropic.messages.create({
 *   model: 'claude-3-opus-20240229',
 *   messages: [{ role: 'user', content: userInput }]
 * });
 * ```
 */
export declare function createGuardedAnthropic(client: Anthropic, options?: GuardedAnthropicOptions): Omit<Anthropic, 'messages'> & {
    messages: {
        create: (opts: GuardedMessageOptions) => Promise<Message | AsyncIterable<MessageStreamEvent>>;
    };
};
/**
 * Re-exports types for convenience.
 */
export type { GuardedAnthropicOptions, GuardedMessageOptions, GuardedMessage, };
//# sourceMappingURL=guarded-anthropic.d.ts.map
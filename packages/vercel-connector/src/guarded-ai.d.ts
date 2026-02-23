/**
 * Vercel AI SDK Guarded Wrapper
 * ============================
 *
 * Provides security guardrails for Vercel AI SDK operations.
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
 * @package @blackunicorn/bonklm-vercel
 */
import type { CoreMessage } from 'ai';
import type { GuardedAIOptions, GuardedGenerateTextOptions, GuardedTextResult } from './types.js';
/**
 * Extracts text content from CoreMessage array.
 *
 * @remarks
 * Handles complex message content types per SEC-006:
 * - String content: "Hello"
 * - Array content: [{type: 'text', text: 'Hello'}, {type: 'image', image: '...'}]
 *
 * This is a critical security function as it prevents validation bypass
 * when messages contain structured data or images.
 *
 * @param messages - Array of CoreMessage objects
 * @returns Concatenated text content from all messages
 *
 * @example
 * ```ts
 * const messages: CoreMessage[] = [
 *   { role: 'user', content: 'Hello' },
 *   { role: 'assistant', content: [{ type: 'text', text: 'Hi there' }] }
 * ];
 * const text = messagesToText(messages); // "Hello\nHi there"
 * ```
 */
export declare function messagesToText(messages: CoreMessage[]): string;
/**
 * Creates a guarded AI wrapper for Vercel AI SDK operations.
 *
 * @param options - Configuration options for the guarded wrapper
 * @returns An object with `generateText` and `streamText` methods
 *
 * @example
 * ```ts
 * import { createOpenAI } from '@ai-sdk/openai';
 * import { createGuardedAI } from '@blackunicorn/bonklm-vercel';
 * import { PromptInjectionValidator } from '@blackunicorn/bonklm';
 *
 * const openai = createOpenAI();
 * const guardedAI = createGuardedAI({
 *   validators: [new PromptInjectionValidator()],
 *   validateStreaming: true,
 *   streamingMode: 'incremental',
 * });
 *
 * const result = await guardedAI.generateText({
 *   model: openai('gpt-4'),
 *   messages: [{ role: 'user', content: userInput }]
 * });
 * ```
 */
export interface GuardedAIInstance {
    generateText(opts: GuardedGenerateTextOptions): Promise<GuardedTextResult>;
    streamText(opts: GuardedGenerateTextOptions & {
        stream: true;
    }): Promise<any>;
}
export declare function createGuardedAI(options?: GuardedAIOptions): GuardedAIInstance;
/**
 * Re-exports types for convenience.
 */
export type { GuardedAIOptions, GuardedGenerateTextOptions, GuardedStreamOptions, GuardedTextResult, } from './types.js';
/**
 * Re-exports the messagesToText utility for external use.
 * This can be shared across different connectors (DEV-005).
 */
//# sourceMappingURL=guarded-ai.d.ts.map
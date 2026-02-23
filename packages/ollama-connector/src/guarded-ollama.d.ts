/**
 * Ollama SDK Guarded Wrapper
 * =============================
 *
 * Provides security guardrails for Ollama SDK operations.
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
 * @package @blackunicorn/bonklm-ollama
 */
import type { Ollama } from 'ollama';
import type { GuardedOllamaOptions, GuardedChatOptions, GuardedGenerateOptions, GuardedChatResult, GuardedGenerateResult, OllamaMessage } from './types.js';
/**
 * Extracts text content from Ollama messages.
 *
 * @remarks
 * Handles complex message content types per SEC-006:
 * - String content: "Hello"
 * - Messages with images: { role: 'user', content: 'Hello', images: [...] }
 *
 * This is a critical security function as it prevents validation bypass
 * when messages contain structured data or images.
 *
 * @param messages - Array of Ollama message objects
 * @returns Concatenated text content from all messages
 *
 * @example
 * ```ts
 * const messages: OllamaMessage[] = [
 *   { role: 'user', content: 'Hello' },
 *   { role: 'assistant', content: 'Hi there' }
 * ];
 * const text = messagesToText(messages); // "Hello\nHi there"
 * ```
 */
export declare function messagesToText(messages: OllamaMessage[]): string;
/**
 * Creates a guarded Ollama wrapper that intercepts and validates all API calls.
 *
 * @param client - The Ollama client instance to wrap
 * @param options - Configuration options for the guarded wrapper
 * @returns An object with chat() and generate() methods that validate input/output
 *
 * @example
 * ```ts
 * import { Ollama } from 'ollama';
 * import { createGuardedOllama } from '@blackunicorn/bonklm-ollama';
 * import { PromptInjectionValidator } from '@blackunicorn/bonklm';
 *
 * const ollama = new Ollama({ host: 'http://localhost:11434' });
 * const guardedOllama = createGuardedOllama(ollama, {
 *   validators: [new PromptInjectionValidator()],
 *   validateStreaming: true,
 *   streamingMode: 'incremental',
 * });
 *
 * const response = await guardedOllama.chat({
 *   model: 'llama3.1',
 *   messages: [{ role: 'user', content: userInput }]
 * });
 * ```
 */
export declare function createGuardedOllama(client: Ollama, options?: GuardedOllamaOptions): Omit<Ollama, 'chat' | 'generate'> & {
    chat: (opts: GuardedChatOptions) => Promise<any>;
    generate: (opts: GuardedGenerateOptions) => Promise<any>;
};
/**
 * Re-exports types for convenience.
 */
export type { GuardedOllamaOptions, GuardedChatOptions, GuardedGenerateOptions, GuardedChatResult, GuardedGenerateResult, };
//# sourceMappingURL=guarded-ollama.d.ts.map
/**
 * HuggingFace Guarded Wrapper
 * ===========================
 *
 * Provides security guardrails for HuggingFace Inference API operations.
 *
 * Security Features:
 * - Input prompt validation
 * - Output response validation
 * - Model reference validation
 * - Production mode error messages
 * - Validation timeout with AbortController
 *
 * @package @blackunicorn/bonklm-huggingface
 */
import type { GuardedHuggingFaceOptions } from './types.js';
/**
 * Creates a guarded HuggingFace inference client wrapper.
 *
 * @param hfClient - The HuggingFace inference client to wrap
 * @param options - Configuration options for the guarded wrapper
 * @returns A guarded inference client with validation
 *
 * @example
 * ```ts
 * import { HfInference } from '@huggingface/inference';
 * import { createGuardedInference } from '@blackunicorn/bonklm-huggingface';
 * import { PromptInjectionValidator, PIIGuard } from '@blackunicorn/bonklm';
 *
 * const hf = new HfInference(process.env.HF_API_KEY);
 *
 * const guardedHF = createGuardedInference(hf, {
 *   validators: [new PromptInjectionValidator()],
 *   guards: [new PIIGuard()],
 *   allowedModels: ['meta-llama/Llama-3*', 'mistralai/Mistral*']
 * });
 *
 * const result = await guardedHF.textGeneration({
 *   model: 'meta-llama/Llama-3-8b',
 *   inputs: 'What is the capital of France?'
 * });
 * ```
 */
export declare function createGuardedInference(hfClient: any, options?: GuardedHuggingFaceOptions): any;
/**
 * Re-exports types for convenience.
 */
export type { GuardedHuggingFaceOptions, TextGenerationOptions, GuardedInferenceResult, } from './types.js';
//# sourceMappingURL=guarded-inference.d.ts.map
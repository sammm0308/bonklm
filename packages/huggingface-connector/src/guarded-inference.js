"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGuardedInference = createGuardedInference;
const bonklm_1 = require("@blackunicorn/bonklm");
const types_js_1 = require("./types.js");
/**
 * Default logger instance.
 *
 * @internal
 */
const DEFAULT_LOGGER = (0, bonklm_1.createLogger)('console');
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
function createGuardedInference(hfClient, options = {}) {
    const { validators = [], guards = [], logger = DEFAULT_LOGGER, productionMode = process.env.NODE_ENV === 'production', validationTimeout = types_js_1.DEFAULT_VALIDATION_TIMEOUT, maxInputLength = types_js_1.DEFAULT_MAX_INPUT_LENGTH, allowedModels, onInputBlocked, onOutputBlocked, onModelNotAllowed, } = options;
    const engine = new bonklm_1.GuardrailEngine({
        validators,
        guards,
        logger,
    });
    /**
     * Validation timeout wrapper with AbortController.
     *
     * @internal
     */
    const validateWithTimeout = async (content, context) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), validationTimeout);
        try {
            const result = await engine.validate(content, context);
            clearTimeout(timeoutId);
            return result;
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                logger.error('[Guardrails] Validation timeout');
                return (0, bonklm_1.createResult)(false, bonklm_1.Severity.CRITICAL, [
                    {
                        category: 'timeout',
                        description: 'Validation timeout',
                        severity: bonklm_1.Severity.CRITICAL,
                        weight: 30,
                    },
                ]);
            }
            throw error;
        }
    };
    /**
     * Checks if a model is allowed based on allowedModels patterns.
     *
     * @internal
     */
    const isModelAllowed = (model) => {
        if (!allowedModels || allowedModels.length === 0) {
            return true;
        }
        return allowedModels.some((pattern) => {
            // Convert wildcard pattern to regex
            const regexPattern = pattern
                .replace(/\*/g, '.*')
                .replace(/\?/g, '.');
            const regex = new RegExp(`^${regexPattern}$`, 'i');
            return regex.test(model);
        });
    };
    /**
     * Validates model reference.
     *
     * @internal
     */
    const validateModel = (model) => {
        if (!model || typeof model !== 'string') {
            throw new Error('Model must be a non-empty string');
        }
        if (!isModelAllowed(model)) {
            logger.warn('[Guardrails] Model not allowed', { model });
            if (onModelNotAllowed)
                onModelNotAllowed(model);
            throw new Error(productionMode ? 'Model not allowed' : `Model '${model}' is not in the allowed list`);
        }
    };
    /**
     * Validates input text.
     *
     * @internal
     */
    const validateInput = async (inputs) => {
        // Check input length
        if (inputs.length > maxInputLength) {
            logger.warn('[Guardrails] Input too long', {
                length: inputs.length,
                max: maxInputLength,
            });
            throw new Error(productionMode
                ? 'Input too long'
                : `Input exceeds maximum length of ${maxInputLength} characters`);
        }
        // Validate content
        const result = await validateWithTimeout(inputs, 'hf_input');
        if (!result.allowed) {
            logger.warn('[Guardrails] Input blocked', { reason: result.reason });
            if (onInputBlocked)
                onInputBlocked(result);
            throw new Error(productionMode ? 'Input blocked' : `Input blocked: ${result.reason}`);
        }
    };
    /**
     * Validates output text.
     *
     * @internal
     */
    const validateOutput = async (output) => {
        const result = await validateWithTimeout(output, 'hf_output');
        if (!result.allowed) {
            logger.warn('[Guardrails] Output blocked', { reason: result.reason });
            if (onOutputBlocked)
                onOutputBlocked(result);
            return {
                output: '[Content filtered by guardrails]',
                filtered: true,
            };
        }
        return {
            output,
            filtered: false,
        };
    };
    // Return a proxy object that wraps HuggingFace client methods
    return new Proxy(hfClient, {
        get(target, prop) {
            // Intercept textGeneration and similar methods
            if (prop === 'textGeneration' || prop === 'questionAnswer' || prop === 'summarization' || prop === 'translation') {
                return async (options) => {
                    const { model, inputs, parameters, task } = options;
                    // Validate model
                    validateModel(model);
                    // Validate input
                    await validateInput(inputs);
                    // Call the original method with full options
                    const rawResult = await target[prop]({ model, inputs, parameters, task });
                    // Extract output text
                    let outputText;
                    if (typeof rawResult === 'string') {
                        outputText = rawResult;
                    }
                    else if (rawResult?.generated_text) {
                        outputText = rawResult.generated_text;
                    }
                    else if (rawResult?.answer) {
                        outputText = rawResult.answer;
                    }
                    else if (rawResult?.summary_text) {
                        outputText = rawResult.summary_text;
                    }
                    else if (rawResult?.translation_text) {
                        outputText = rawResult.translation_text;
                    }
                    else if (Array.isArray(rawResult) && rawResult[0]?.generated_text) {
                        outputText = rawResult[0].generated_text;
                    }
                    else {
                        outputText = JSON.stringify(rawResult);
                    }
                    // Validate output
                    const validationResult = await validateOutput(outputText);
                    return {
                        ...validationResult,
                        raw: rawResult,
                    };
                };
            }
            // Intercept chatCompletion method
            if (prop === 'chatCompletion') {
                return async (model, messages, options) => {
                    // Validate model
                    validateModel(model);
                    // Extract and validate input from messages
                    const inputText = messages
                        .map((m) => `${m.role}: ${m.content || ''}`)
                        .join('\n');
                    await validateInput(inputText);
                    // Call the original method
                    const rawResult = await target[prop](model, messages, options);
                    // Extract output
                    let outputText;
                    if (rawResult?.choices?.[0]?.message?.content) {
                        outputText = rawResult.choices[0].message.content;
                    }
                    else {
                        outputText = JSON.stringify(rawResult);
                    }
                    // Validate output
                    const validationResult = await validateOutput(outputText);
                    return {
                        ...validationResult,
                        raw: rawResult,
                    };
                };
            }
            // For all other methods, pass through
            const value = target[prop];
            return typeof value === 'function' ? value.bind(target) : value;
        },
    });
}
//# sourceMappingURL=guarded-inference.js.map
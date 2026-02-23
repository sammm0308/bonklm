/**
 * NestJS Guardrails Service
 * =========================
 * Service for validating content using the GuardrailEngine.
 *
 * @package @blackunicorn/bonklm-nestjs
 */
import { GuardrailEngine, GuardrailResult } from '@blackunicorn/bonklm';
import type { GuardrailsModuleOptions } from './types.js';
/**
 * Injectable service for LLM guardrails validation.
 *
 * @example
 * ```typescript
 * @Controller('chat')
 * export class ChatController {
 *   constructor(private readonly guardrails: GuardrailsService) {}
 *
 *   @Post()
 *   async chat(@Body() body: { message: string }) {
 *     const results = await this.guardrails.validateInput(body.message);
 *     if (!this.guardrails.isAllowed(results)) {
 *       throw new BadRequestException('Content blocked');
 *     }
 *     // Process message
 *   }
 * }
 * ```
 */
export declare class GuardrailsService {
    private readonly engine;
    private readonly logger;
    private readonly productionMode;
    private readonly validationTimeout;
    private readonly maxContentLength;
    private readonly bodyExtractor?;
    private readonly responseExtractor?;
    constructor(options?: GuardrailsModuleOptions);
    /**
     * Validate input content.
     *
     * @param content - The content to validate
     * @param context - Optional context (e.g., 'input', 'output')
     * @returns Validation results
     */
    validateInput(content: string, context?: string): Promise<GuardrailResult[]>;
    /**
     * Validate output content.
     *
     * @param content - The content to validate
     * @param context - Optional context
     * @returns Validation results
     */
    validateOutput(content: string, context?: string): Promise<GuardrailResult[]>;
    /**
     * Validate content with timeout enforcement (SEC-008).
     *
     * @param content - The content to validate
     * @param context - Optional context string (DEV-001: Use string context)
     * @returns Validation results
     */
    private validateWithTimeout;
    /**
     * Check if validation results allow the content to proceed.
     *
     * @param results - Validation results to check
     * @returns true if content is allowed, false otherwise
     */
    isAllowed(results: GuardrailResult[]): boolean;
    /**
     * Get the first blocked result from validation results.
     *
     * @param results - Validation results to check
     * @returns The first blocked result, or undefined if none
     */
    getBlockedResult(results: GuardrailResult[]): GuardrailResult | undefined;
    /**
     * Get a user-friendly error message for a blocked result.
     * Respects production mode setting (SEC-007).
     *
     * @param result - The blocked result
     * @returns Error message
     */
    getErrorMessage(result: GuardrailResult): string;
    /**
     * Get the underlying GuardrailEngine instance.
     * Use this for advanced operations.
     *
     * @returns The GuardrailEngine instance
     */
    getEngine(): GuardrailEngine;
    /**
     * Get service configuration.
     *
     * @returns Service configuration
     */
    getConfig(): {
        productionMode: boolean;
        validationTimeout: number;
        maxContentLength: number;
    };
    /**
     * Get the custom body extractor if configured.
     *
     * @returns The custom body extractor or undefined
     */
    getBodyExtractor(): ((request: any) => string) | undefined;
    /**
     * Get the custom response extractor if configured.
     *
     * @returns The custom response extractor or undefined
     */
    getResponseExtractor(): ((response: any) => string) | undefined;
}
//# sourceMappingURL=guardrails.service.d.ts.map
/**
 * NestJS Guardrails Module
 * =========================
 * Dynamic module for configuring LLM guardrails in NestJS applications.
 *
 * @package @blackunicorn/bonklm-nestjs
 */
import { DynamicModule } from '@nestjs/common';
import type { GuardrailsModuleOptions, GuardrailsModuleAsyncOptions } from './types.js';
/**
 * NestJS Module for BonkLM integration.
 *
 * This module provides:
 * - GuardrailsService: Service for validating content
 * - GuardrailsInterceptor: Interceptor for automatic validation
 * - @UseGuardrails() decorator: Marks endpoints for validation
 *
 * @example
 * ```typescript
 * import { Module } from '@nestjs/common';
 * import { GuardrailsModule } from '@blackunicorn/bonklm-nestjs';
 * import { PromptInjectionValidator } from '@blackunicorn/bonklm';
 *
 * @Module({
 *   imports: [
 *     GuardrailsModule.forRoot({
 *       validators: [new PromptInjectionValidator()],
 *       global: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @example
 * ```typescript
 * // Async configuration
 * @Module({
 *   imports: [
 *     GuardrailsModule.forRootAsync({
 *       useFactory: (config: ConfigService) => ({
 *         validators: config.get('validators'),
 *         productionMode: config.get('NODE_ENV') === 'production',
 *       }),
 *       inject: [ConfigService],
 *       global: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
export declare class GuardrailsModule {
    /**
     * Configure the module with static options.
     *
     * @param options - Module configuration options
     * @returns Dynamic module configuration
     */
    static forRoot(options?: GuardrailsModuleOptions): DynamicModule;
    /**
     * Configure the module with async options.
     *
     * @param options - Async module configuration options
     * @returns Dynamic module configuration
     */
    static forRootAsync(options: GuardrailsModuleAsyncOptions): DynamicModule;
    /**
     * Register the module without global interceptor.
     *
     * Use this when you want to manually apply the interceptor to specific
     * controllers using @UseGuards() or @UseInterceptors().
     *
     * @param options - Module configuration options
     * @returns Dynamic module configuration
     */
    static forFeature(options?: GuardrailsModuleOptions): DynamicModule;
    /**
     * Register the module with async options without global interceptor.
     *
     * @param options - Async module configuration options
     * @returns Dynamic module configuration
     */
    static forFeatureAsync(options: GuardrailsModuleAsyncOptions): DynamicModule;
}
/**
 * Re-export types for convenience.
 */
export type { GuardrailsModuleOptions, GuardrailsModuleAsyncOptions, UseGuardrailsDecoratorOptions, GuardrailsRequest, GuardrailsExecutionContext, } from './types.js';
/**
 * Re-export decorator for convenience.
 */
export { UseGuardrails, isUseGuardrailsOptions } from './use-guardrails.decorator.js';
/**
 * Re-export interceptor for manual application.
 */
export { GuardrailsInterceptor } from './guardrails.interceptor.js';
/**
 * Re-export service for direct injection.
 */
export { GuardrailsService } from './guardrails.service.js';
/**
 * Re-export core types from @blackunicorn/bonklm.
 */
export type { Validator, Guard, GuardrailResult, Logger, } from '@blackunicorn/bonklm';
//# sourceMappingURL=guardrails.module.d.ts.map
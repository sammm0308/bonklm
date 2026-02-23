/**
 * NestJS Guardrails Module
 * =========================
 * Dynamic module for configuring LLM guardrails in NestJS applications.
 *
 * @package @blackunicorn/bonklm-nestjs
 */
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { Module, } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { GuardrailsService } from './guardrails.service.js';
import { GuardrailsInterceptor } from './guardrails.interceptor.js';
import { GUARDRAILS_OPTIONS, } from './constants.js';
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
let GuardrailsModule = (() => {
    let _classDecorators = [Module({})];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var GuardrailsModule = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuardrailsModule = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        /**
         * Configure the module with static options.
         *
         * @param options - Module configuration options
         * @returns Dynamic module configuration
         */
        static forRoot(options = {}) {
            const optionsProvider = {
                provide: GUARDRAILS_OPTIONS,
                useValue: options,
            };
            return {
                module: GuardrailsModule,
                providers: [
                    optionsProvider,
                    GuardrailsService,
                    {
                        provide: APP_INTERCEPTOR,
                        useClass: GuardrailsInterceptor,
                    },
                ],
                exports: [GuardrailsService],
                global: options.global ?? false,
            };
        }
        /**
         * Configure the module with async options.
         *
         * @param options - Async module configuration options
         * @returns Dynamic module configuration
         */
        static forRootAsync(options) {
            const optionsProvider = {
                provide: GUARDRAILS_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject || [],
            };
            return {
                module: GuardrailsModule,
                providers: [
                    optionsProvider,
                    GuardrailsService,
                    {
                        provide: APP_INTERCEPTOR,
                        useClass: GuardrailsInterceptor,
                    },
                ],
                exports: [GuardrailsService],
                global: options.global ?? false,
            };
        }
        /**
         * Register the module without global interceptor.
         *
         * Use this when you want to manually apply the interceptor to specific
         * controllers using @UseGuards() or @UseInterceptors().
         *
         * @param options - Module configuration options
         * @returns Dynamic module configuration
         */
        static forFeature(options = {}) {
            const optionsProvider = {
                provide: GUARDRAILS_OPTIONS,
                useValue: options,
            };
            return {
                module: GuardrailsModule,
                providers: [
                    optionsProvider,
                    GuardrailsService,
                    GuardrailsInterceptor,
                ],
                exports: [GuardrailsService, GuardrailsInterceptor],
            };
        }
        /**
         * Register the module with async options without global interceptor.
         *
         * @param options - Async module configuration options
         * @returns Dynamic module configuration
         */
        static forFeatureAsync(options) {
            const optionsProvider = {
                provide: GUARDRAILS_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject || [],
            };
            return {
                module: GuardrailsModule,
                providers: [
                    optionsProvider,
                    GuardrailsService,
                    GuardrailsInterceptor,
                ],
                exports: [GuardrailsService, GuardrailsInterceptor],
            };
        }
    };
    return GuardrailsModule = _classThis;
})();
export { GuardrailsModule };
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
//# sourceMappingURL=guardrails.module.js.map
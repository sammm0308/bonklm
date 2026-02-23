/**
 * NestJS Guardrails Service
 * =========================
 * Service for validating content using the GuardrailEngine.
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
// @ts-ignore - Inject and Optional are used in decorator parameter but TypeScript doesn't recognize it
import { Injectable } from '@nestjs/common';
import { GuardrailEngine, createLogger, LogLevel, Severity, RiskLevel, } from '@blackunicorn/bonklm';
import { DEFAULT_VALIDATION_TIMEOUT, DEFAULT_MAX_CONTENT_LENGTH, } from './constants.js';
/**
 * Default risk score for content size violations.
 */
const DEFAULT_SIZE_RISK_SCORE = 5;
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
let GuardrailsService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var GuardrailsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuardrailsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        engine;
        logger;
        productionMode;
        validationTimeout;
        maxContentLength;
        bodyExtractor;
        responseExtractor;
        constructor(options) {
            const { validators = [], guards = [], logger, productionMode = process.env.NODE_ENV === 'production', validationTimeout = DEFAULT_VALIDATION_TIMEOUT, maxContentLength = DEFAULT_MAX_CONTENT_LENGTH, bodyExtractor, responseExtractor, } = options || {};
            this.productionMode = productionMode;
            this.validationTimeout = validationTimeout;
            this.maxContentLength = maxContentLength;
            this.bodyExtractor = bodyExtractor;
            this.responseExtractor = responseExtractor;
            // DEV-002: Use proper logger
            this.logger = logger ?? createLogger('console', LogLevel.INFO);
            this.engine = new GuardrailEngine({
                validators,
                guards,
                logger: this.logger,
            });
            this.logger.debug('GuardrailsService initialized', {
                validatorCount: validators.length,
                guardCount: guards.length,
                productionMode,
                validationTimeout,
                maxContentLength,
            });
        }
        /**
         * Validate input content.
         *
         * @param content - The content to validate
         * @param context - Optional context (e.g., 'input', 'output')
         * @returns Validation results
         */
        async validateInput(content, context) {
            return this.validateWithTimeout(content, context ?? 'input');
        }
        /**
         * Validate output content.
         *
         * @param content - The content to validate
         * @param context - Optional context
         * @returns Validation results
         */
        async validateOutput(content, context) {
            return this.validateWithTimeout(content, context ?? 'output');
        }
        /**
         * Validate content with timeout enforcement (SEC-008).
         *
         * @param content - The content to validate
         * @param context - Optional context string (DEV-001: Use string context)
         * @returns Validation results
         */
        async validateWithTimeout(content, context) {
            // SEC-010: Check content length before validation
            if (content.length > this.maxContentLength) {
                this.logger.warn('[Guardrails] Content too large', {
                    length: content.length,
                    max: this.maxContentLength,
                });
                return [
                    {
                        allowed: false,
                        blocked: true,
                        severity: Severity.WARNING,
                        risk_level: RiskLevel.LOW,
                        risk_score: DEFAULT_SIZE_RISK_SCORE,
                        reason: 'Content too large',
                        findings: [
                            {
                                category: 'size_limit',
                                severity: Severity.WARNING,
                                description: `Content exceeds maximum size of ${this.maxContentLength} bytes`,
                            },
                        ],
                        timestamp: Date.now(),
                    },
                ];
            }
            // SEC-008: Timeout wrapper using AbortController
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.validationTimeout);
            try {
                // DEV-001: Use correct API signature (string context, not object)
                const result = await this.engine.validate(content, context);
                clearTimeout(timeoutId);
                // Return individual results if available, otherwise wrap the engine result
                return 'results' in result && result.results.length > 0
                    ? result.results
                    : [result];
            }
            catch (error) {
                clearTimeout(timeoutId);
                if (error instanceof Error && error.name === 'AbortError') {
                    this.logger.error('[Guardrails] Validation timeout');
                    return [
                        {
                            allowed: false,
                            blocked: true,
                            severity: Severity.CRITICAL,
                            risk_level: RiskLevel.HIGH,
                            risk_score: 20,
                            reason: 'Validation timeout',
                            findings: [
                                {
                                    category: 'timeout',
                                    severity: Severity.CRITICAL,
                                    description: `Validation exceeded ${this.validationTimeout}ms timeout`,
                                },
                            ],
                            timestamp: Date.now(),
                        },
                    ];
                }
                this.logger.error('[Guardrails] Validation error', { error });
                return [
                    {
                        allowed: false,
                        blocked: true,
                        severity: Severity.CRITICAL,
                        risk_level: RiskLevel.HIGH,
                        risk_score: 25,
                        reason: 'Validation error',
                        findings: [
                            {
                                category: 'validation_error',
                                severity: Severity.CRITICAL,
                                description: `Validation failed: ${String(error)}`,
                            },
                        ],
                        timestamp: Date.now(),
                    },
                ];
            }
        }
        /**
         * Check if validation results allow the content to proceed.
         *
         * @param results - Validation results to check
         * @returns true if content is allowed, false otherwise
         */
        isAllowed(results) {
            return !results.some((r) => !r.allowed);
        }
        /**
         * Get the first blocked result from validation results.
         *
         * @param results - Validation results to check
         * @returns The first blocked result, or undefined if none
         */
        getBlockedResult(results) {
            return results.find((r) => !r.allowed);
        }
        /**
         * Get a user-friendly error message for a blocked result.
         * Respects production mode setting (SEC-007).
         *
         * @param result - The blocked result
         * @returns Error message
         */
        getErrorMessage(result) {
            if (this.productionMode) {
                return 'Content blocked by security policy';
            }
            return result.reason || 'Content blocked by guardrails';
        }
        /**
         * Get the underlying GuardrailEngine instance.
         * Use this for advanced operations.
         *
         * @returns The GuardrailEngine instance
         */
        getEngine() {
            return this.engine;
        }
        /**
         * Get service configuration.
         *
         * @returns Service configuration
         */
        getConfig() {
            return {
                productionMode: this.productionMode,
                validationTimeout: this.validationTimeout,
                maxContentLength: this.maxContentLength,
            };
        }
        /**
         * Get the custom body extractor if configured.
         *
         * @returns The custom body extractor or undefined
         */
        getBodyExtractor() {
            return this.bodyExtractor;
        }
        /**
         * Get the custom response extractor if configured.
         *
         * @returns The custom response extractor or undefined
         */
        getResponseExtractor() {
            return this.responseExtractor;
        }
    };
    return GuardrailsService = _classThis;
})();
export { GuardrailsService };
//# sourceMappingURL=guardrails.service.js.map
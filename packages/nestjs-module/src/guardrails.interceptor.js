/**
 * Guardrails Interceptor
 * ======================
 * NestJS interceptor for automatic request/response validation.
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
import { Injectable, BadRequestException, Logger as NestLogger, } from '@nestjs/common';
import { throwError, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Severity, RiskLevel } from '@blackunicorn/bonklm';
import { USE_GUARDRAILS_KEY } from './constants.js';
import { isUseGuardrailsOptions } from './use-guardrails.decorator.js';
/**
 * Interceptor that validates requests and responses using the GuardrailsService.
 *
 * This interceptor checks for the @UseGuardrails() decorator on handlers
 * and performs validation before the handler executes (input validation)
 * and/or after the handler returns (output validation).
 *
 * @example
 * The interceptor is automatically applied when you use the @UseGuardrails() decorator:
 * ```typescript
 * @Controller('chat')
 * export class ChatController {
 *   @Post()
 *   @UseGuardrails({ validateInput: true, validateOutput: true })
 *   async chat(@Body() body: { message: string }) {
 *     return { response: 'Hello!' };
 *   }
 * }
 * ```
 */
let GuardrailsInterceptor = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var GuardrailsInterceptor = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GuardrailsInterceptor = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        reflector;
        guardrailsService;
        logger = new NestLogger('GuardrailsInterceptor');
        constructor(reflector, guardrailsService) {
            this.reflector = reflector;
            this.guardrailsService = guardrailsService;
            this.logger.debug('GuardrailsInterceptor initialized');
        }
        /**
         * Intercept method called by NestJS for each request.
         *
         * @param context - Execution context containing request/response
         * @param next - CallHandler to proceed to the next interceptor or handler
         * @returns Observable with the response or error
         */
        intercept(context, next) {
            // Get decorator options from handler and class metadata
            const handlerOptions = this.reflector.getAllAndOverride(USE_GUARDRAILS_KEY, [context.getHandler(), context.getClass()]);
            // If no decorator options, skip validation
            if (!handlerOptions && !this.hasDecoratorOnClass(context)) {
                return next.handle();
            }
            const options = handlerOptions || {};
            // Default to validateInput: true if not specified
            const validateInput = options.validateInput !== false;
            const validateOutput = options.validateOutput === true;
            // Extract request content
            const request = this.getRequest(context);
            const content = this.extractContent(request, options.bodyField);
            // Skip if no content to validate
            if (!content || content.length === 0) {
                return next.handle();
            }
            // Input validation
            if (validateInput) {
                // Create an observable for input validation
                return of(null).pipe(switchMap(() => this.validateInput(content, context, options)), switchMap((inputResult) => {
                    if (!inputResult.allowed) {
                        return throwError(() => new BadRequestException({
                            error: this.guardrailsService.getErrorMessage(inputResult),
                            risk_level: inputResult.risk_level,
                        }));
                    }
                    // Store validation results on request
                    request._guardrailsResults = [inputResult];
                    request._guardrailsValidated = true;
                    // Proceed to handler and optionally validate output
                    return this.handleWithOutputValidation(context, next, validateOutput, options);
                }));
            }
            // Skip input validation, only validate output if requested
            return this.handleWithOutputValidation(context, next, validateOutput, options);
        }
        /**
         * Validate input content.
         */
        async validateInput(content, context, options) {
            // Check custom max content length
            if (options.maxContentLength && content.length > options.maxContentLength) {
                this.logger.warn(`Content exceeds custom max length: ${content.length} > ${options.maxContentLength}`);
                return {
                    allowed: false,
                    blocked: true,
                    severity: Severity.WARNING,
                    risk_level: RiskLevel.LOW,
                    risk_score: 5,
                    reason: 'Content too large',
                    findings: [],
                    timestamp: Date.now(),
                };
            }
            const results = await this.guardrailsService.validateInput(content);
            const blocked = this.guardrailsService.getBlockedResult(results);
            if (blocked) {
                this.logger.warn(`Request blocked: ${blocked.reason}`);
                // Call custom error handler if provided and is a function
                if (options.onError && typeof options.onError === 'function') {
                    try {
                        options.onError(blocked, context);
                    }
                    catch (error) {
                        this.logger.error('Error in custom error handler', { error });
                    }
                }
                return blocked;
            }
            return results[0] || {
                allowed: true,
                blocked: false,
                severity: Severity.INFO,
                risk_level: RiskLevel.LOW,
                risk_score: 0,
                findings: [],
                timestamp: Date.now()
            };
        }
        /**
         * Handle output validation if enabled.
         */
        handleWithOutputValidation(context, next, validateOutput, options) {
            if (!validateOutput) {
                return next.handle();
            }
            return next.handle().pipe(switchMap((data) => {
                // Extract response content
                const content = this.extractContentFromResponse(data, options.responseField);
                if (!content || content.length === 0) {
                    return of(data);
                }
                // Validate output asynchronously
                return forkJoin({
                    original: of(data),
                    validation: this.guardrailsService.validateOutput(content),
                }).pipe(map(({ original, validation }) => {
                    const blocked = this.guardrailsService.getBlockedResult(validation);
                    if (blocked) {
                        this.logger.warn(`Response blocked: ${blocked.reason}`);
                        // Call custom error handler if provided and is a function
                        if (options.onError && typeof options.onError === 'function') {
                            try {
                                options.onError(blocked, context);
                            }
                            catch (error) {
                                this.logger.error('Error in custom error handler', { error });
                            }
                        }
                        // Return filtered response
                        return {
                            error: 'Response filtered by guardrails',
                            ...(this.guardrailsService.getConfig().productionMode
                                ? {}
                                : { reason: blocked.reason }),
                        };
                    }
                    return original;
                }));
            }), catchError((error) => {
                this.logger.error('Error in output validation', { error });
                return throwError(() => error);
            }));
        }
        /**
         * Get the request object from the execution context.
         */
        getRequest(context) {
            switch (context.getType()) {
                case 'http':
                    const http = context.switchToHttp();
                    return http.getRequest();
                case 'rpc':
                    // RPC context (e.g., microservices)
                    return context.getArgByIndex(0);
                default:
                    return context.getArgByIndex(0);
            }
        }
        /**
         * Extract content from request body.
         */
        extractContent(request, field) {
            if (!request || !request.body) {
                return '';
            }
            // Use module-level custom extractor if available
            const bodyExtractor = this.guardrailsService.getBodyExtractor();
            if (bodyExtractor) {
                try {
                    const result = bodyExtractor(request);
                    return String(result ?? '');
                }
                catch (error) {
                    this.logger.warn('Custom bodyExtractor failed, using default', { error });
                    // Fall through to default extraction
                }
            }
            if (field) {
                return String(request.body[field] || '');
            }
            // Try common fields
            const commonFields = ['message', 'prompt', 'content', 'text', 'query', 'input'];
            for (const f of commonFields) {
                if (request.body[f]) {
                    return String(request.body[f]);
                }
            }
            // Fallback to stringified body
            try {
                return JSON.stringify(request.body);
            }
            catch {
                return String(request.body);
            }
        }
        /**
         * Extract content from response data.
         */
        extractContentFromResponse(data, field) {
            if (!data) {
                return '';
            }
            // Use module-level custom extractor if available
            const responseExtractor = this.guardrailsService.getResponseExtractor();
            if (responseExtractor) {
                try {
                    const result = responseExtractor(data);
                    return String(result ?? '');
                }
                catch (error) {
                    this.logger.warn('Custom responseExtractor failed, using default', { error });
                    // Fall through to default extraction
                }
            }
            if (field) {
                return String(data[field] || '');
            }
            // Try common response fields
            const commonFields = ['text', 'content', 'message', 'response', 'output', 'result', 'data'];
            for (const f of commonFields) {
                if (data[f] && typeof data[f] === 'string') {
                    return data[f];
                }
            }
            // Fallback to stringified data
            if (typeof data === 'string') {
                return data;
            }
            try {
                return JSON.stringify(data);
            }
            catch {
                return String(data);
            }
        }
        /**
         * Check if the class has the decorator.
         */
        hasDecoratorOnClass(context) {
            const classMetadata = this.reflector.get(USE_GUARDRAILS_KEY, context.getClass());
            return isUseGuardrailsOptions(classMetadata);
        }
    };
    return GuardrailsInterceptor = _classThis;
})();
export { GuardrailsInterceptor };
//# sourceMappingURL=guardrails.interceptor.js.map
/**
 * Guardrails Interceptor
 * ======================
 * NestJS interceptor for automatic request/response validation.
 *
 * @package @blackunicorn/bonklm-nestjs
 */
import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { GuardrailsService } from './guardrails.service.js';
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
export declare class GuardrailsInterceptor implements NestInterceptor {
    private readonly reflector;
    private readonly guardrailsService;
    private readonly logger;
    constructor(reflector: Reflector, guardrailsService: GuardrailsService);
    /**
     * Intercept method called by NestJS for each request.
     *
     * @param context - Execution context containing request/response
     * @param next - CallHandler to proceed to the next interceptor or handler
     * @returns Observable with the response or error
     */
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    /**
     * Validate input content.
     */
    private validateInput;
    /**
     * Handle output validation if enabled.
     */
    private handleWithOutputValidation;
    /**
     * Get the request object from the execution context.
     */
    private getRequest;
    /**
     * Extract content from request body.
     */
    private extractContent;
    /**
     * Extract content from response data.
     */
    private extractContentFromResponse;
    /**
     * Check if the class has the decorator.
     */
    private hasDecoratorOnClass;
}
//# sourceMappingURL=guardrails.interceptor.d.ts.map
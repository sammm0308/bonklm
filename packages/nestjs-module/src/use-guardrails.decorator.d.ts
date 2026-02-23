/**
 * @UseGuardrails() Decorator
 * ==========================
 * Decorator for marking controllers/methods to use guardrails validation.
 *
 * @package @blackunicorn/bonklm-nestjs
 */
import type { UseGuardrailsDecoratorOptions } from './types.js';
/**
 * Decorator to enable guardrails validation on a controller method.
 *
 * When applied, the GuardrailsInterceptor will validate the request
 * before it reaches the handler and optionally validate the response.
 *
 * @example
 * ```typescript
 * @Controller('chat')
 * export class ChatController {
 *   @Post()
 *   @UseGuardrails()
 *   async chat(@Body() body: { message: string }) {
 *     return { response: 'Hello!' };
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With options
 * @Post()
 * @UseGuardrails({
 *   validateInput: true,
 *   validateOutput: true,
 *   bodyField: 'prompt',
 * })
 * async generate(@Body() body: { prompt: string }) {
 *   return { text: 'Generated text' };
 * }
 * ```
 *
 * @param options - Optional configuration for this endpoint
 * @returns Decorator function
 */
export declare const UseGuardrails: (options?: UseGuardrailsDecoratorOptions) => MethodDecorator & ClassDecorator;
/**
 * Type guard to check if a value is a UseGuardrailsDecoratorOptions.
 */
export declare function isUseGuardrailsOptions(value: unknown): value is UseGuardrailsDecoratorOptions;
//# sourceMappingURL=use-guardrails.decorator.d.ts.map
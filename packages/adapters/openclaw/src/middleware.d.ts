/**
 * OpenClaw Adapter - Middleware
 * ===============================
 * Integration layer for using BonkLM with OpenClaw.
 *
 * This middleware provides pre-action hooks for OpenClaw's agent system
 * to validate user input and tool execution against prompt injection,
 * jailbreak, and content security threats.
 */
import type { PromptInjectionConfig, SecretGuardConfig } from '@blackunicorn-llmguardrails/core';
import type { OpenClawMessageContext, OpenClawToolContext, OpenClawGuardrailResult, OpenClawAdapterConfig } from './types.js';
/**
 * OpenClaw Guardrails Middleware
 *
 * Integrates with OpenClaw's hook system to provide security validation
 * for messages and tool executions.
 */
export declare class OpenClawGuardrailsMiddleware {
    private readonly config;
    private readonly logger;
    private readonly promptInjectionValidator;
    private readonly secretGuard;
    constructor(config?: OpenClawAdapterConfig, validators?: {
        promptInjection?: PromptInjectionConfig;
        secret?: SecretGuardConfig;
    });
    /**
     * Validate an OpenClaw message before processing
     */
    validateMessage(context: OpenClawMessageContext): Promise<OpenClawGuardrailResult>;
    /**
     * Validate an OpenClaw tool execution
     */
    validateTool(context: OpenClawToolContext): Promise<OpenClawGuardrailResult>;
    /**
     * Create an OpenClaw pre-action hook function
     * This can be registered with OpenClaw's hook system
     */
    createPreActionHook(): (context: OpenClawMessageContext | OpenClawToolContext) => Promise<{
        allowed: boolean;
        blockedBy?: string;
        reason?: string;
    }>;
    /**
     * Generic validate method that routes to the appropriate validator
     */
    private validate;
    /**
     * Merge multiple validation results
     */
    private mergeResults;
    /**
     * Get the name of the validator that blocked the request
     */
    private getBlockingValidator;
    /**
     * Extract content from tool input
     */
    private extractContentFromToolInput;
}
/**
 * Create a configured middleware instance
 */
export declare function createOpenClawGuardrails(config?: OpenClawAdapterConfig, validators?: {
    promptInjection?: PromptInjectionConfig;
    secret?: SecretGuardConfig;
}): OpenClawGuardrailsMiddleware;
/**
 * Default export for convenience
 */
export default OpenClawGuardrailsMiddleware;
//# sourceMappingURL=middleware.d.ts.map
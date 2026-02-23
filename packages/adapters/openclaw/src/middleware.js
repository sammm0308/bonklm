/**
 * OpenClaw Adapter - Middleware
 * ===============================
 * Integration layer for using BonkLM with OpenClaw.
 *
 * This middleware provides pre-action hooks for OpenClaw's agent system
 * to validate user input and tool execution against prompt injection,
 * jailbreak, and content security threats.
 */
import { PromptInjectionValidator, SecretGuard, createResult, Severity, } from '@blackunicorn-llmguardrails/core';
const DEFAULT_CONFIG = {
    validateMessages: true,
    validateTools: true,
    blockThreshold: 'warning',
    logResults: true,
};
/**
 * Simple logger implementation
 */
class ConsoleLogger {
    info(message, context) {
        console.log(`[INFO] ${message}`, context || '');
    }
    warn(message, context) {
        console.warn(`[WARN] ${message}`, context || '');
    }
    error(message, context) {
        console.error(`[ERROR] ${message}`, context || '');
    }
}
/**
 * OpenClaw Guardrails Middleware
 *
 * Integrates with OpenClaw's hook system to provide security validation
 * for messages and tool executions.
 */
export class OpenClawGuardrailsMiddleware {
    config;
    logger;
    promptInjectionValidator;
    secretGuard;
    constructor(config = {}, validators) {
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
            logger: config.logger ?? new ConsoleLogger(),
        };
        this.logger = this.config.logger;
        this.promptInjectionValidator = new PromptInjectionValidator(validators?.promptInjection);
        this.secretGuard = new SecretGuard(validators?.secret);
    }
    /**
     * Validate an OpenClaw message before processing
     */
    async validateMessage(context) {
        if (!this.config.validateMessages) {
            return {
                ...createResult(true),
                allowed: true,
                originalContent: context.content,
            };
        }
        this.logger.info('Validating OpenClaw message', {
            messageId: context.messageId,
            sessionId: context.sessionId,
            channel: context.channel,
        });
        // Run validators
        const promptInjectionResult = this.promptInjectionValidator.validate(context.content);
        const secretResult = this.secretGuard.validate(context.content);
        // Merge results
        const combined = this.mergeResults([promptInjectionResult, secretResult]);
        const result = {
            ...combined,
            allowed: combined.allowed,
            blockedBy: !combined.allowed ? this.getBlockingValidator([promptInjectionResult, secretResult]) : undefined,
            originalContent: context.content,
        };
        if (this.config.logResults) {
            if (result.allowed) {
                this.logger.info('Message validation passed', {
                    messageId: context.messageId,
                    findings_count: result.findings.length,
                });
            }
            else {
                this.logger.warn('Message validation blocked', {
                    messageId: context.messageId,
                    blocked_by: result.blockedBy,
                    severity: result.severity,
                    findings_count: result.findings.length,
                });
            }
        }
        return result;
    }
    /**
     * Validate an OpenClaw tool execution
     */
    async validateTool(context) {
        if (!this.config.validateTools) {
            return {
                ...createResult(true),
                allowed: true,
            };
        }
        this.logger.info('Validating OpenClaw tool execution', {
            toolName: context.toolName,
            sessionId: context.sessionId,
        });
        // Get content from tool input
        const content = this.extractContentFromToolInput(context.toolInput);
        if (!content) {
            return {
                ...createResult(true),
                allowed: true,
            };
        }
        // Run validators
        const promptInjectionResult = this.promptInjectionValidator.validate(content);
        const secretResult = this.secretGuard.validate(content);
        // Merge results
        const combined = this.mergeResults([promptInjectionResult, secretResult]);
        const result = {
            ...combined,
            allowed: combined.allowed,
            blockedBy: !combined.allowed ? this.getBlockingValidator([promptInjectionResult, secretResult]) : undefined,
        };
        if (this.config.logResults) {
            if (result.allowed) {
                this.logger.info('Tool validation passed', {
                    toolName: context.toolName,
                    findings_count: result.findings.length,
                });
            }
            else {
                this.logger.warn('Tool validation blocked', {
                    toolName: context.toolName,
                    blocked_by: result.blockedBy,
                    severity: result.severity,
                });
            }
        }
        return result;
    }
    /**
     * Create an OpenClaw pre-action hook function
     * This can be registered with OpenClaw's hook system
     */
    createPreActionHook() {
        return async (context) => {
            const result = await this.validate('messageId' in context ? context : context);
            return {
                allowed: result.allowed,
                blockedBy: result.blockedBy,
                reason: result.findings[0]?.description,
            };
        };
    }
    async validate(context) {
        if ('content' in context) {
            return this.validateMessage(context);
        }
        else {
            return this.validateTool(context);
        }
    }
    /**
     * Merge multiple validation results
     */
    mergeResults(results) {
        const allFindings = results.flatMap((r) => r.findings);
        results.reduce((sum, r) => sum + r.risk_score, 0);
        const anyBlocked = results.some((r) => r.blocked);
        const severityOrder = {
            [Severity.INFO]: 0,
            [Severity.WARNING]: 1,
            [Severity.BLOCKED]: 2,
            [Severity.CRITICAL]: 3,
        };
        const maxSeverity = results.reduce((max, r) => {
            return severityOrder[r.severity] > severityOrder[max] ? r.severity : max;
        }, Severity.INFO);
        return createResult(!anyBlocked, maxSeverity, allFindings);
    }
    /**
     * Get the name of the validator that blocked the request
     */
    getBlockingValidator(results) {
        for (const result of results) {
            if (result.blocked) {
                return 'validator';
            }
        }
        return 'unknown';
    }
    /**
     * Extract content from tool input
     */
    extractContentFromToolInput(toolInput) {
        const fields = ['content', 'prompt', 'text', 'query', 'message', 'input'];
        for (const field of fields) {
            const value = toolInput[field];
            if (typeof value === 'string') {
                return value;
            }
        }
        return JSON.stringify(toolInput);
    }
}
/**
 * Create a configured middleware instance
 */
export function createOpenClawGuardrails(config, validators) {
    return new OpenClawGuardrailsMiddleware(config, validators);
}
/**
 * Default export for convenience
 */
export default OpenClawGuardrailsMiddleware;
//# sourceMappingURL=middleware.js.map
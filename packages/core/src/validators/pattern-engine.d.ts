/**
 * BonkLM - Pattern Engine
 * =================================
 * Centralized pattern detection for prompt injection and jailbreak detection.
 *
 * S016-001: LRU cache for regex compilation to prevent DoS via repeated pattern compilation.
 */
import { Severity } from '../base/GuardrailResult.js';
/**
 * LRU Cache for compiled regex patterns.
 * S016-001: Prevents DoS attacks through repeated regex compilation.
 */
export declare class RegexCache {
    private cache;
    private readonly maxSize;
    private hits;
    private misses;
    constructor(maxSize?: number);
    /**
     * Get or compile a regex pattern.
     */
    get(pattern: string, flags?: string): RegExp;
    /**
     * Get cache statistics.
     */
    getStats(): {
        hits: number;
        misses: number;
        size: number;
        hitRate: number;
    };
    /**
     * Clear the cache.
     */
    clear(): void;
    /**
     * Get current cache size.
     */
    size(): number;
}
/**
 * Get or create the global regex cache.
 */
export declare function getRegexCache(maxSize?: number): RegexCache;
/**
 * Set the global regex cache (useful for testing).
 */
export declare function setRegexCache(cache: RegexCache): void;
/**
 * Reset the global regex cache.
 */
export declare function resetRegexCache(): void;
/**
 * Pattern finding result.
 */
export interface PatternFinding {
    category: string;
    pattern_name: string;
    severity: Severity;
    match?: string;
    description: string;
    line_number?: number;
}
/**
 * Pattern definition structure.
 */
export interface PatternDefinition {
    name: string;
    pattern: RegExp;
    severity: Severity;
    description: string;
}
/**
 * Category A: System Override Patterns
 * Attempts to override system instructions or behavior.
 */
export declare const SYSTEM_OVERRIDE_PATTERNS: PatternDefinition[];
/**
 * Category B: Role Hijacking Patterns
 * Attempts to inject fake conversation roles.
 */
export declare const ROLE_HIJACKING_PATTERNS: PatternDefinition[];
/**
 * Category C: Instruction Injection Patterns
 * Direct attempts to inject new instructions.
 */
export declare const INSTRUCTION_INJECTION_PATTERNS: PatternDefinition[];
/**
 * Category D: Encoded Payload Patterns
 * Attempts to hide malicious content via encoding.
 */
export declare const ENCODED_PAYLOAD_PATTERNS: PatternDefinition[];
/**
 * Category E: Context Manipulation Patterns
 * Attempts to manipulate conversation context.
 */
export declare const CONTEXT_MANIPULATION_PATTERNS: PatternDefinition[];
/**
 * Critical patterns used for decoded content scanning.
 */
export declare const CRITICAL_PATTERNS: PatternDefinition[];
/**
 * All pattern categories with their category names.
 */
export declare const ALL_PATTERN_CATEGORIES: readonly [{
    readonly patterns: PatternDefinition[];
    readonly category: "system_override";
}, {
    readonly patterns: PatternDefinition[];
    readonly category: "role_hijacking";
}, {
    readonly patterns: PatternDefinition[];
    readonly category: "instruction_injection";
}, {
    readonly patterns: PatternDefinition[];
    readonly category: "encoded_payload";
}, {
    readonly patterns: PatternDefinition[];
    readonly category: "context_manipulation";
}];
/**
 * Get line number for a match position.
 */
export declare function getLineNumber(text: string, position: number): number;
/**
 * Run pattern detection on content.
 */
export declare function detectPatterns(content: string): PatternFinding[];
//# sourceMappingURL=pattern-engine.d.ts.map
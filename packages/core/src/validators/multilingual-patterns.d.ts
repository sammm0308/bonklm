/**
 * BonkLM - Multilingual Injection Patterns
 * ================================================
 * Injection patterns in 10 languages: Spanish, French, German, Portuguese,
 * Italian, Chinese Simplified, Japanese, Korean, Russian, Arabic.
 *
 * Categories per language: SYSTEM_OVERRIDE, CONSTRAINT_REMOVAL, MODE_SWITCHING, ROLE_HIJACKING
 * Plus romanized transliterations for CJK/Cyrillic.
 */
import { type Severity } from '../base/GuardrailResult.js';
import { type ValidatorConfig } from '../base/ValidatorConfig.js';
export interface MultilingualFinding {
    category: string;
    pattern_name: string;
    severity: Severity;
    language: string;
    match: string;
    description: string;
}
export interface MultilingualDetectorConfig extends ValidatorConfig {
    /**
     * Specific languages to detect (empty = all)
     */
    languages?: string[];
    /**
     * Include romanized transliterations
     */
    includeRomanized?: boolean;
}
/**
 * Detect multilingual injection patterns.
 *
 * @param content - Text content to scan
 * @param languages - Optional language filter (empty = all)
 * @param includeRomanized - Include romanized transliterations
 * @returns Array of multilingual injection findings
 */
export declare function detectMultilingualInjection(content: string, languages?: string[], includeRomanized?: boolean): MultilingualFinding[];
export declare class MultilingualDetector {
    private readonly config;
    constructor(config?: MultilingualDetectorConfig);
    /**
     * Validate content for multilingual injection patterns.
     */
    validate(content: string): import('../base/GuardrailResult.js').GuardrailResult;
    /**
     * Get the count of languages covered.
     */
    getLanguageCount(): number;
    /**
     * Get pattern count per language.
     */
    getPatternCountByLanguage(): Record<string, number>;
    /**
     * Get supported languages.
     */
    getSupportedLanguages(): string[];
}
/**
 * Quick multilingual injection detection.
 * @param content - Content to check
 * @returns Detection result
 */
export declare function detectMultilingual(content: string): import('../base/GuardrailResult.js').GuardrailResult;
//# sourceMappingURL=multilingual-patterns.d.ts.map
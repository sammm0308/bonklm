/**
 * BonkLM - Shared Text Normalizer
 * ==========================================
 * Single source of truth for text normalization and unicode detection.
 */
import { Severity } from '../base/GuardrailResult.js';
/**
 * Zero-width and invisible characters to strip.
 * Includes direction control characters to prevent bypass attacks.
 */
export declare const ZERO_WIDTH_CHARS: string[];
/**
 * Combining character ranges to strip.
 */
export declare const COMBINING_MARK_PATTERN: RegExp;
/**
 * Confusable character mapping (lookalikes to ASCII).
 */
export declare const CONFUSABLE_MAP: Record<string, string>;
/**
 * Additional whitespace and formatting characters to normalize.
 * These exotic whitespace types can be used to evade pattern matching.
 */
export declare const EVASION_WHITESPACE_CHARS: Array<{
    char: string;
    name: string;
    codePoint: number;
}>;
/**
 * Braille Pattern Blank range (U+2800-U+28FF).
 * These invisible Braille characters can be used to hide content.
 */
export declare const BRAILLE_PATTERN: RegExp;
/**
 * Mongolian Free Variation Selectors (U+180B-U+180D).
 */
export declare const MONGOLIAN_FVS_PATTERN: RegExp;
/**
 * Detect unusual whitespace characters for obfuscation flagging.
 * Returns count of unusual whitespace chars found.
 */
export declare function detectUnusualWhitespace(text: string): {
    count: number;
    types: string[];
};
/**
 * Normalize text by applying NFKC, stripping hidden chars, and mapping confusables.
 */
export declare function normalizeText(text: string): string;
/**
 * Suspicious unicode ranges.
 * Expanded to include additional direction control characters.
 */
export declare const SUSPICIOUS_UNICODE_RANGES: Array<[number, number, string]>;
/**
 * Unicode manipulation finding.
 */
export interface UnicodeFinding {
    category: string;
    count: number;
    severity: Severity;
    description: string;
    chars: string[];
}
/**
 * Detect hidden or suspicious unicode characters.
 */
export declare function detectHiddenUnicode(text: string): UnicodeFinding[];
//# sourceMappingURL=text-normalizer.d.ts.map
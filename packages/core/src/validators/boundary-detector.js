/**
 * BonkLM - Prompt Boundary Detector
 * ==========================================
 * Detects techniques that attempt to terminate system prompt sections
 * and inject attacker content at system level.
 *
 * Categories:
 * - Closing system tags: </system>, </s>, [/INST], [END SYSTEM]
 * - Control tokens: <|endoftext|>, </s>, <|im_start|>, <<SYS>>
 * - System prompt close markers: ---END SYSTEM PROMPT---, ===SYSTEM END===
 * - Meta-instruction boundaries: BEGIN USER CONTENT, END SYSTEM CONTENT
 */
import { createResult, Severity as Sev } from '../base/GuardrailResult.js';
import { mergeConfig } from '../base/ValidatorConfig.js';
/**
 * Closing system tag patterns.
 */
const CLOSING_SYSTEM_TAG_PATTERNS = [
    {
        name: 'closing_system_xml',
        pattern: /<\/\s*(?:system|instructions|context|prompt)\s*>/i,
        severity: Sev.CRITICAL,
        description: 'XML closing system/instructions tag',
    },
    {
        name: 'closing_inst_tag',
        pattern: /\[\/?INST\]/i,
        severity: Sev.CRITICAL,
        description: 'Instruction delimiter tag [/INST] or [INST]',
    },
    {
        name: 'end_system_marker',
        pattern: /\[(?:END|STOP)\s+(?:SYSTEM|INSTRUCTIONS|CONTEXT)\]/i,
        severity: Sev.CRITICAL,
        description: 'Bracketed end-of-system marker',
    },
    {
        name: 'closing_s_tag',
        pattern: /<\/s>/,
        severity: Sev.CRITICAL,
        description: 'Sentence boundary tag </s> (model-specific)',
    },
];
/**
 * Control token injection patterns.
 */
const CONTROL_TOKEN_PATTERNS = [
    {
        name: 'openai_control_token',
        pattern: /<\|(?:endoftext|im_start|im_end|system|user|assistant|pad)\|>/i,
        severity: Sev.CRITICAL,
        description: 'OpenAI-style control token injection',
    },
    {
        name: 'llama_sys_tag',
        pattern: /<<\/?SYS>>/,
        severity: Sev.CRITICAL,
        description: 'LLaMA system tag <<SYS>> or <</SYS>>',
    },
    {
        name: 'special_token_s',
        pattern: /<s>/,
        severity: Sev.WARNING,
        description: 'Special token <s> (sentence start)',
    },
];
/**
 * System prompt close patterns (informal markers).
 */
const SYSTEM_PROMPT_CLOSE_PATTERNS = [
    {
        name: 'dashed_end_marker',
        pattern: /---\s*(?:END|STOP)\s+(?:SYSTEM|OF)\s+(?:PROMPT|INSTRUCTIONS|SYSTEM)\s*---/i,
        severity: Sev.WARNING,
        description: 'Dashed end-of-system-prompt marker',
    },
    {
        name: 'equals_end_marker',
        pattern: /===\s*(?:SYSTEM|INSTRUCTIONS?)\s+(?:END|COMPLETE|DONE)\s*===/i,
        severity: Sev.WARNING,
        description: 'Equals-delimited system end marker',
    },
    {
        name: 'asterisk_end_marker',
        pattern: /\*\*\*\s*(?:END|STOP)\s+(?:OF\s+)?(?:INSTRUCTIONS|SYSTEM)\s*\*\*\*/i,
        severity: Sev.WARNING,
        description: 'Asterisk-delimited instruction end marker',
    },
    {
        name: 'braced_end_marker',
        pattern: /\{(?:end_of_system_prompt|end_system|system_end|stop_instructions)\}/i,
        severity: Sev.WARNING,
        description: 'Brace-delimited system end marker',
    },
];
/**
 * Meta-instruction boundary patterns.
 */
const META_INSTRUCTION_PATTERNS = [
    {
        name: 'begin_user_content',
        pattern: /(?:BEGIN|START)\s+(?:USER|HUMAN)\s+(?:CONTENT|INPUT|MESSAGE)/i,
        severity: Sev.WARNING,
        description: 'Meta-instruction: begin user content marker',
    },
    {
        name: 'end_system_content',
        pattern: /(?:END|STOP)\s+(?:SYSTEM|AI|ASSISTANT)\s+(?:CONTENT|MESSAGE|INSTRUCTIONS)/i,
        severity: Sev.WARNING,
        description: 'Meta-instruction: end system content marker',
    },
    {
        name: 'below_is_user',
        pattern: /(?:BELOW|FOLLOWING)\s+(?:IS|ARE)\s+(?:THE\s+)?(?:USER|HUMAN)\s+(?:INPUT|CONTENT|MESSAGE)/i,
        severity: Sev.WARNING,
        description: 'Meta-instruction: directional user content marker',
    },
    {
        name: 'above_was_system',
        pattern: /(?:ABOVE|PRECEDING)\s+(?:WAS|IS)\s+(?:THE\s+)?(?:SYSTEM|AI)\s+(?:PROMPT|MESSAGE|INSTRUCTIONS)/i,
        severity: Sev.WARNING,
        description: 'Meta-instruction: directional system reference marker',
    },
];
/**
 * All boundary pattern categories combined.
 */
const ALL_BOUNDARY_CATEGORIES = [
    { patterns: CLOSING_SYSTEM_TAG_PATTERNS, category: 'closing_system_tag' },
    { patterns: CONTROL_TOKEN_PATTERNS, category: 'control_token' },
    { patterns: SYSTEM_PROMPT_CLOSE_PATTERNS, category: 'system_prompt_close' },
    { patterns: META_INSTRUCTION_PATTERNS, category: 'meta_instruction_boundary' },
];
// =============================================================================
// DETECTION FUNCTION
// =============================================================================
/**
 * Detect prompt boundary manipulation attempts.
 * Runs on both raw content (pre-normalization) and normalized content
 * to catch confusable character variants.
 *
 * @param rawContent - Original content before normalization
 * @param normalizedContent - Content after normalizeText() processing (optional)
 * @returns Array of boundary manipulation findings
 */
export function detectBoundaryManipulation(rawContent, normalizedContent) {
    if (!rawContent || rawContent.trim().length === 0) {
        return [];
    }
    const findings = [];
    const seenPatterns = new Set();
    // Scan raw content first (catches exact tokens)
    for (const { patterns, category } of ALL_BOUNDARY_CATEGORIES) {
        for (const patternDef of patterns) {
            const match = rawContent.match(patternDef.pattern);
            if (match) {
                seenPatterns.add(patternDef.name);
                findings.push({
                    category: `boundary_${category}`,
                    pattern_name: patternDef.name,
                    severity: patternDef.severity,
                    match: match[0].slice(0, 100),
                    description: patternDef.description,
                });
            }
        }
    }
    // Also scan normalized content if different (catches confusable variants)
    if (normalizedContent && normalizedContent !== rawContent) {
        for (const { patterns, category } of ALL_BOUNDARY_CATEGORIES) {
            for (const patternDef of patterns) {
                if (seenPatterns.has(patternDef.name))
                    continue; // Already found in raw
                const match = normalizedContent.match(patternDef.pattern);
                if (match) {
                    findings.push({
                        category: `boundary_${category}`,
                        pattern_name: `confusable_${patternDef.name}`,
                        severity: patternDef.severity,
                        match: match[0].slice(0, 100),
                        description: `Confusable variant: ${patternDef.description}`,
                    });
                }
            }
        }
    }
    return findings;
}
// =============================================================================
// VALIDATOR CLASS
// =============================================================================
export class BoundaryDetector {
    config;
    constructor(config) {
        this.config = mergeConfig({
            ...config,
            detectConfusableVariants: config?.detectConfusableVariants ?? true,
        });
    }
    /**
     * Validate content for boundary manipulation attempts.
     */
    validate(content, normalizedContent) {
        if (!content || content.trim().length === 0) {
            return createResult(true, Sev.INFO, []);
        }
        const findings = detectBoundaryManipulation(content, normalizedContent);
        if (findings.length === 0) {
            return createResult(true, Sev.INFO, []);
        }
        // Convert findings to Finding format
        const convertedFindings = findings.map((f) => ({
            category: f.category,
            pattern_name: f.pattern_name,
            severity: f.severity,
            match: f.match,
            description: f.description,
            weight: f.severity === Sev.CRITICAL ? 20 : f.severity === Sev.WARNING ? 10 : 5,
        }));
        // Determine if we should block based on findings
        const hasCritical = findings.some((f) => f.severity === Sev.CRITICAL);
        const hasWarning = findings.some((f) => f.severity === Sev.WARNING);
        const shouldBlock = this.config.action === 'block' &&
            (hasCritical || (hasWarning && this.config.sensitivity === 'strict'));
        return createResult(!shouldBlock, hasCritical ? Sev.CRITICAL : Sev.WARNING, convertedFindings);
    }
    /**
     * Get the detector's configuration.
     */
    getConfig() {
        return { ...this.config };
    }
}
// =============================================================================
// CONVENIENCE FUNCTION
// =============================================================================
/**
 * Quick boundary manipulation detection.
 * @param content - Content to check
 * @param normalizedContent - Optional normalized content for confusable detection
 * @returns Detection result
 */
export function detectBoundary(content, normalizedContent) {
    const detector = new BoundaryDetector();
    return detector.validate(content, normalizedContent);
}
//# sourceMappingURL=boundary-detector.js.map
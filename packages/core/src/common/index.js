/**
 * BonkLM - Common Utilities
 * ===================================
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
/**
 * Calculate Shannon entropy of a string.
 * Higher entropy indicates more randomness (likely a real secret).
 */
export function calculateEntropy(s) {
    if (!s.length)
        return 0;
    const freq = new Map();
    for (const char of s) {
        freq.set(char, (freq.get(char) || 0) + 1);
    }
    let entropy = 0;
    for (const count of freq.values()) {
        const p = count / s.length;
        entropy -= p * Math.log2(p);
    }
    return entropy;
}
/**
 * Check if a value has high entropy (likely a real secret).
 */
export function isHighEntropy(value, threshold = 3.5) {
    const cleanValue = value.replace(/^(sk[-_]|ghp_|gho_|xox[baprs][-_]|AKIA|AIza)/i, '');
    return calculateEntropy(cleanValue) >= threshold;
}
/**
 * Check if content around a match indicates it's an example/placeholder.
 */
export function isExampleContent(content, line) {
    const EXAMPLE_INDICATORS = [
        /\bexample\b/i,
        /\bplaceholder\b/i,
        /your[_-]?api[_-]?key/i,
        /your[_-]?secret/i,
        /replace[_-]?with/i,
        /xxx+/i,
        /\bdummy\b/i,
        /\bfake\b/i,
        /test[_-]?key/i,
        /\bsample\b/i,
        /todo:?\s*replace/i,
        /insert[_-]?your/i,
        /<your[_-]/i,
        /\[your[_-]/i,
    ];
    for (const indicator of EXAMPLE_INDICATORS) {
        if (indicator.test(line)) {
            return true;
        }
    }
    const lines = content.split('\n');
    const lineIndex = lines.findIndex((l) => l.includes(line.trim()));
    if (lineIndex !== -1) {
        const start = Math.max(0, lineIndex - 5);
        const end = Math.min(lines.length, lineIndex + 6);
        const context = lines.slice(start, end).join('\n');
        for (const indicator of EXAMPLE_INDICATORS) {
            if (indicator.test(context)) {
                return true;
            }
        }
    }
    return false;
}
/**
 * Read file content helper
 */
export function readFileContent(filePath) {
    try {
        return readFileSync(resolve(filePath), 'utf-8');
    }
    catch {
        return '';
    }
}
/**
 * Check if file path is an expected example file
 */
export function isExpectedSecretFile(filePath) {
    const EXPECTED_SECRET_FILES = [
        '.env.example',
        '.env.template',
        '.env.sample',
        'example.env',
        'template.env',
        '.env.development.example',
        '.env.production.example',
    ];
    const basename = filePath.split('/').pop()?.toLowerCase() || '';
    return EXPECTED_SECRET_FILES.some((expected) => basename === expected.toLowerCase());
}
//# sourceMappingURL=index.js.map
/**
 * BonkLM - Common Utilities
 * ===================================
 */
/**
 * Calculate Shannon entropy of a string.
 * Higher entropy indicates more randomness (likely a real secret).
 */
export declare function calculateEntropy(s: string): number;
/**
 * Check if a value has high entropy (likely a real secret).
 */
export declare function isHighEntropy(value: string, threshold?: number): boolean;
/**
 * Check if content around a match indicates it's an example/placeholder.
 */
export declare function isExampleContent(content: string, line: string): boolean;
/**
 * Read file content helper
 */
export declare function readFileContent(filePath: string): string;
/**
 * Check if file path is an expected example file
 */
export declare function isExpectedSecretFile(filePath: string): boolean;
//# sourceMappingURL=index.d.ts.map
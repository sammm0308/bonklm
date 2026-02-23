/**
 * Guardrail Result Types
 * ======================
 * Unified result types across all validators and guards.
 */
export declare enum Severity {
    INFO = "info",
    WARNING = "warning",
    BLOCKED = "blocked",
    CRITICAL = "critical"
}
export declare enum RiskLevel {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}
export interface Finding {
    category: string;
    pattern_name?: string;
    severity: Severity;
    weight?: number;
    match?: string;
    description: string;
    line_number?: number;
    confidence?: 'critical' | 'high' | 'medium' | 'low';
}
export interface GuardrailResult {
    allowed: boolean;
    blocked: boolean;
    reason?: string;
    severity: Severity;
    risk_level: RiskLevel;
    risk_score: number;
    findings: Finding[];
    timestamp: number;
}
export interface ValidationResult extends GuardrailResult {
    validator_name: string;
}
export declare function createResult(allowed: boolean, severity?: Severity, findings?: Finding[]): GuardrailResult;
export declare function mergeResults(...results: GuardrailResult[]): GuardrailResult;
//# sourceMappingURL=GuardrailResult.d.ts.map
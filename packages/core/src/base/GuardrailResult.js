/**
 * Guardrail Result Types
 * ======================
 * Unified result types across all validators and guards.
 */
export var Severity;
(function (Severity) {
    Severity["INFO"] = "info";
    Severity["WARNING"] = "warning";
    Severity["BLOCKED"] = "blocked";
    Severity["CRITICAL"] = "critical";
})(Severity || (Severity = {}));
export var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "LOW";
    RiskLevel["MEDIUM"] = "MEDIUM";
    RiskLevel["HIGH"] = "HIGH";
})(RiskLevel || (RiskLevel = {}));
export function createResult(allowed, severity = Severity.INFO, findings = []) {
    const riskScore = findings.reduce((sum, f) => sum + (f.weight ?? 1), 0);
    let riskLevel = RiskLevel.LOW;
    if (riskScore >= 25) {
        riskLevel = RiskLevel.HIGH;
    }
    else if (riskScore >= 10) {
        riskLevel = RiskLevel.MEDIUM;
    }
    return {
        allowed,
        blocked: !allowed,
        reason: findings.length > 0 ? findings[0].description : undefined,
        severity,
        risk_level: riskLevel,
        risk_score: riskScore,
        findings,
        timestamp: Date.now(),
    };
}
export function mergeResults(...results) {
    const allFindings = results.flatMap((r) => r.findings);
    const totalRiskScore = results.reduce((sum, r) => sum + r.risk_score, 0);
    const anyBlocked = results.some((r) => r.blocked);
    const maxSeverity = results.reduce((max, r) => {
        const severityOrder = {
            [Severity.INFO]: 0,
            [Severity.WARNING]: 1,
            [Severity.BLOCKED]: 2,
            [Severity.CRITICAL]: 3,
        };
        return severityOrder[r.severity] > severityOrder[max] ? r.severity : max;
    }, Severity.INFO);
    let riskLevel = RiskLevel.LOW;
    if (totalRiskScore >= 25) {
        riskLevel = RiskLevel.HIGH;
    }
    else if (totalRiskScore >= 10) {
        riskLevel = RiskLevel.MEDIUM;
    }
    return {
        allowed: !anyBlocked,
        blocked: anyBlocked,
        reason: anyBlocked ? results.find((r) => r.blocked)?.reason : undefined,
        severity: maxSeverity,
        risk_level: riskLevel,
        risk_score: totalRiskScore,
        findings: allFindings,
        timestamp: Date.now(),
    };
}
//# sourceMappingURL=GuardrailResult.js.map
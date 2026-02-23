/**
 * Guardrail Result Types
 * ======================
 * Unified result types across all validators and guards.
 */

export enum Severity {
  INFO = 'info',
  WARNING = 'warning',
  BLOCKED = 'blocked',
  CRITICAL = 'critical',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
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

export function createResult(
  allowed: boolean,
  severity: Severity = Severity.INFO,
  findings: Finding[] = []
): GuardrailResult {
  const riskScore = findings.reduce((sum, f) => sum + (f.weight ?? 1), 0);
  let riskLevel: RiskLevel = RiskLevel.LOW;
  if (riskScore >= 25) {
    riskLevel = RiskLevel.HIGH;
  } else if (riskScore >= 10) {
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

export function mergeResults(...results: GuardrailResult[]): GuardrailResult {
  const allFindings = results.flatMap((r) => r.findings);
  const totalRiskScore = results.reduce((sum, r) => sum + r.risk_score, 0);
  const anyBlocked = results.some((r) => r.blocked);
  const maxSeverity = results.reduce((max, r) => {
    const severityOrder: Record<Severity, number> = {
      [Severity.INFO]: 0,
      [Severity.WARNING]: 1,
      [Severity.BLOCKED]: 2,
      [Severity.CRITICAL]: 3,
    };
    return severityOrder[r.severity] > severityOrder[max] ? r.severity : max;
  }, Severity.INFO);

  let riskLevel: RiskLevel = RiskLevel.LOW;
  if (totalRiskScore >= 25) {
    riskLevel = RiskLevel.HIGH;
  } else if (totalRiskScore >= 10) {
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

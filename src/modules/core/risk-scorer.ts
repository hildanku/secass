import { RiskLevel } from '@/lib/constants'
import type { ScanFinding } from '@/types/scanner'

export class RiskScorer {
    private readonly MAX_SCORE = 100
    private readonly HIGH_RISK_THRESHOLD = 60
    private readonly MEDIUM_RISK_THRESHOLD = 75

    calculateScore(findings: ScanFinding[]): {
        score: number
        riskLevel: RiskLevel
    } {
        let score = this.MAX_SCORE

        // Deduct points based on findings
        for (const finding of findings) {
            score -= finding.scoreImpact
        }

        // Ensure score doesn't go below 0
        score = Math.max(0, score)

        // Determine risk level
        const riskLevel = this.determineRiskLevel(score)

        return { score, riskLevel }
    }

    private determineRiskLevel(score: number): RiskLevel {
        if (score >= this.MEDIUM_RISK_THRESHOLD) {
            return RiskLevel.LOW
        } else if (score >= this.HIGH_RISK_THRESHOLD) {
            return RiskLevel.MEDIUM
        } else {
            return RiskLevel.HIGH
        }
    }
}

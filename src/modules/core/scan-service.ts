import type { ScanResult, ScanFinding } from '@/types/scanner'
import { RiskScorer } from '@/modules/core/risk-scorer'
import { scanModules } from '@/modules/scanner/lib'

export class ScanService {
    private readonly riskScorer: RiskScorer
    private readonly MAX_REQUESTS_PER_SCAN = 20

    constructor() {
        this.riskScorer = new RiskScorer()
    }

    async scan(url: string): Promise<ScanResult> {
        const startTime = Date.now()
        const allFindings: ScanFinding[] = []
        let requestCount = 0

        // Execute all scanner modules
        for (const module of scanModules) {
            if (requestCount >= this.MAX_REQUESTS_PER_SCAN) {
                console.warn(`Request limit reached (${this.MAX_REQUESTS_PER_SCAN}). Skipping remaining modules.`)
                break
            }

            try {
                console.log(`Running module: ${module.name}`)
                const findings = await module.run(url)
                allFindings.push(...findings)
                requestCount += this.estimateRequestCount(module.name)
            } catch (error) {
                console.error(`Module ${module.name} failed:`, error)
                // Continue with other modules even if one fails
            }
        }

        // Calculate risk score
        const { score, riskLevel } = this.riskScorer.calculateScore(allFindings)

        // Calculate summary
        const totalChecks = this.calculateTotalChecks()
        const failedChecks = allFindings.length
        const passedChecks = totalChecks - failedChecks

        const result: ScanResult = {
            url,
            timestamp: new Date().toISOString(),
            score,
            riskLevel,
            findings: allFindings,
            summary: {
                totalChecks,
                passedChecks,
                failedChecks,
            },
        }

        const duration = Date.now() - startTime
        console.log(`Scan completed in ${duration}ms`)

        return result
    }

    private estimateRequestCount(moduleName: string): number {
        // Estimate how many requests each module makes
        switch (moduleName) {
            case 'Rate Limiting':
                return 10
            case 'Security Headers':
            case 'CORS Configuration':
            case 'SSL/TLS Configuration':
                return 1
            default:
                return 1
        }
    }

    private calculateTotalChecks(): number {
        // Calculate total possible checks across all modules
        return 15 // Approximate total checks
    }
}

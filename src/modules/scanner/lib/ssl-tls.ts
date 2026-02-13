import type { ScanFinding } from '@/types/scanner'
import type { ScanModule } from '@/modules/scanner/types'
import { Severity } from '@/lib/constants'

export class SslTlsModule implements ScanModule {
    name = 'SSL/TLS Configuration'
    description = 'Checks SSL/TLS configuration and certificate'

    async run(target: string): Promise<ScanFinding[]> {
        const findings: ScanFinding[] = []

        try {
            const url = new URL(target)

            // Check if HTTPS is used
            if (url.protocol !== 'https:') {
                findings.push({
                    module: this.name,
                    title: 'Non-HTTPS Connection',
                    description: 'The website is not using HTTPS.',
                    severity: Severity.CRITICAL,
                    recommendation: 'Implement HTTPS with a valid SSL/TLS certificate. Use Let\'s Encrypt for free certificates.',
                    scoreImpact: 30,
                })
                return findings
            }

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000)

            const response = await fetch(target, {
                method: 'HEAD',
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            // Check for HSTS header (more detailed check)
            const hsts = response.headers.get('strict-transport-security')
            if (hsts) {
                const maxAge = hsts.match(/max-age=(\d+)/)?.[1]
                if (maxAge && parseInt(maxAge) < 31536000) {
                    findings.push({
                        module: this.name,
                        title: 'Short HSTS Max-Age',
                        description: 'HSTS max-age is less than 1 year (31536000 seconds).',
                        severity: Severity.LOW,
                        recommendation: 'Set HSTS max-age to at least 31536000 seconds (1 year).',
                        scoreImpact: 3,
                    })
                }
            }

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                findings.push({
                    module: this.name,
                    title: 'Request Timeout',
                    description: 'SSL/TLS check timed out.',
                    severity: Severity.LOW,
                    recommendation: 'Ensure the target is accessible.',
                    scoreImpact: 0,
                })
            }
        }

        return findings
    }
}

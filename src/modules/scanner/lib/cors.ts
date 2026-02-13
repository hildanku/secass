import type { ScanFinding } from '@/types/scanner'
import type { ScanModule } from '@/modules/scanner/types'
import { Severity } from '@/lib/constants'

export class CorsModule implements ScanModule {
    name = 'CORS Configuration'
    description = 'Checks for insecure CORS configurations'

    async run(target: string): Promise<ScanFinding[]> {
        const findings: ScanFinding[] = []

        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000)

            const response = await fetch(target, {
                method: 'OPTIONS',
                headers: {
                    'Origin': 'https://evil.com',
                    'Access-Control-Request-Method': 'POST',
                },
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            const allowOrigin = response.headers.get('access-control-allow-origin')
            const allowCredentials = response.headers.get('access-control-allow-credentials')

            // Check for wildcard CORS
            if (allowOrigin === '*') {
                const severity = allowCredentials === 'true' ? Severity.CRITICAL : Severity.HIGH
                const impact = allowCredentials === 'true' ? 25 : 20

                findings.push({
                    module: this.name,
                    title: 'Wildcard CORS Configuration',
                    description: `Access-Control-Allow-Origin is set to '*'${allowCredentials === 'true' ? ' with credentials allowed' : ''}.`,
                    severity,
                    recommendation: allowCredentials === 'true'
                        ? 'CRITICAL: Never use wildcard CORS with credentials. Specify exact origins instead.'
                        : 'Specify exact allowed origins instead of using wildcard (*). This prevents unauthorized cross-origin access.',
                    scoreImpact: impact,
                })
            }

            // Check if evil origin is reflected
            if (allowOrigin && allowOrigin.includes('evil.com')) {
                findings.push({
                    module: this.name,
                    title: 'CORS Origin Reflection',
                    description: 'Server reflects the Origin header without validation.',
                    severity: Severity.HIGH,
                    recommendation: 'Implement a whitelist of allowed origins instead of reflecting the Origin header.',
                    scoreImpact: 20,
                })
            }

            // Check for overly permissive methods
            const allowMethods = response.headers.get('access-control-allow-methods')
            if (allowMethods && allowMethods.includes('*')) {
                findings.push({
                    module: this.name,
                    title: 'Permissive CORS Methods',
                    description: 'All HTTP methods are allowed via CORS.',
                    severity: Severity.MEDIUM,
                    recommendation: 'Explicitly specify only the required HTTP methods.',
                    scoreImpact: 8,
                })
            }

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                findings.push({
                    module: this.name,
                    title: 'Request Timeout',
                    description: 'The CORS check timed out after 5 seconds.',
                    severity: Severity.LOW,
                    recommendation: 'Ensure the target URL is accessible.',
                    scoreImpact: 0,
                })
            }
            // If CORS check fails, it might be configured correctly (no findings)
        }

        return findings
    }
}

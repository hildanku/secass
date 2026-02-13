import type { ScanFinding } from '@/types/scanner'
import type { ScanModule } from '@/modules/scanner/types'
import { Severity } from '@/lib/constants'

const SECURITY_HEADERS = {
    'content-security-policy': {
        title: 'Content Security Policy (CSP)',
        impact: 15,
        recommendation: 'Implement Content-Security-Policy header to prevent XSS attacks and other code injection attacks.',
    },
    'strict-transport-security': {
        title: 'HTTP Strict Transport Security (HSTS)',
        impact: 10,
        recommendation: 'Add Strict-Transport-Security header to enforce HTTPS connections.',
    },
    'x-frame-options': {
        title: 'X-Frame-Options',
        impact: 8,
        recommendation: 'Add X-Frame-Options header to prevent clickjacking attacks.',
    },
    'x-content-type-options': {
        title: 'X-Content-Type-Options',
        impact: 5,
        recommendation: 'Add X-Content-Type-Options: nosniff to prevent MIME type sniffing.',
    },
    'x-xss-protection': {
        title: 'X-XSS-Protection',
        impact: 5,
        recommendation: 'Add X-XSS-Protection header for additional XSS protection in older browsers.',
    },
    'referrer-policy': {
        title: 'Referrer Policy',
        impact: 3,
        recommendation: 'Add Referrer-Policy header to control referrer information.',
    },
}

export class SecurityHeadersModule implements ScanModule {
    name = 'Security Headers'
    description = 'Checks for presence of important security headers'

    async run(target: string): Promise<ScanFinding[]> {
        const findings: ScanFinding[] = []

        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000)

            const response = await fetch(target, {
                method: 'HEAD',
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            // Check each security header
            for (const [header, config] of Object.entries(SECURITY_HEADERS)) {
                const headerValue = response.headers.get(header)

                if (!headerValue) {
                    findings.push({
                        module: this.name,
                        title: `Missing ${config.title}`,
                        description: `The ${config.title} header is not present in the response.`,
                        severity: config.impact >= 10 ? Severity.HIGH : config.impact >= 5 ? Severity.MEDIUM : Severity.LOW,
                        recommendation: config.recommendation,
                        scoreImpact: config.impact,
                    })
                }
            }

            // Check for insecure CSP if present
            const csp = response.headers.get('content-security-policy')
            if (csp && (csp.includes('unsafe-inline') || csp.includes('unsafe-eval'))) {
                findings.push({
                    module: this.name,
                    title: 'Weak Content Security Policy',
                    description: 'CSP contains unsafe-inline or unsafe-eval directives.',
                    severity: Severity.MEDIUM,
                    recommendation: 'Remove unsafe-inline and unsafe-eval from CSP. Use nonces or hashes instead.',
                    scoreImpact: 7,
                })
            }

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                findings.push({
                    module: this.name,
                    title: 'Request Timeout',
                    description: 'The request timed out after 5 seconds.',
                    severity: Severity.MEDIUM,
                    recommendation: 'Ensure the target URL is accessible and responds in a timely manner.',
                    scoreImpact: 5,
                })
            } else {
                findings.push({
                    module: this.name,
                    title: 'Scan Error',
                    description: `Failed to fetch security headers: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    severity: Severity.LOW,
                    recommendation: 'Verify the URL is correct and accessible.',
                    scoreImpact: 0,
                })
            }
        }

        return findings
    }
}

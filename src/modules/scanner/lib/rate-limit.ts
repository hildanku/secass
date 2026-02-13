import type { ScanFinding } from '@/types/scanner'
import type { ScanModule } from '@/modules/scanner/types'
import { Severity } from '@/lib/constants'

export class RateLimitModule implements ScanModule {
    name = 'Rate Limiting'
    description = 'Checks if the server implements rate limiting'

    async run(target: string): Promise<ScanFinding[]> {
        const findings: ScanFinding[] = []
        const requestCount = 10
        let hasRateLimit = false
        const rateLimitHeaders: string[] = []

        try {
            // Send multiple rapid requests
            const requests = Array.from({ length: requestCount }, async () => {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 5000)

                try {
                    const response = await fetch(target, {
                        method: 'HEAD',
                        signal: controller.signal,
                    })
                    clearTimeout(timeoutId)

                    // Check for rate limit headers
                    const commonHeaders = [
                        'x-ratelimit-limit',
                        'x-ratelimit-remaining',
                        'x-rate-limit-limit',
                        'x-rate-limit-remaining',
                        'ratelimit-limit',
                        'ratelimit-remaining',
                        'retry-after',
                    ]

                    for (const header of commonHeaders) {
                        if (response.headers.get(header)) {
                            hasRateLimit = true
                            if (!rateLimitHeaders.includes(header)) {
                                rateLimitHeaders.push(header)
                            }
                        }
                    }

                    // Check for 429 status
                    if (response.status === 429) {
                        hasRateLimit = true
                    }

                    return response.status
                } catch {
                    return null
                }
            })

            const results = await Promise.all(requests)
            const blockedRequests = results.filter(status => status === 429).length

            if (!hasRateLimit && blockedRequests === 0) {
                findings.push({
                    module: this.name,
                    title: 'No Rate Limiting Detected',
                    description: `Sent ${requestCount} rapid requests without encountering rate limits or rate limit headers.`,
                    severity: Severity.MEDIUM,
                    recommendation: 'Implement rate limiting to prevent abuse and DoS attacks. Consider using headers like X-RateLimit-Limit and X-RateLimit-Remaining.',
                    scoreImpact: 10,
                })
            } else if (hasRateLimit) {
                // Rate limiting detected - this is good, no finding needed
                // But we could add an informational message if needed
            }

        } catch (error) {
            findings.push({
                module: this.name,
                title: 'Rate Limit Check Error',
                description: `Failed to check rate limiting: ${error instanceof Error ? error.message : 'Unknown error'}`,
                severity: Severity.LOW,
                recommendation: 'Manual verification recommended.',
                scoreImpact: 0,
            })
        }

        return findings
    }
}

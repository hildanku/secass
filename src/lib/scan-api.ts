import { ScanService } from '@/modules/core/scan-service'
import { UrlValidator } from '@/lib/url-validator'
import { RateLimiter } from '@/lib/rate-limiter'
import type { ScanRequest, ScanResponse } from '@/types/scanner'

const scanService = new ScanService()
const urlValidator = new UrlValidator()
const rateLimiter = new RateLimiter(1, 5 * 60 * 1000) // 1 scan per 5 minutes

export async function performScan(request: ScanRequest, clientId: string): Promise<ScanResponse> {
    try {
        // Rate limiting check
        const rateLimitResult = rateLimiter.check(clientId)
        if (!rateLimitResult.allowed) {
            return {
                success: false,
                error: `Rate limit exceeded. Please try again in ${rateLimitResult.retryAfter} seconds.`,
            }
        }

        // URL validation with SSRF protection
        const validation = urlValidator.validate(request.url)
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error || 'Invalid URL',
            }
        }

        // Perform scan
        const result = await scanService.scan(request.url)

        return {
            success: true,
            data: result,
        }
    } catch (error) {
        console.error('Scan error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        }
    }
}

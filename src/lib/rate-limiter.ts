interface RateLimitEntry {
    count: number
    resetAt: number
}

export class RateLimiter {
    private readonly store = new Map<string, RateLimitEntry>()
    private readonly maxRequests: number
    private readonly windowMs: number

    constructor(maxRequests: number = 5, windowMs: number = 1 * 60 * 1000) {
        this.maxRequests = maxRequests
        this.windowMs = windowMs

        // Clean up expired entries every minute
        setInterval(() => this.cleanup(), 60 * 1000)
    }

    check(identifier: string): { allowed: boolean; retryAfter?: number } {
        const now = Date.now()
        const entry = this.store.get(identifier)

        if (!entry || entry.resetAt < now) {
            // First request or window expired
            this.store.set(identifier, {
                count: 1,
                resetAt: now + this.windowMs,
            })
            return { allowed: true }
        }

        if (entry.count >= this.maxRequests) {
            // Rate limit exceeded
            const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
            return { allowed: false, retryAfter }
        }

        // Increment count
        entry.count++
        return { allowed: true }
    }

    private cleanup() {
        const now = Date.now()
        for (const [key, entry] of this.store.entries()) {
            if (entry.resetAt < now) {
                this.store.delete(key)
            }
        }
    }

    // Get client identifier from request (in real app, use IP)
    static getClientId(request?: Request): string {
        // In a real backend, extract IP from request
        // For MVP, we'll use a simple identifier
        if (typeof window !== 'undefined') {
            return 'browser-client'
        }
        return request?.headers.get('x-forwarded-for') ||
            request?.headers.get('x-real-ip') ||
            'unknown-client'
    }
}

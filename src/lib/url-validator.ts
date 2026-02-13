const BLOCKED_IP_PATTERNS = [
    // Loopback
    /^127\./,
    /^localhost$/i,
    /^::1$/,

    // Private networks
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,

    // Link local
    /^169\.254\./,
    /^fe80:/i,

    // Other special addresses
    /^0\./,
    /^224\./,
    /^255\./,
]

export class UrlValidator {
    private readonly ALLOWED_PROTOCOLS = ['http:', 'https:']

    validate(urlString: string): { valid: boolean; error?: string; url?: URL } {
        // Basic format check
        if (!urlString || typeof urlString !== 'string') {
            return { valid: false, error: 'URL is required and must be a string' }
        }

        // URL parsing
        let url: URL
        try {
            url = new URL(urlString)
        } catch {
            return { valid: false, error: 'Invalid URL format' }
        }

        // Protocol check
        if (!this.ALLOWED_PROTOCOLS.includes(url.protocol)) {
            return {
                valid: false,
                error: `Only HTTP and HTTPS protocols are allowed. Got: ${url.protocol}`
            }
        }

        // SSRF protection - check hostname
        const hostname = url.hostname.toLowerCase()

        // Check for IP address patterns
        for (const pattern of BLOCKED_IP_PATTERNS) {
            if (pattern.test(hostname)) {
                return {
                    valid: false,
                    error: 'Cannot scan internal/private IP addresses'
                }
            }
        }

        // Check for localhost variants
        if (hostname === 'localhost' || hostname === '0.0.0.0') {
            return {
                valid: false,
                error: 'Cannot scan localhost'
            }
        }

        // Check for metadata URLs (cloud providers)
        const metadataHosts = ['169.254.169.254', 'metadata.google.internal', 'metadata']
        if (metadataHosts.some(host => hostname.includes(host))) {
            return {
                valid: false,
                error: 'Cannot scan cloud metadata endpoints'
            }
        }

        return { valid: true, url }
    }
}

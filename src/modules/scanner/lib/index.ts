import { SecurityHeadersModule } from '@/modules/scanner/lib/security-headers'
import type { ScanModule } from '@/modules/scanner/types'
import { CorsModule } from '@/modules/scanner/lib/cors'
import { RateLimitModule } from '@/modules/scanner/lib/rate-limit'
import { SslTlsModule } from '@/modules/scanner/lib/ssl-tls'

export const scanModules: ScanModule[] = [
    new SecurityHeadersModule(),
    new CorsModule(),
    new RateLimitModule(),
    new SslTlsModule(),
]

export type { ScanModule } from '../types'

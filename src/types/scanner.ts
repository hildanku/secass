import { RiskLevel, Severity } from '@/lib/constants'

export interface ScanFinding {
    module: string
    title: string
    description: string
    severity: Severity
    recommendation: string
    scoreImpact: number
}

export interface ScanResult {
    url: string
    timestamp: string
    score: number
    riskLevel: RiskLevel
    findings: ScanFinding[]
    summary: {
        totalChecks: number
        passedChecks: number
        failedChecks: number
    }
}

export interface ScanRequest {
    url: string
}

export interface ScanResponse {
    success: boolean
    data?: ScanResult
    error?: string
}

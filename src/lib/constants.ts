export let RiskLevel = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
} as const

export type RiskLevel = typeof RiskLevel[keyof typeof RiskLevel]

export let Severity = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
} as const

export type Severity = typeof Severity[keyof typeof Severity]

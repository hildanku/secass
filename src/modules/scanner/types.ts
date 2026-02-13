import type { ScanFinding } from '@/types/scanner'

export interface ScanModule {
    name: string
    description: string
    run(target: string): Promise<ScanFinding[]>
}

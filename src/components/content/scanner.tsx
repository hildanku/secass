import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { performScan } from '@/lib/scan-api'
import type { ScanResult } from '@/types/scanner'
import { PdfGenerator } from '@/lib/pdf-generator'
import { AlertCircle, Download, Shield, Loader2 } from 'lucide-react'

export function SecurityScanner() {
    const form = useForm({
        defaultValues: {
            url: '',
            result: null as ScanResult | null,
            error: null as string | null,
        },
        onSubmit: async ({ value, formApi }) => {
            // Clear previous results
            formApi.setFieldValue('error', null)
            formApi.setFieldValue('result', null)

            try {
                const response = await performScan({ url: value.url }, 'browser-client')

                if (response.success && response.data) {
                    formApi.setFieldValue('result', response.data)
                } else {
                    formApi.setFieldValue('error', response.error || 'Scan failed')
                }
            } catch (err) {
                formApi.setFieldValue('error', err instanceof Error ? err.message : 'An unexpected error occurred')
            }
        },
    })

    const handleDownloadPdf = () => {
        const result = form.getFieldValue('result')
        if (!result) return

        const pdfGenerator = new PdfGenerator()
        const pdf = pdfGenerator.generate(result)
        pdf.save(`security-scan-${new Date().getTime()}.pdf`)
    }

    const getRiskColor = (score: number) => {
        if (score >= 75) return 'text-green-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getRiskBgColor = (score: number) => {
        if (score >= 75) return 'bg-green-100 border-green-300'
        if (score >= 60) return 'bg-yellow-100 border-yellow-300'
        return 'bg-red-100 border-red-300'
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-red-900 text-white'
            case 'HIGH': return 'bg-red-600 text-white'
            case 'MEDIUM': return 'bg-yellow-500 text-white'
            case 'LOW': return 'bg-blue-500 text-white'
            default: return 'bg-gray-500 text-white'
        }
    }

    return (
        <div className="max-w-7xl mx-auto p-4">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Security Scanner</h1>
                <p className="text-gray-600">
                    Analyze website security risks
                </p>
            </div>

            {/* Main Grid: Form on Left, Results on Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Form */}
                <div>
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                form.handleSubmit()
                            }}
                        >
                            <form.Field
                                name="url"
                                validators={{
                                    onChange: ({ value }) => {
                                        if (!value) return 'URL is required'
                                        try {
                                            new URL(value)
                                        } catch {
                                            return 'Please enter a valid URL'
                                        }
                                        return undefined
                                    },
                                }}
                            >
                                {(field) => (
                                    <div className="mb-4">
                                        <label htmlFor={field.name} className="block text-sm font-medium mb-2">
                                            Website URL
                                        </label>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="https://example.com"
                                            disabled={form.state.isSubmitting}
                                            className="w-full"
                                        />
                                        {field.state.meta.errors ? (
                                            <p className="text-red-600 text-sm mt-1">
                                                {field.state.meta.errors.join(', ')}
                                            </p>
                                        ) : null}
                                    </div>
                                )}
                            </form.Field>

                            <Button
                                type="submit"
                                disabled={form.state.isSubmitting}
                                className="w-full"
                            >
                                {form.state.isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Scanning...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-4 h-4 mr-2" />
                                        Start Scan
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Disclaimer */}
                        <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
                            <strong>Disclaimer:</strong> This tool performs automated checks and does not replace a professional security audit.
                        </div>
                    </div>

                    {/* Error Display */}
                    <form.Field name="error">
                        {(field) => field.state.value && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                                <AlertCircle className="w-5 h-5 text-red-600 mr-3 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-red-800">Error</h3>
                                    <p className="text-red-700">{field.state.value}</p>
                                </div>
                            </div>
                        )}
                    </form.Field>
                </div>

                {/* Right Column - Results */}
                <div>
                    <form.Field name="result">
                        {(field) => field.state.value && (
                            <div className="space-y-6">
                                {/* Score Card */}
                                <div className={`rounded-lg border p-6 ${getRiskBgColor(field.state.value.score)}`}>
                                    <h2 className="text-xl font-bold mb-2">Security Score</h2>
                                    <p className={`text-5xl font-bold ${getRiskColor(field.state.value.score)}`}>
                                        {field.state.value.score}/100
                                    </p>
                                    <p className="text-lg font-semibold mt-2">
                                        Risk Level: {field.state.value.riskLevel}
                                    </p>
                                    <div className="mt-4">
                                        <div className="mb-2">
                                            <p className="text-sm text-gray-600">Scanned URL</p>
                                            <p className="font-mono text-sm break-all">{field.state.value.url}</p>
                                        </div>
                                        <div className="mb-3">
                                            <p className="text-sm text-gray-600">Scan Time</p>
                                            <p className="text-sm">{new Date(field.state.value.timestamp).toLocaleString()}</p>
                                        </div>
                                        <Button onClick={handleDownloadPdf} variant="outline" size="sm">
                                            <Download className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </Button>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-bold mb-4">Summary</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center p-3 bg-blue-50 rounded">
                                            <p className="text-2xl font-bold text-blue-600">{field.state.value.summary.totalChecks}</p>
                                            <p className="text-xs text-gray-600">Total Checks</p>
                                        </div>
                                        <div className="text-center p-3 bg-green-50 rounded">
                                            <p className="text-2xl font-bold text-green-600">{field.state.value.summary.passedChecks}</p>
                                            <p className="text-xs text-gray-600">Passed</p>
                                        </div>
                                        <div className="text-center p-3 bg-red-50 rounded">
                                            <p className="text-2xl font-bold text-red-600">{field.state.value.summary.failedChecks}</p>
                                            <p className="text-xs text-gray-600">Failed</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Findings */}
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-bold mb-4">Detailed Findings</h3>

                                    {field.state.value.findings.length === 0 ? (
                                        <div className="text-center py-8 text-green-600">
                                            <Shield className="w-12 h-12 mx-auto mb-3" />
                                            <p className="text-lg font-semibold">No security issues detected!</p>
                                            <p className="text-gray-600 text-sm">Your website passed all security checks.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {field.state.value.findings.map((finding, index) => (
                                                <div key={index} className="border rounded-lg p-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="font-semibold">{finding.title}</h4>
                                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(finding.severity)}`}>
                                                            {finding.severity}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        <strong>Module:</strong> {finding.module}
                                                    </p>
                                                    <p className="text-sm text-gray-700 mb-3">{finding.description}</p>
                                                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                                                        <p className="text-sm font-semibold text-blue-900 mb-1">Recommendation:</p>
                                                        <p className="text-sm text-blue-800">{finding.recommendation}</p>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        Impact: -{finding.scoreImpact} points
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </form.Field>
                </div>
            </div>
        </div>
    )
}

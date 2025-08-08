import { useState } from 'react'
import {
  Bot,
  Sparkles,
  User,
  CheckCircle2,
  AlertCircle,
  Save,
  Play,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  FileText
} from 'lucide-react'
import { Button } from '../ui/button'
import { AIResponseCollapsible } from './AIResponseCollapsible'

export interface MessageRendererProps {
  message: {
    id: string
    type: string
    content: string
    data?: any
    timestamp?: number
  }
  onSaveRule?: (rule: any) => void
  onRunValidation?: (rule: any, useTestCases?: boolean) => void
  isValidating?: boolean
}

export function MessageRenderer({
  message,
  onSaveRule,
  onRunValidation,
  isValidating
}: MessageRendererProps) {
  const [expandedTestCases, setExpandedTestCases] = useState<Set<string>>(() => {
    // Initialize with all test cases expanded by default
    const initialExpanded = new Set<string>()
    if (message.data?.testCases) {
      message.data.testCases.forEach((testCase: any, idx: number) => {
        initialExpanded.add(`${testCase.id || idx}-testdata`)
      })
    }
    return initialExpanded
  })

  const toggleTestCaseExpansion = (testCaseId: string) => {
    setExpandedTestCases(prev => {
      const newSet = new Set(prev)
      if (newSet.has(testCaseId)) {
        newSet.delete(testCaseId)
      } else {
        newSet.add(testCaseId)
      }
      return newSet
    })
  }

  function renderMessage() {
    switch (message.type) {
      case 'user':
        return (
          <div className="flex items-start gap-3 p-4 animate-in slide-in-from-bottom-2 min-w-0 max-w-full">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium mb-1">You</p>
              <div className="bg-muted rounded-lg p-3 break-words">
                <p className="text-sm break-words">{message.content}</p>
              </div>
            </div>
          </div>
        )

      case 'thinking':
        return (
          <div className="flex items-start gap-3 p-4 animate-in slide-in-from-bottom-2 bg-muted/30 min-w-0 max-w-full">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4 text-secondary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <AIResponseCollapsible content={message.content} />
            </div>
          </div>
        )

      case 'rule':
        return (
          <div className="flex items-start gap-3 p-4 animate-in slide-in-from-bottom-2 min-w-0 max-w-full">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium mb-2">Generated CEL Rule</p>
              <div className="bg-card rounded-lg p-4 border space-y-3 break-words">
                {message.data?.name && (
                  <h3 className="text-lg font-semibold break-words">{message.data.name}</h3>
                )}
                <p className="text-sm break-words">{message.content}</p>
                <div className="bg-muted rounded-md p-3 font-mono text-xs overflow-x-auto max-w-full">
                  {message.data?.expression}
                </div>
                {message.data?.variables?.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Variables: {message.data.variables.join(', ')}
                  </p>
                )}

                {/* Display rule inputs */}
                {(message.data?.inputs?.length > 0 || message.data?.suggestedInputs?.length > 0) && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-medium">Rule Inputs ({(message.data?.inputs || message.data?.suggestedInputs || []).length})</p>
                    {(message.data?.inputs || message.data?.suggestedInputs || []).map((input: any, idx: number) => {
                      // Determine input type and data - handle both flat and nested formats
                      let inputType = 'unknown'
                      let inputData = null

                      if (input.kubernetes) {
                        inputType = 'kubernetes'
                        inputData = input.kubernetes
                      } else if (input.file) {
                        inputType = 'file'
                        inputData = input.file
                      } else if (input.http) {
                        inputType = 'http'
                        inputData = input.http
                      } else if (input.inputType) {
                        inputType = input.inputType.case || 'unknown'
                        inputData = input.inputType.value
                      }

                      // Color scheme based on input type
                      const colorScheme = {
                        kubernetes: 'border-l-blue-500 bg-blue-50/50',
                        file: 'border-l-green-500 bg-green-50/50',
                        http: 'border-l-purple-500 bg-purple-50/50',
                        unknown: 'border-l-gray-500 bg-gray-50/50'
                      }[inputType] || 'border-l-gray-500 bg-gray-50/50'

                      return (
                        <div key={input.name || idx} className={`rounded-md p-3 border-l-4 ${colorScheme} space-y-2`}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{input.name}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${inputType === 'kubernetes' ? 'bg-blue-100 text-blue-800' :
                                inputType === 'file' ? 'bg-green-100 text-green-800' :
                                  inputType === 'http' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                              }`}>
                              {inputType.charAt(0).toUpperCase() + inputType.slice(1)}
                            </span>
                          </div>

                          {input.description && (
                            <p className="text-xs text-muted-foreground">{input.description}</p>
                          )}

                          {/* Kubernetes Input Fields */}
                          {inputType === 'kubernetes' && inputData && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div><span className="font-medium">Resource:</span> <code className="bg-muted px-1 rounded">{inputData.resource || 'N/A'}</code></div>
                              <div><span className="font-medium">Version:</span> <code className="bg-muted px-1 rounded">{inputData.version || inputData.apiVersion || 'N/A'}</code></div>
                              {inputData.group && <div><span className="font-medium">API Group:</span> <code className="bg-muted px-1 rounded">{inputData.group}</code></div>}
                              {inputData.namespace && <div><span className="font-medium">Namespace:</span> <code className="bg-muted px-1 rounded">{inputData.namespace}</code></div>}
                              {inputData.resourceName && <div><span className="font-medium">Resource Name:</span> <code className="bg-muted px-1 rounded">{inputData.resourceName}</code></div>}
                              {inputData.listAll !== undefined && (
                                <div><span className="font-medium">List All:</span>
                                  <span className={`ml-1 px-2 py-0.5 rounded text-xs ${inputData.listAll ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {inputData.listAll ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* File Input Fields */}
                          {inputType === 'file' && inputData && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="col-span-2"><span className="font-medium">File Path:</span> <code className="bg-muted px-1 rounded">{inputData.path || 'N/A'}</code></div>
                              <div><span className="font-medium">Format:</span> <code className="bg-muted px-1 rounded">{inputData.format || 'JSON'}</code></div>
                              <div><span className="font-medium">Access Mode:</span> <code className="bg-muted px-1 rounded">{inputData.accessMode || 'READ'}</code></div>
                              {inputData.recursive !== undefined && (
                                <div><span className="font-medium">Recursive:</span>
                                  <span className={`ml-1 px-2 py-0.5 rounded text-xs ${inputData.recursive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {inputData.recursive ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              )}
                              {inputData.checkPermissions !== undefined && (
                                <div><span className="font-medium">Check Permissions:</span>
                                  <span className={`ml-1 px-2 py-0.5 rounded text-xs ${inputData.checkPermissions ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {inputData.checkPermissions ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* HTTP Input Fields */}
                          {inputType === 'http' && inputData && (
                            <div className="space-y-2 text-xs">
                              <div><span className="font-medium">URL:</span> <code className="bg-muted px-1 rounded break-all">{inputData.url || 'N/A'}</code></div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><span className="font-medium">Method:</span>
                                  <span className={`ml-1 px-2 py-0.5 rounded text-xs font-medium ${inputData.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                                      inputData.method === 'POST' ? 'bg-green-100 text-green-800' :
                                        inputData.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                                          inputData.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {inputData.method || 'GET'}
                                  </span>
                                </div>
                                {inputData.headers && (
                                  <div><span className="font-medium">Headers:</span> <span className="text-muted-foreground">{Object.keys(inputData.headers).length} defined</span></div>
                                )}
                              </div>
                              {inputData.body && (
                                <div>
                                  <span className="font-medium">Request Body:</span>
                                  <pre className="mt-1 bg-muted rounded p-2 text-xs overflow-x-auto max-h-20">{typeof inputData.body === 'string' ? inputData.body : JSON.stringify(inputData.body, null, 2)}</pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Display test cases */}
                {message.data?.testCases?.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-medium">Test Cases ({message.data.testCases.length})</p>
                    {message.data.testCases.map((testCase: any, idx: number) => {
                      // Handle different test case formats
                      const tcName = testCase.name || testCase.description || `Test Case ${idx + 1}`
                      const tcDescription = testCase.description && testCase.description !== tcName ? testCase.description : null
                      const expectedResult = testCase.expectedResult ?? testCase.shouldPass ?? testCase.expected_result
                      const testData = testCase.testData || testCase.data || {}

                      return (
                        <div key={testCase.id || idx} className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border border-indigo-200/50 rounded-md p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{tcName}</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${expectedResult === true || expectedResult === 'true' || expectedResult === 'pass' ?
                                  'bg-green-100 text-green-800' :
                                  expectedResult === false || expectedResult === 'false' || expectedResult === 'fail' ?
                                    'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                {expectedResult === true || expectedResult === 'true' || expectedResult === 'pass' ? 'Should Pass' :
                                  expectedResult === false || expectedResult === 'false' || expectedResult === 'fail' ? 'Should Fail' :
                                    typeof expectedResult === 'string' ? expectedResult : 'Unknown'}
                              </span>
                            </div>
                            {testCase.id && (
                              <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{testCase.id}</code>
                            )}
                          </div>

                          {tcDescription && (
                            <p className="text-xs text-muted-foreground italic">{tcDescription}</p>
                          )}

                          {/* Test Data Display */}
                          {Object.keys(testData).length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-indigo-700">Test Data ({Object.keys(testData).length} fields):</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleTestCaseExpansion(`${testCase.id || idx}-testdata`)}
                                  className="h-6 px-2 text-xs flex items-center gap-1"
                                >
                                  {expandedTestCases.has(`${testCase.id || idx}-testdata`) ? (
                                    <ChevronDown className="w-3 h-3" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3" />
                                  )}
                                  {expandedTestCases.has(`${testCase.id || idx}-testdata`) ? 'Hide Details' : 'View Details'}
                                </Button>
                              </div>

                              {expandedTestCases.has(`${testCase.id || idx}-testdata`) ? (
                                <div className="bg-white/70 rounded border p-3 space-y-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-sm text-indigo-800">Test Data Details: {tcName}</h4>
                                    <span className="text-xs text-muted-foreground">{Object.keys(testData).length} fields</span>
                                  </div>
                                  <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {Object.entries(testData).map(([key, value]) => (
                                      <div key={key} className="bg-white rounded border p-2">
                                        <div className="flex items-start gap-2">
                                          <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium min-w-fit">
                                            {key}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs text-muted-foreground mb-1">
                                              Type: {Array.isArray(value) ? 'Array' : typeof value}
                                            </div>
                                            <div className="bg-muted rounded p-2 text-xs font-mono overflow-x-auto">
                                              {typeof value === 'object' && value !== null ? (
                                                <pre className="whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
                                              ) : (
                                                <span className="break-all">{String(value)}</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-white/70 rounded border p-2">
                                  <div className="flex flex-wrap gap-1">
                                    {Object.keys(testData).map((key) => (
                                      <span key={key} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                                        {key}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Show additional test case properties if available */}
                          {(testCase.tags || testCase.category || testCase.priority) && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {testCase.category && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{testCase.category}</span>
                              )}
                              {testCase.priority && (
                                <span className={`px-2 py-0.5 rounded text-xs ${testCase.priority === 'high' ? 'bg-red-100 text-red-700' :
                                    testCase.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-green-100 text-green-700'
                                  }`}>
                                  {testCase.priority} priority
                                </span>
                              )}
                              {testCase.tags && testCase.tags.map((tag: string, tagIdx: number) => (
                                <span key={tagIdx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">#{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onSaveRule?.(message.data)}
                    className="flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    Save Rule
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRunValidation?.(message.data, false)}
                    disabled={isValidating}
                    className="flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" />
                    Test Rule
                  </Button>
                  {message.data?.testCases?.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRunValidation?.(message.data, true)}
                      disabled={isValidating}
                      className="flex items-center gap-1"
                    >
                      <FlaskConical className="w-3 h-3" />
                      Run Test Cases
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 'validation':
        const validationData = message.data || {}
        const hasError = !!validationData.error
        const results = validationData.results || []
        const totalPassed = results.filter((r: any) => r.passed || r.success).length
        const totalFailed = results.length - totalPassed
        const isSuccess = !hasError && totalFailed === 0

        return (
          <div className="flex items-start gap-3 p-4 animate-in slide-in-from-bottom-2 min-w-0 max-w-full">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isSuccess ? 'bg-green-500' : 'bg-red-500'
              }`}>
              {isSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
              ) : (
                <AlertCircle className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-medium">Validation Results</p>
                <div className="flex gap-2">
                  {totalPassed > 0 && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      {totalPassed} Passed
                    </span>
                  )}
                  {totalFailed > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                      {totalFailed} Failed
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-lg p-4 border space-y-3 break-words">
                <p className="text-sm break-words">{message.content}</p>

                {/* Error Display */}
                {hasError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <p className="font-medium text-red-800">Validation Error</p>
                    </div>

                    <div className="space-y-2">
                      {(() => {
                        const errorMsg = validationData.error || ''

                        // Extract user-friendly error message
                        if (errorMsg.includes('cluster connectivity issues')) {
                          const inputMatch = errorMsg.match(/input '([^']+)'/)
                          const resourceMatch = errorMsg.match(/\(([^)]+)\)/)

                          return (
                            <div className="space-y-2">
                              <div className="bg-white rounded border p-3">
                                <p className="text-sm font-medium text-red-800 mb-1">🔌 Cluster Connection Issue</p>
                                <p className="text-sm text-red-700">
                                  Unable to connect to the Kubernetes cluster to fetch resources
                                  {inputMatch && <span className="font-mono bg-red-100 px-1 rounded"> '{inputMatch[1]}'</span>}
                                  {resourceMatch && <span className="text-xs text-red-600"> ({resourceMatch[1]})</span>}.
                                </p>
                              </div>

                              <div className="bg-white rounded border p-3">
                                <p className="text-sm font-medium text-red-800 mb-1">💡 Possible Solutions:</p>
                                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                                  <li>Check if your Kubernetes cluster is running and accessible</li>
                                  <li>Verify your kubeconfig file and cluster credentials</li>
                                  <li>Ensure network connectivity to the cluster API server</li>
                                  <li>Try using test cases instead for offline validation</li>
                                </ul>
                              </div>

                              <details className="bg-white rounded border">
                                <summary className="p-3 cursor-pointer text-sm font-medium text-red-800 hover:bg-red-50">
                                  🔍 Technical Details
                                </summary>
                                <div className="p-3 pt-0 border-t">
                                  <pre className="text-xs text-red-600 whitespace-pre-wrap font-mono bg-red-50 p-2 rounded overflow-x-auto max-w-full break-all">
                                    {errorMsg}
                                  </pre>
                                </div>
                              </details>
                            </div>
                          )
                        }

                        // Generic error handling
                        return (
                          <div className="bg-white rounded border p-3">
                            <p className="text-sm text-red-700 whitespace-pre-wrap">{errorMsg}</p>
                          </div>
                        )
                      })()
                      }
                    </div>
                  </div>
                )}

                {/* Detailed Results */}
                {results.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Test Results:</p>
                    {results.map((result: any, idx: number) => {
                      const passed = result.passed || result.success
                      return (
                        <div key={idx} className={`rounded-md p-3 border-l-4 ${passed ? 'border-l-green-500 bg-green-50/50' : 'border-l-red-500 bg-red-50/50'
                          }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">
                              {result.testCase || result.testCaseId || result.description || `Test ${idx + 1}`}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {passed ? 'PASS' : 'FAIL'}
                            </span>
                          </div>

                          {(result.message || result.details) && (
                            <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                              {result.details || result.message}
                            </div>
                          )}

                          {result.error && (
                            <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
                              <p className="text-xs font-medium text-red-800 mb-1">Error:</p>
                              <pre className="text-xs text-red-700 whitespace-pre-wrap">{result.error}</pre>
                            </div>
                          )}

                          {result.output !== undefined && (
                            <div className="mt-2">
                              <p className="text-xs font-medium mb-1">Output:</p>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {typeof result.output === 'object' ? JSON.stringify(result.output) : String(result.output)}
                              </code>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Raw data for debugging */}
                {Object.keys(validationData).length > 0 && (
                  <details className="mt-3">
                    <summary className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground">
                      View Raw Data
                    </summary>
                    <pre className="mt-2 bg-muted rounded-md p-3 text-xs overflow-x-auto">
                      {JSON.stringify(validationData, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="flex items-start gap-3 p-4 animate-in slide-in-from-bottom-2">
            <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-destructive-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Error</p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive">{message.content}</p>
                {message.data && (
                  <pre className="mt-2 bg-destructive/5 rounded-md p-3 text-xs overflow-x-auto text-destructive">
                    {JSON.stringify(message.data, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )

      case 'resources':
        return (
          <div className="flex items-start gap-3 p-4 animate-in slide-in-from-bottom-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Resources</p>
              <div className="bg-card rounded-lg p-4 border">
                <p className="text-sm">{message.content}</p>
                {message.data && (
                  <pre className="mt-2 bg-muted rounded-md p-3 text-xs overflow-x-auto">
                    {JSON.stringify(message.data, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )

      case 'resources':
        return (
          <div className="flex items-start gap-3 p-4 animate-in slide-in-from-bottom-2 min-w-0 max-w-full">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium mb-1">Resources</p>
              <div className="bg-card rounded-lg p-4 border break-words">
                <p className="text-sm break-words">{message.content}</p>
                {message.data && (
                  <pre className="mt-2 bg-muted rounded-md p-3 text-xs overflow-x-auto max-w-full">
                    {JSON.stringify(message.data, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )

      case 'assistant':
      default:
        return (
          <div className="flex items-start gap-3 p-4 animate-in slide-in-from-bottom-2 min-w-0 max-w-full">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium mb-1">Assistant</p>
              <AIResponseCollapsible content={message.content} />
            </div>
          </div>
        )
    }
  }

  return renderMessage()
}

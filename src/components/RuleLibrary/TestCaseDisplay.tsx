import { useState } from 'react';
import { Button } from '../ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { RuleTestCase } from '../../gen/cel/v1/cel_pb';

interface TestCaseDisplayProps {
    testCase: RuleTestCase;
}

// Test Case Display Component with expandable test data (matching chat message style)
export function TestCaseDisplay({ testCase }: TestCaseDisplayProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Handle different test case formats
    const tcName = testCase.name || `Test Case`
    const tcDescription = testCase.description && testCase.description !== tcName ? testCase.description : null
    const expectedResult = testCase.expectedResult
    const testData = testCase.testData || {}
    
    const toggleExpansion = () => setIsExpanded(!isExpanded)

    return (
        <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border border-indigo-200/50 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{tcName}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                        expectedResult === true ? 
                            'bg-green-100 text-green-800' : 
                        expectedResult === false ?
                            'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                    }`}>
                        {expectedResult === true ? 'Should Pass' :
                         expectedResult === false ? 'Should Fail' :
                         'Unknown'}
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
                            onClick={toggleExpansion}
                            className="h-6 px-2 text-xs flex items-center gap-1"
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                            ) : (
                                <ChevronRight className="w-3 h-3" />
                            )}
                            {isExpanded ? 'Hide Details' : 'View Details'}
                        </Button>
                    </div>
                    
                    {isExpanded ? (
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
        </div>
    );
}

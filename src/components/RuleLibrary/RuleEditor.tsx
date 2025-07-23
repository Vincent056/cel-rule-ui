import { useState, useMemo } from 'react';
import { create } from '@bufbuild/protobuf';
import { 
    CELRuleSchema, 
    RuleTestCaseSchema,
    TestCaseResultSchema
} from '../../gen/cel/v1/cel_pb';
import type { CELRule, RuleTestCase, TestCaseResult } from '../../gen/cel/v1/cel_pb';
import { CELValidationService } from '../../gen/cel/v1/cel_pb';
import { createClient } from '@connectrpc/connect';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { X } from 'lucide-react';
import { RuleEditorForm } from './RuleEditorForm';
import { TestCasesEditor } from './TestCasesEditor';

interface RuleEditorProps {
    rule: CELRule;
    onSave: (rule: CELRule) => void;
    onCancel: () => void;
    transport?: any;
}

export function RuleEditor({ rule, onSave, onCancel, transport }: RuleEditorProps) {
    const [editedRule, setEditedRule] = useState<CELRule>(rule);
    const [testCases, setTestCases] = useState<RuleTestCase[]>(rule.testCases || []);
    const [activeTab, setActiveTab] = useState('editor');
    const [isValidating, setIsValidating] = useState(false);
    const [validationResults, setValidationResults] = useState<TestCaseResult[]>([]);

    // Detect unsaved changes by comparing original rule with current state
    const hasUnsavedChanges = useMemo(() => {
        // Deep comparison helper
        const deepEqual = (obj1: any, obj2: any): boolean => {
            if (obj1 === obj2) return true;
            if (obj1 == null || obj2 == null) return false;
            if (typeof obj1 !== typeof obj2) return false;
            
            if (typeof obj1 === 'object') {
                const keys1 = Object.keys(obj1);
                const keys2 = Object.keys(obj2);
                if (keys1.length !== keys2.length) return false;
                
                for (let key of keys1) {
                    if (!keys2.includes(key)) return false;
                    if (!deepEqual(obj1[key], obj2[key])) return false;
                }
                return true;
            }
            
            return obj1 === obj2;
        };
        
        // Compare rule properties (excluding test cases)
        const ruleWithoutTestCases = {
            ...editedRule,
            testCases: [] // Compare test cases separately
        };
        const originalWithoutTestCases = {
            ...rule,
            testCases: []
        };
        
        const ruleChanged = !deepEqual(ruleWithoutTestCases, originalWithoutTestCases);
        const testCasesChanged = !deepEqual(testCases, rule.testCases || []);
        
        return ruleChanged || testCasesChanged;
    }, [editedRule, testCases, rule]);

    const client = transport ? createClient(CELValidationService, transport) : null;

    const handleSave = () => {
        // Ensure test cases have properly formatted data
        const formattedTestCases = testCases.map(tc => {
            const formattedTestCase = create(RuleTestCaseSchema, tc);

            // Ensure testData values are JSON strings
            const formattedTestData: Record<string, string> = {};
            for (const [key, value] of Object.entries(tc.testData)) {
                if (typeof value === 'string') {
                    try {
                        // Validate it's valid JSON
                        JSON.parse(value);
                        formattedTestData[key] = value;
                    } catch {
                        // If not valid JSON, skip or handle error
                        console.warn(`Invalid JSON in test case ${tc.name} for input ${key}`);
                        formattedTestData[key] = '{}';
                    }
                } else {
                    formattedTestData[key] = JSON.stringify(value);
                }
            }

            formattedTestCase.testData = formattedTestData;
            return formattedTestCase;
        });

        const ruleToSave = create(CELRuleSchema, editedRule);
        ruleToSave.testCases = formattedTestCases;
        onSave(ruleToSave);
    };

    const validateRule = async () => {
        if (!client) return;
        setIsValidating(true);
        try {
            // Convert test cases to the format expected by the backend
            const formattedTestCases = testCases.map(tc => {
                const testData: Record<string, string> = {};
                for (const [key, value] of Object.entries(tc.testData)) {
                    if (typeof value === 'string') {
                        testData[key] = value;
                    } else {
                        testData[key] = JSON.stringify(value);
                    }
                }

                return {
                    id: tc.id,
                    description: tc.description || tc.name,
                    testData: testData,
                    expectedResult: tc.expectedResult,
                };
            });

            // Check if any test cases have inputs
            const hasAnyInputs = formattedTestCases.some(tc => Object.keys(tc.testData).length > 0);
            if (!hasAnyInputs) {
                console.error('No test cases have any test data');
                alert('None of the test cases have test data. Please add test data to the test cases.');
                setIsValidating(false);
                return;
            }

            // Clean the inputs to remove $typeName
            const cleanInput = (obj: any): any => {
                if (Array.isArray(obj)) {
                    return obj.map(cleanInput);
                } else if (obj && typeof obj === 'object') {
                    const cleaned: any = {};
                    for (const [key, value] of Object.entries(obj)) {
                        if (key !== '$typeName') {
                            cleaned[key] = cleanInput(value);
                        }
                    }
                    return cleaned;
                }
                return obj;
            };

            // Format inputs properly for all input types
            const inputs = editedRule.inputs.map((input) => {
                const cleaned = cleanInput(input);
                const result: any = {
                    name: cleaned.name || input.name
                };

                if (cleaned.inputType) {
                    switch (cleaned.inputType.case) {
                        case 'kubernetes':
                            result.kubernetes = cleaned.inputType.value;
                            break;
                        case 'file':
                            result.file = cleaned.inputType.value;
                            break;
                        case 'http':
                            result.http = cleaned.inputType.value;
                            break;
                        default:
                            console.warn(`Unknown input type: ${cleaned.inputType.case}`);
                            // Fallback to kubernetes for backward compatibility
                            result.kubernetes = {
                                group: "",
                                version: "v1",
                                resource: "pods",
                                namespace: "",
                                listAll: true
                            };
                    }
                } else if (cleaned.kubernetes) {
                    // Handle legacy format
                    result.kubernetes = cleaned.kubernetes;
                } else {
                    // Default fallback
                    console.warn(`Input ${cleaned.name} has no valid inputType, using default kubernetes config`);
                    result.kubernetes = {
                        group: "",
                        version: "v1",
                        resource: "pods",
                        namespace: "",
                        listAll: true
                    };
                }

                return result;
            });

            // Validate using the CEL validation service
            const response = await client.validateCEL({
                expression: editedRule.expression,
                inputs: inputs,
                testCases: formattedTestCases,
            });

            // Convert response to TestCaseResult format properly
            const results: TestCaseResult[] = [];
            for (let idx = 0; idx < response.results.length; idx++) {
                const result = response.results[idx];
                const tc = testCases[idx];

                const testResult = create(TestCaseResultSchema, {
                    testCaseId: tc?.id || `tc-${idx}`,
                    testCaseName: tc?.name || result.testCase,
                    passed: result.passed,
                    error: result.error || '',
                    actualResult: result.details || '',
                    durationMs: BigInt(0),
                });

                results.push(testResult);
            }

            setValidationResults(results);
        } catch (error) {
            console.error('Validation failed:', error);
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <Card className="w-full h-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
                <CardHeader className="flex-shrink-0 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CardTitle className="text-lg sm:text-xl">
                                {rule.id ? 'Edit Rule' : 'Create New Rule'}
                            </CardTitle>
                            {hasUnsavedChanges && (
                                <div className="flex items-center gap-2 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                    Draft - Not Saved
                                </div>
                            )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={onCancel}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>

                {/* Tab Navigation */}
                <div className="border-b px-6 flex-shrink-0">
                    <div className="flex space-x-6">
                        <Button
                            variant="ghost"
                            className={`px-0 py-3 border-b-2 rounded-none h-auto ${
                                activeTab === 'editor'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                            onClick={() => setActiveTab('editor')}
                        >
                            Rule Editor
                        </Button>

                        <Button
                            variant="ghost"
                            className={`px-0 py-3 border-b-2 rounded-none h-auto ${
                                activeTab === 'test'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                            onClick={() => setActiveTab('test')}
                        >
                            Test Cases
                        </Button>
                    </div>
                </div>

                <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full p-6">
                        {activeTab === 'editor' ? (
                            <RuleEditorForm
                                editedRule={editedRule}
                                setEditedRule={setEditedRule}
                                onValidate={validateRule}
                                isValidating={isValidating}
                                validationResults={validationResults}
                            />
                        ) : (
                            <TestCasesEditor
                                testCases={testCases}
                                setTestCases={setTestCases}
                            />
                        )}
                    </ScrollArea>
                </CardContent>

                {/* Footer */}
                <div className="border-t px-6 py-4 flex-shrink-0">
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                        <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="w-full sm:w-auto">
                            Save Rule
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

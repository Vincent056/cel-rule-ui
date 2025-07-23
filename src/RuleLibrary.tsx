import { useState, useEffect } from 'react';
import { createClient } from '@connectrpc/connect';
import { create } from '@bufbuild/protobuf';
import { CELValidationService } from './gen/cel/v1/cel_pb';
import type {
    CELRule,
    RuleTestCase,
    TestCaseResult,
    ImportOptions,
    KubernetesInput,
    FileInput,
    HttpInput,
} from './gen/cel/v1/cel_pb';
import {
    ExportFormat,
    ImportFormat,
    ListRulesRequestSchema,
    SaveRuleRequestSchema,
    TestCaseResultSchema,
} from './gen/cel/v1/cel_pb';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Input } from './components/ui/input';
import { ScrollArea } from './components/ui/scroll-area';
import { Separator } from './components/ui/separator';
import { Search, Plus, Download, Upload, CheckCircle, AlertCircle, TestTube } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './components/ui/select';
import { CELExpressionDisplay } from './components/RuleLibrary/CELExpressionDisplay';
import { TestCaseDisplay } from './components/RuleLibrary/TestCaseDisplay';
import { RuleEditor } from './components/RuleLibrary/RuleEditor';
import { ImportDialog } from './components/RuleLibrary/ImportDialog';
import { ExportDialog } from './components/RuleLibrary/ExportDialog';
import { createNewRule } from './components/RuleLibrary/utils/ruleUtils';

interface RuleLibraryProps {
    transport: any;
}

// Helper function to check if all test cases are passing
const hasAllTestCasesPassing = (rule: CELRule): boolean => {
    if (!rule.testCases || rule.testCases.length === 0) {
        return false;
    }
    return rule.testCases.every(testCase => testCase.isPassing);
};

export function RuleLibrary({ transport }: RuleLibraryProps) {
    const client = createClient(CELValidationService, transport);

    const [rules, setRules] = useState<CELRule[]>([]);
    const [selectedRule, setSelectedRule] = useState<CELRule | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [editingRule, setEditingRule] = useState<CELRule | null>(null);
    const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
    const [showMobileRuleList, setShowMobileRuleList] = useState(false);

    // Load rules on mount
    useEffect(() => {
        loadRules();
    }, [searchText, filterCategory, filterSeverity]);

    const loadRules = async () => {
        setIsLoading(true);
        try {
            const request = create(ListRulesRequestSchema, {
                pageSize: 100,
                filter: {
                    searchText,
                    category: filterCategory === 'all' ? '' : filterCategory,
                    severity: filterSeverity === 'all' ? '' : filterSeverity,
                },
            });

            const response = await client.listRules(request);
            setRules(response.rules);
        } catch (error) {
            console.error('Failed to load rules:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveRule = async (rule: CELRule) => {
        try {
            const request = create(SaveRuleRequestSchema, {
                rule,
                validateBeforeSave: true,
                runTestCases: true,
            });

            const response = await client.saveRule(request);
            if (response.success) {
                await loadRules();
                setEditingRule(null);
                setTestResults(response.testResults);
                
                // Update selectedRule to reflect the changes immediately
                if (selectedRule && selectedRule.id === rule.id) {
                    setSelectedRule(rule);
                }
            } else {
                alert(`Failed to save rule: \{response.error}`);
            }
        } catch (error) {
            console.error('Failed to save rule:', error);
            alert('Failed to save rule');
        }
    };

    const exportRules = async (format: ExportFormat, ruleIds?: string[]) => {
        try {
            const response = await client.exportRules({
                ruleIds: ruleIds || [],
                format,
                includeTestCases: true,
                includeMetadata: true,
            });

            if (response.success) {
                // Download the exported data
                const blob = new Blob([response.data], { type: response.contentType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cel-rules.\{format === ExportFormat.JSON ? 'json' : 'yaml'}`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                alert(`Export failed: \{response.error}`);
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed');
        }
    };

    const importRules = async (file: File, options: ImportOptions) => {
        try {
            const data = await file.arrayBuffer();
            const format = file.name.endsWith('.json')
                ? ImportFormat.JSON
                : ImportFormat.YAML;

            const response = await client.importRules({
                data: new Uint8Array(data),
                format,
                options,
            });

            if (response.success || response.importedCount > 0) {
                alert(`Import complete: \{response.importedCount} imported, \{response.skippedCount} skipped, \{response.failedCount} failed`);
                await loadRules();
            } else {
                alert(`Import failed: \{response.error}`);
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert('Import failed');
        }
    };

    const deleteRule = async (ruleId: string) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;

        try {
            const response = await client.deleteRule({ ruleId });
            if (response.success) {
                await loadRules();
                if (selectedRule?.id === ruleId) {
                    setSelectedRule(null);
                }
            } else {
                alert(`Failed to delete rule: \{response.error}`);
            }
        } catch (error) {
            console.error('Failed to delete rule:', error);
            alert('Failed to delete rule');
        }
    };

    const validateRule = async (rule: CELRule) => {
        try {
            console.log('Validating rule:', rule);
            console.log('Test cases:', rule.testCases);

            // Check if we have test cases
            if (!rule.testCases || rule.testCases.length === 0) {
                console.error('No test cases found for rule');
                alert('This rule has no test cases to validate. Please edit the rule and add test cases.');
                return false;
            }

            // Check if test cases have test data
            const testCasesWithData = rule.testCases.filter(tc =>
                tc.testData && Object.keys(tc.testData).length > 0
            );

            if (testCasesWithData.length === 0) {
                console.error('No test cases have test data');
                alert('This rule has test cases but no test data. Please edit the rule and add test data to the test cases in the "Test Cases" tab.');
                return false;
            }

            // Convert rule test cases to the format expected by validateCEL
            const formattedTestCases = rule.testCases.map(tc => {
                console.log('Processing test case:', tc);
                console.log('Test data:', tc.testData);

                // Convert testData to inputs format
                const testData: Record<string, string> = {};

                // Check if testData exists and has content
                if (!tc.testData || Object.keys(tc.testData).length === 0) {
                    console.warn(`Test case ${tc.name} has no test data`);
                } else {
                    for (const [key, value] of Object.entries(tc.testData)) {
                        // Check if value is already a string (from textarea input)
                        if (typeof value === 'string') {
                            // It's already a JSON string, use it directly
                            testData[key] = value;
                        } else {
                            // It's an object, stringify it
                            testData[key] = JSON.stringify(value);
                        }
                    }
                }

                const formattedTestCase: RuleTestCase = {
                    $typeName: 'cel.v1.RuleTestCase',
                    name: tc.name,
                    id: tc.id,
                    description: tc.description || tc.name || 'Test case',
                    testData: testData,
                    expectedResult: tc.expectedResult,
                    expectedMessage: tc.expectedMessage,
                    isPassing: tc.isPassing,
                    actualResult: tc.actualResult,
                };

                console.log('Formatted test case:', formattedTestCase);
                return formattedTestCase;
            });

            // Check if any test cases have testData
            const hasAnyTestCases = formattedTestCases.some(tc => Object.keys(tc.testData).length > 0);
            if (!hasAnyTestCases) {
                console.error('No test cases have any test data');
                alert('None of the test cases have test data. Please add test data to the test cases.');
                return false;
            }

            // Clean the testData to remove $typeName
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

            // Format inputs properly
            const inputs = rule.inputs.map((input) => {
                const cleaned = cleanInput(input);

                let formattedInput;
                if (cleaned.inputType && cleaned.inputType.case === 'kubernetes' && cleaned.inputType.value) {
                    // Already has the correct structure
                    formattedInput = cleaned;
                } else if (cleaned.kubernetes) {
                    // Has old structure with kubernetes field
                    formattedInput = {
                        name: cleaned.name,
                        inputType: {
                            case: "kubernetes" as const,
                            value: cleaned.kubernetes
                        }
                    };
                } else {
                    // Check if it's a kubernetes input
                    const cleanedKubernetes = cleaned.kubernetes ? cleanInput(cleaned.kubernetes) : null;
                    formattedInput = {
                        name: cleaned.name || input.name,
                        inputType: {
                            case: "kubernetes" as const,
                            value: cleanedKubernetes || {
                                group: "",
                                version: "v1",
                                resource: cleaned.name || input.name,
                                namespace: "",
                                listAll: true
                            }
                        }
                    };
                }

                console.log('Formatted input:', formattedInput);
                return formattedInput;
            });

            const validationRequest = {
                expression: rule.expression,
                inputs: inputs,
                testCases: formattedTestCases,
            };

            console.log('Sending validation request:', JSON.stringify(validationRequest, null, 2));

            // Use validateCEL
            const response = await client.validateCEL(validationRequest);

            // Convert validation results to TestCaseResult format
            const testResults: TestCaseResult[] = [];
            for (let idx = 0; idx < response.results.length; idx++) {
                const result = response.results[idx];
                const tc = rule.testCases[idx];

                const testResult = create(TestCaseResultSchema, {
                    testCaseId: tc?.id || `tc-${idx}`,
                    testCaseName: tc?.name || result.testCase,
                    passed: result.passed,
                    error: result.error || '',
                    actualResult: result.details || '',
                    durationMs: BigInt(0),
                });

                testResults.push(testResult);
            }

            setTestResults(testResults);
            return response.success;
        } catch (error) {
            console.error('Validation failed:', error);
            return false;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        {/* <h2 className="text-xl sm:text-2xl font-bold text-gray-900">CEL Rule Library</h2> */}
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage and organize your compliance rules</p>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <Button onClick={() => setEditingRule(createNewRule())} className="gap-2 flex-1 sm:flex-initial" size="sm">
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">New Rule</span>
                        </Button>
                        <Button variant="outline" onClick={() => setShowImportDialog(true)} className="gap-2 flex-1 sm:flex-initial" size="sm">
                            <Upload className="h-4 w-4" />
                            <span className="hidden sm:inline">Import</span>
                        </Button>
                        <Button variant="outline" onClick={() => setShowExportDialog(true)} className="gap-2 flex-1 sm:flex-initial" size="sm">
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Export</span>
                        </Button>
                    </div>
                </div>
            </div>


            {/* Filters Bar */}
            <div className="bg-white border-b px-4 sm:px-6 py-3">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search rules..."
                            value={searchText}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>
                    <div className="flex gap-2 sm:gap-4">
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="flex-1 sm:w-[180px]">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="security">Security</SelectItem>
                                <SelectItem value="compliance">Compliance</SelectItem>
                                <SelectItem value="best-practices">Best Practices</SelectItem>
                                <SelectItem value="performance">Performance</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                            <SelectTrigger className="flex-1 sm:w-[150px]">
                                <SelectValue placeholder="All Severities" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Severities</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile Menu Button */}
                <Button
                    className="md:hidden fixed bottom-4 right-4 z-20 rounded-full shadow-lg"
                    size="icon"
                    onClick={() => setShowMobileRuleList(!showMobileRuleList)}
                >
                    <Search className="h-5 w-5" />
                </Button>

                {/* Rule List */}
                <div className={`
                    absolute md:relative inset-y-0 left-0 z-10
                    w-full sm:w-80 md:w-96 bg-white border-r
                    transform transition-transform duration-300 ease-in-out
                    {showMobileRuleList ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}>
                    <ScrollArea className="h-full overflow-y-auto overflow-x-hidden">
                        <div className="p-4 space-y-3">
                            {isLoading ? (
                                <div className="text-center py-8 text-gray-500">Loading rules...</div>
                            ) : rules.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No rules found</p>
                                    <p className="text-sm mt-2">Try adjusting your filters or create a new rule</p>
                                </div>
                            ) : (
                                rules.map((rule) => (
                                    <Card
                                        key={rule.id}
                                        className={`cursor-pointer transition-all hover:shadow-md {selectedRule?.id === rule.id
                                            ? 'ring-2 ring-blue-500 shadow-md'
                                            : ''
                                            }`}
                                        onClick={() => {
                                            setSelectedRule(rule);
                                            setShowMobileRuleList(false);
                                        }}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <CardTitle className="text-base font-semibold line-clamp-2 flex-1">
                                                    {rule.name}
                                                </CardTitle>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {hasAllTestCasesPassing(rule) && (
                                                        <div title="All test cases passing">
                                                            <TestTube className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                    )}
                                                    {rule.isVerified && (
                                                        <div title="Verified rule">
                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <CardDescription className="line-clamp-2 text-sm mt-1">
                                                {rule.description}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    {rule.category}
                                                </Badge>
                                                <Badge
                                                    variant={
                                                        rule.severity === 'critical' ? 'destructive' :
                                                            rule.severity === 'high' ? 'destructive' :
                                                                rule.severity === 'medium' ? 'default' : 'secondary'
                                                    }
                                                    className="text-xs"
                                                >
                                                    {rule.severity}
                                                </Badge>
                                                {rule.tags.slice(0, 2).map(tag => (
                                                    <Badge key={tag} variant="outline" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {rule.tags.length > 2 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{rule.tags.length - 2}
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Overlay for mobile */}
                {showMobileRuleList && (
                    <div
                        className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-[5]"
                        onClick={() => setShowMobileRuleList(false)}
                    />
                )}


                {/* Rule Details */}
                <div className="flex-1 bg-gray-50 min-w-0 overflow-hidden">
                    {selectedRule ? (
                        <ScrollArea className="h-full">
                            <div className="p-4 sm:p-6 max-w-full min-w-0">
                                {/* Actions Bar */}
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 min-w-0">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{selectedRule.name}</h3>
                                        <p className="text-gray-600 mt-2 text-sm sm:text-base break-words">{selectedRule.description}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                        <Button variant="outline" size="sm" onClick={() => setEditingRule(selectedRule)} className="flex-1 sm:flex-initial">
                                            Edit
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => validateRule(selectedRule)} className="flex-1 sm:flex-initial">
                                             Validate
                                         </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => deleteRule(selectedRule.id)}
                                            className="flex-1 sm:flex-initial"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div className="flex flex-wrap gap-3 mb-6">
                                    <Badge variant="secondary">{selectedRule.category}</Badge>
                                    <Badge
                                        variant={
                                            selectedRule.severity === 'critical' ? 'destructive' :
                                                selectedRule.severity === 'high' ? 'destructive' :
                                                    selectedRule.severity === 'medium' ? 'default' : 'secondary'
                                        }
                                    >
                                        {selectedRule.severity}
                                    </Badge>
                                    {selectedRule.isVerified && (
                                        <Badge variant="outline" className="text-green-700 border-green-300">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Verified
                                        </Badge>
                                    )}
                                    {selectedRule.tags.map(tag => (
                                        <Badge key={tag} variant="outline">{tag}</Badge>
                                    ))}
                                </div>

                                {/* Rule Metadata */}
                                <Card className="mb-6 bg-slate-50">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base text-slate-700">Rule Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div className="space-y-1">
                                                <span className="text-slate-600 font-medium">Rule ID:</span>
                                                <div className="font-mono text-xs bg-white px-2 py-1 rounded border break-all">
                                                    {selectedRule.id || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-slate-600 font-medium">Created:</span>
                                                <div className="text-slate-700">
                                                    {selectedRule.createdAt ? 
                                                        new Date(Number(selectedRule.createdAt)).toLocaleString() : 
                                                        'N/A'
                                                    }
                                                </div>
                                                {selectedRule.createdBy && (
                                                    <div className="text-xs text-slate-500">
                                                        by {selectedRule.createdBy}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-slate-600 font-medium">Last Modified:</span>
                                                <div className="text-slate-700">
                                                    {selectedRule.updatedAt ? 
                                                        new Date(Number(selectedRule.updatedAt)).toLocaleString() : 
                                                        'N/A'
                                                    }
                                                </div>
                                                {selectedRule.lastModifiedBy && (
                                                    <div className="text-xs text-slate-500">
                                                        by {selectedRule.lastModifiedBy}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Separator className="mb-6" />

                                {/* CEL Expression */}
                                <Card className="mb-6">
                                    <CardHeader>
                                        <CardTitle className="text-lg">CEL Expression</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CELExpressionDisplay expression={selectedRule.expression} />
                                    </CardContent>
                                </Card>

                                {/* Inputs */}
                                <Card className="mb-6">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Inputs</CardTitle>
                                        <CardDescription>Required data sources for this rule</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {selectedRule.inputs.map((input, idx) => (
                                                <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-gray-900">{input.name}</h4>
                                                        </div>
                                                        <Badge variant="outline" className="ml-2">
                                                            {input.inputType.case === 'kubernetes' ? 'Kubernetes' :
                                                                input.inputType.case === 'file' ? 'File' :
                                                                    input.inputType.case === 'http' ? 'HTTP' : 'Unknown'}
                                                        </Badge>
                                                    </div>
                                                    
                                                    {/* Kubernetes Input Details */}
                                                    {input.inputType.case === 'kubernetes' && input.inputType.value && (
                                                        <div className="mt-2 space-y-2 text-sm bg-blue-50 p-3 rounded border-l-4 border-blue-200">
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                                                <div className="flex items-center text-gray-700">
                                                                    <span className="font-medium mr-2 text-blue-700">Resource:</span>
                                                                    <code className="bg-white px-2 py-1 rounded text-xs border">
                                                                        {(input.inputType.value as KubernetesInput).resource}
                                                                    </code>
                                                                </div>
                                                                <div className="flex items-center text-gray-700">
                                                                    <span className="font-medium mr-2 text-blue-700">Version:</span>
                                                                    <code className="bg-white px-2 py-1 rounded text-xs border">
                                                                        {(input.inputType.value as KubernetesInput).version || 'v1'}
                                                                    </code>
                                                                </div>
                                                                {(input.inputType.value as KubernetesInput).group && (
                                                                    <div className="flex items-center text-gray-700">
                                                                        <span className="font-medium mr-2 text-blue-700">API Group:</span>
                                                                        <code className="bg-white px-2 py-1 rounded text-xs border">
                                                                            {(input.inputType.value as KubernetesInput).group}
                                                                        </code>
                                                                    </div>
                                                                )}
                                                                {(input.inputType.value as KubernetesInput).namespace && (
                                                                    <div className="flex items-center text-gray-700">
                                                                        <span className="font-medium mr-2 text-blue-700">Namespace:</span>
                                                                        <code className="bg-white px-2 py-1 rounded text-xs border">
                                                                            {(input.inputType.value as KubernetesInput).namespace}
                                                                        </code>
                                                                    </div>
                                                                )}
                                                                {(input.inputType.value as KubernetesInput).resourceName && (
                                                                    <div className="flex items-center text-gray-700">
                                                                        <span className="font-medium mr-2 text-blue-700">Resource Name:</span>
                                                                        <code className="bg-white px-2 py-1 rounded text-xs border">
                                                                            {(input.inputType.value as KubernetesInput).resourceName}
                                                                        </code>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center text-gray-700">
                                                                    <span className="font-medium mr-2 text-blue-700">List All:</span>
                                                                    <Badge variant={(input.inputType.value as KubernetesInput).listAll ? "default" : "secondary"} className="text-xs">
                                                                        {(input.inputType.value as KubernetesInput).listAll ? 'Yes' : 'No'}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* File Input Details */}
                                                    {input.inputType.case === 'file' && input.inputType.value && (
                                                        <div className="mt-2 space-y-2 text-sm bg-green-50 p-3 rounded border-l-4 border-green-200">
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                                                <div className="flex flex-col text-gray-700 lg:col-span-2">
                                                                    <span className="font-medium mb-1 text-green-700">File Path:</span>
                                                                    <code className="bg-white px-2 py-1 rounded text-xs border break-all">
                                                                        {(input.inputType.value as FileInput).path || '/path/to/file'}
                                                                    </code>
                                                                </div>
                                                                <div className="flex items-center text-gray-700">
                                                                    <span className="font-medium mr-2 text-green-700">Format:</span>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {(input.inputType.value as FileInput).format?.toUpperCase() || 'JSON'}
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex items-center text-gray-700">
                                                                    <span className="font-medium mr-2 text-green-700">Access Mode:</span>
                                                                    <code className="bg-white px-2 py-1 rounded text-xs border">
                                                                        {(input.inputType.value as FileInput).accessMode || 0}
                                                                    </code>
                                                                </div>
                                                                <div className="flex items-center text-gray-700">
                                                                    <span className="font-medium mr-2 text-green-700">Recursive:</span>
                                                                    <Badge variant={(input.inputType.value as FileInput).recursive ? "default" : "secondary"} className="text-xs">
                                                                        {(input.inputType.value as FileInput).recursive ? 'Yes' : 'No'}
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex items-center text-gray-700">
                                                                    <span className="font-medium mr-2 text-green-700">Check Permissions:</span>
                                                                    <Badge variant={(input.inputType.value as FileInput).checkPermissions ? "default" : "secondary"} className="text-xs">
                                                                        {(input.inputType.value as FileInput).checkPermissions ? 'Yes' : 'No'}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* HTTP Input Details */}
                                                    {input.inputType.case === 'http' && input.inputType.value && (
                                                        <div className="mt-2 space-y-2 text-sm bg-purple-50 p-3 rounded border-l-4 border-purple-200">
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                                                <div className="flex flex-col text-gray-700 lg:col-span-2">
                                                                    <span className="font-medium mb-1 text-purple-700">URL:</span>
                                                                    <code className="bg-white px-2 py-1 rounded text-xs border break-all word-break">
                                                                        {(input.inputType.value as HttpInput).url || 'https://api.example.com'}
                                                                    </code>
                                                                </div>
                                                                <div className="flex items-center text-gray-700">
                                                                    <span className="font-medium mr-2 text-purple-700">Method:</span>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {(input.inputType.value as HttpInput).method || 'GET'}
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex items-center text-gray-700">
                                                                    <span className="font-medium mr-2 text-purple-700">Headers:</span>
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {Object.keys((input.inputType.value as HttpInput).headers || {}).length} headers
                                                                    </Badge>
                                                                </div>
                                                                {(input.inputType.value as HttpInput).body && (
                                                                    <div className="flex flex-col text-gray-700 sm:col-span-2">
                                                                        <span className="font-medium mb-1 text-purple-700">Request Body:</span>
                                                                        <code className="bg-white px-2 py-1 rounded text-xs border max-h-20 overflow-y-auto">
                                                                            {(input.inputType.value as HttpInput).body}
                                                                        </code>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Unknown Input Type */}
                                                    {!input.inputType.case && (
                                                        <div className="mt-2 text-sm text-gray-500 italic">
                                                            No configuration details available
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Test Cases */}
                                {selectedRule.testCases.length > 0 && (
                                    <Card className="mb-6">
                                        <CardHeader>
                                            <CardTitle className="text-lg">
                                                Test Cases ({selectedRule.testCases.length})
                                            </CardTitle>
                                            <CardDescription>Predefined test scenarios for rule validation</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {selectedRule.testCases.map((testCase, idx) => (
                                                    <TestCaseDisplay key={idx} testCase={testCase} />
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Test Results */}
                                {testResults.length > 0 && (
                                    <Card className="mb-6">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Validation Results</CardTitle>
                                            <CardDescription>Latest test execution results</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                {testResults.map((result, idx) => (
                                                    <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-gray-900">{result.testCaseName}</span>
                                                                    <span className="text-xs text-gray-500">({result.durationMs}ms)</span>
                                                                </div>
                                                                {!result.passed && result.error && (
                                                                    <p className="text-sm text-red-600 mt-1">{result.error}</p>
                                                                )}
                                                            </div>
                                                            <div className="ml-3">
                                                                {result.passed ? (
                                                                    <Badge variant="outline" className="text-green-700 border-green-300">
                                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                                        PASS
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="destructive">
                                                                        <AlertCircle className="h-3 w-3 mr-1" />
                                                                        FAIL
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Metadata */}
                                {selectedRule.metadata && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Metadata</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {selectedRule.metadata.complianceFramework && (
                                                    <div>
                                                        <span className="font-medium">Compliance Framework:</span>
                                                        <span className="ml-2 text-gray-600">{selectedRule.metadata.complianceFramework}</span>
                                                    </div>
                                                )}
                                                {selectedRule.metadata.remediation && (
                                                    <div>
                                                        <span className="font-medium">Remediation:</span>
                                                        <p className="mt-1 text-sm text-gray-600">{selectedRule.metadata.remediation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="flex items-center justify-center h-full p-4">
                            <div className="text-center">
                                <p className="text-gray-500 text-base sm:text-lg mb-4">Select a rule to view details</p>
                                <Button onClick={() => setEditingRule(createNewRule())} className="inline-flex">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create New Rule
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Rule Dialog */}
            {editingRule && (
                <RuleEditor
                    rule={editingRule}
                    onSave={saveRule}
                    onCancel={() => setEditingRule(null)}
                    transport={transport}
                />
            )}

            {/* Import Dialog */}
            {showImportDialog && (
                <ImportDialog
                    onImport={(file, options) => {
                        importRules(file, options);
                        setShowImportDialog(false);
                    }}
                    onCancel={() => setShowImportDialog(false)}
                />
            )}

            {/* Export Dialog */}
            {showExportDialog && (
                <ExportDialog
                    onExport={(format, ruleIds) => {
                        exportRules(format, ruleIds);
                        setShowExportDialog(false);
                    }}
                    onCancel={() => setShowExportDialog(false)}
                    rules={rules}
                />
            )}
        </div>
    );
}

         




import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, Play, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useComplianceWorkflow } from '../hooks/use-compliance-workflow';
import { WorkflowProgress } from './WorkflowProgress';
import { cn } from '../lib/utils';

export function ComplianceWorkflowDemo() {
    const [requirement, setRequirement] = useState('');
    const [resourceType, setResourceType] = useState('pod');
    const [namespace, setNamespace] = useState('default');

    const {
        runWorkflow,
        reset,
        isRunning,
        progress,
        currentRule,
        testCases,
        finalRule
    } = useComplianceWorkflow();

    const handleRunWorkflow = () => {
        if (!requirement.trim()) return;

        runWorkflow(requirement, {
            resourceType,
            namespace,
            maxRetries: 3,
            generateTestCases: true,
            validateLive: false
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Compliance Rule Generator</h2>
                <p className="text-muted-foreground">
                    Enter a natural language requirement and let AI generate a validated CEL rule
                </p>
            </div>

            {/* Input Form */}
            <div className="bg-card border rounded-lg p-6 space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Requirement</label>
                    <Input
                        placeholder="e.g., Pods must have resource limits for CPU and memory"
                        value={requirement}
                        onChange={(e) => setRequirement(e.target.value)}
                        disabled={isRunning}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Resource Type</label>
                        <select
                            className="w-full px-3 py-2 border rounded-md"
                            value={resourceType}
                            onChange={(e) => setResourceType(e.target.value)}
                            disabled={isRunning}
                        >
                            <option value="pod">Pod</option>
                            <option value="deployment">Deployment</option>
                            <option value="service">Service</option>
                            <option value="configmap">ConfigMap</option>
                            <option value="secret">Secret</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Namespace</label>
                        <Input
                            placeholder="default"
                            value={namespace}
                            onChange={(e) => setNamespace(e.target.value)}
                            disabled={isRunning}
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={handleRunWorkflow}
                        disabled={isRunning || !requirement.trim()}
                    >
                        {isRunning ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Running...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 mr-2" />
                                Generate Rule
                            </>
                        )}
                    </Button>

                    {progress.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={reset}
                            disabled={isRunning}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            {/* Workflow Progress */}
            {progress.length > 0 && (
                <div className="bg-card border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Workflow Progress</h3>
                    <WorkflowProgress progress={progress} />
                </div>
            )}

            {/* Current Rule Display */}
            {currentRule && (
                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Generated Rule</h3>
                        {finalRule && (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm font-medium">Validated</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{currentRule.description}</p>
                        <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                            <code className="text-sm">{currentRule.expression}</code>
                        </pre>
                    </div>
                </div>
            )}

            {/* Test Cases */}
            {testCases.length > 0 && (
                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h3 className="text-lg font-semibold">Test Cases ({testCases.length})</h3>
                    <div className="space-y-2">
                        {testCases.map((testCase, index) => {
                            const result = progress.find(p => p.step === 'verification')?.result;
                            const testResult = result?.results?.[index];

                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        "p-3 rounded-md border",
                                        testResult && (testResult.passed ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-red-500 bg-red-50 dark:bg-red-950")
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">{testCase.description}</p>
                                        {testResult && (
                                            <div className="flex items-center gap-2">
                                                {testResult.passed ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                        <span className="text-sm text-green-600">Passed</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                                        <span className="text-sm text-red-600">Failed</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Expected: {testCase.expectedResult ? 'Pass' : 'Fail'}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Final Success Message */}
            {finalRule && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-500 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-2">
                            <h4 className="font-semibold text-green-900 dark:text-green-100">
                                Rule Successfully Generated and Validated!
                            </h4>
                            <p className="text-sm text-green-700 dark:text-green-300">
                                The CEL rule has been generated from your requirement and all test cases are passing.
                                You can now use this rule in your Kubernetes compliance policies.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 
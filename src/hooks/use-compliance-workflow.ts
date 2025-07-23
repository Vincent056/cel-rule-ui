import { useState, useCallback, useRef, useEffect } from 'react';
import { ComplianceMCPClient } from '../lib/mcp-client';
import { ComplianceAgentAPI } from '../lib/agent-api';
import type { WorkflowStep as APIWorkflowStep } from '../lib/agent-api';

export interface WorkflowOptions {
    resourceType: string;
    namespace?: string;
    maxRetries?: number;
    generateTestCases?: boolean;
    validateLive?: boolean;
}

export interface WorkflowStep {
    id: string;
    step: 'generate' | 'test_generation' | 'verification' | 'correction' | 'live_validation';
    status: 'pending' | 'running' | 'complete' | 'failed';
    title: string;
    result?: any;
    error?: string;
    timestamp: number;
}

export interface GeneratedRule {
    expression: string;
    description: string;
    resourceType: string;
    inputs?: any[];
}

export interface TestCase {
    description: string;
    input: any;
    expectedResult: boolean;
}

function createStep(
    step: WorkflowStep['step'],
    status: WorkflowStep['status'],
    title: string,
    result?: any,
    error?: string
): WorkflowStep {
    return {
        id: `${step}-${Date.now()}`,
        step,
        status,
        title,
        result,
        error,
        timestamp: Date.now()
    };
}

// Helper functions for MCP-only mode (without LangChain)
function generateSimpleCELExpression(requirement: string, resourceType: string): string {
    const req = requirement.toLowerCase();
    const type = resourceType.toLowerCase();

    // Simple pattern matching for common requirements
    if (req.includes('resource limit') || req.includes('resource limits')) {
        if (type === 'pod') {
            return 'resource.spec.containers.all(c, has(c.resources) && has(c.resources.limits))';
        } else if (type === 'deployment') {
            return 'resource.spec.template.spec.containers.all(c, has(c.resources) && has(c.resources.limits))';
        }
    }

    if (req.includes('label') && req.includes('required')) {
        return 'has(resource.metadata.labels) && resource.metadata.labels.size() > 0';
    }

    if (req.includes('replica') && type === 'deployment') {
        return 'resource.spec.replicas >= 2';
    }

    if (req.includes('security context')) {
        if (type === 'pod') {
            return 'has(resource.spec.securityContext) && resource.spec.securityContext.runAsNonRoot == true';
        }
    }

    // Default: check for name
    return 'has(resource.metadata.name)';
}

function generateSimpleTestCases(expression: string, resourceType: string): TestCase[] {
    // Generate basic test cases based on expression patterns
    const testCases: TestCase[] = [];

    if (expression.includes('resources.limits')) {
        testCases.push({
            description: `${resourceType} with resource limits should pass`,
            input: {
                apiVersion: 'v1',
                kind: resourceType,
                metadata: { name: 'test-with-limits' },
                spec: resourceType === 'deployment' ? {
                    template: {
                        spec: {
                            containers: [{
                                name: 'app',
                                image: 'nginx',
                                resources: { limits: { cpu: '100m', memory: '128Mi' } }
                            }]
                        }
                    }
                } : {
                    containers: [{
                        name: 'app',
                        image: 'nginx',
                        resources: { limits: { cpu: '100m', memory: '128Mi' } }
                    }]
                }
            },
            expectedResult: true
        });

        testCases.push({
            description: `${resourceType} without resource limits should fail`,
            input: {
                apiVersion: 'v1',
                kind: resourceType,
                metadata: { name: 'test-without-limits' },
                spec: resourceType === 'deployment' ? {
                    template: {
                        spec: {
                            containers: [{ name: 'app', image: 'nginx' }]
                        }
                    }
                } : {
                    containers: [{ name: 'app', image: 'nginx' }]
                }
            },
            expectedResult: false
        });
    } else {
        // Generic test cases
        testCases.push({
            description: `Valid ${resourceType} should pass`,
            input: {
                apiVersion: 'v1',
                kind: resourceType,
                metadata: { name: 'test-resource', labels: { app: 'test' } },
                spec: {}
            },
            expectedResult: true
        });
    }

    return testCases;
}

export function useComplianceWorkflow() {
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState<WorkflowStep[]>([]);
    const [currentRule, setCurrentRule] = useState<GeneratedRule | null>(null);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [finalRule, setFinalRule] = useState<GeneratedRule | null>(null);
    const [useLangChain, setUseLangChain] = useState(true); // Toggle between LangChain API and MCP-only

    const apiClient = useRef<ComplianceAgentAPI>(new ComplianceAgentAPI());
    const mcpClient = useRef<ComplianceMCPClient>(new ComplianceMCPClient());
    const eventSourceRef = useRef<EventSource | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // Check if LangChain API is available
    useEffect(() => {
        apiClient.current.checkHealth().then(healthy => {
            if (!healthy) {
                console.warn('LangChain API not available, falling back to MCP-only mode');
                setUseLangChain(false);
            }
        });
    }, []);

    const updateStep = useCallback((stepType: WorkflowStep['step'], update: Partial<WorkflowStep>) => {
        setProgress(prev => prev.map(step =>
            step.step === stepType ? { ...step, ...update } : step
        ));
    }, []);

    const addStep = useCallback((step: WorkflowStep) => {
        setProgress(prev => [...prev, step]);
    }, []);

    const runWorkflow = useCallback(async (requirement: string, options: WorkflowOptions) => {
        setIsRunning(true);
        setProgress([]);
        setCurrentRule(null);
        setTestCases([]);
        setFinalRule(null);

        // Clean up previous connections
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        if (wsRef.current) {
            wsRef.current.close();
        }

        try {
            if (useLangChain) {
                // Use LangChain API with real-time updates
                const response = await apiClient.current.startWorkflow(requirement, options.resourceType, {
                    namespace: options.namespace,
                    maxRetries: options.maxRetries,
                    generateTestCases: options.generateTestCases,
                    validateLive: options.validateLive
                });

                // Track workflow progress using EventSource
                eventSourceRef.current = apiClient.current.streamWorkflowUpdates(
                    response.workflowId,
                    (step: APIWorkflowStep) => {
                        // Convert API step to our WorkflowStep format
                        const workflowStep: WorkflowStep = {
                            ...step,
                            step: step.step as WorkflowStep['step']
                        };

                        // Update state based on step type
                        if (step.step === 'generate' && step.status === 'complete' && step.result) {
                            setCurrentRule(step.result);
                        } else if (step.step === 'test_generation' && step.status === 'complete' && step.result?.cases) {
                            setTestCases(step.result.cases);
                        } else if (step.step === 'correction' && step.status === 'complete' && step.result) {
                            setCurrentRule(step.result);
                        } else if (step.step === 'verification' && step.status === 'complete') {
                            const allPassed = step.result?.results?.every((r: any) => r.passed);
                            if (allPassed) {
                                setFinalRule(currentRule);
                            }
                        }

                        // Update or add step
                        setProgress(prev => {
                            const existing = prev.find(s => s.id === step.id);
                            if (existing) {
                                return prev.map(s => s.id === step.id ? workflowStep : s);
                            } else {
                                return [...prev, workflowStep];
                            }
                        });
                    },
                    () => {
                        // Workflow completed
                        setIsRunning(false);
                    }
                );
            } else {
                // Fallback: Use MCP client directly (without AI generation)
                await mcpClient.current.initialize();

                // Manual workflow without LangChain
                addStep(createStep('generate', 'running', 'Generating CEL rule (manual mode)'));

                // In MCP-only mode, use simple rule templates
                const rule: GeneratedRule = {
                    expression: generateSimpleCELExpression(requirement, options.resourceType),
                    description: requirement,
                    resourceType: options.resourceType,
                    inputs: [{
                        name: 'resource',
                        type: options.resourceType.toLowerCase()
                    }]
                };

                setCurrentRule(rule);
                updateStep('generate', { status: 'complete', result: rule });

                // Generate simple test cases
                const testCases = generateSimpleTestCases(rule.expression, options.resourceType);
                setTestCases(testCases);

                // Verify with MCP
                const results = await mcpClient.current.verifyWithTests(rule.expression, testCases);

                updateStep('verification', {
                    status: results.results.every(r => r.passed) ? 'complete' : 'failed',
                    result: results
                });

                if (results.results.every(r => r.passed)) {
                    setFinalRule(rule);
                }
            }
        } catch (error) {
            console.error('Workflow error:', error);
            addStep(createStep('generate', 'failed', 'Workflow failed', undefined,
                error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            if (!useLangChain) {
                setIsRunning(false);
            }
        }
    }, [addStep, updateStep, useLangChain, currentRule]);

    const reset = useCallback(() => {
        setProgress([]);
        setCurrentRule(null);
        setTestCases([]);
        setFinalRule(null);
        setIsRunning(false);
    }, []);

    return {
        runWorkflow,
        reset,
        isRunning,
        progress,
        currentRule,
        testCases,
        finalRule
    };
} 
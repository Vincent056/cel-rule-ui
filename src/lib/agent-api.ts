/**
 * API Client for Compliance Agent FastAPI server
 */

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

export interface VerificationResult {
    testCase: string;
    passed: boolean;
    error?: string;
    details?: string;
}

export interface WorkflowStep {
    id: string;
    step: 'generate' | 'test_generation' | 'verification' | 'correction' | 'live_validation' | 'error';
    status: 'pending' | 'running' | 'complete' | 'failed';
    title: string;
    result?: any;
    error?: string;
    timestamp: number;
}

export interface WorkflowStartResponse {
    workflowId: string;
    status: string;
    websocketUrl: string;
}

export class ComplianceAgentAPI {
    private baseUrl: string;

    constructor(baseUrl = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
    }

    async generateRule(requirement: string, resourceType: string, namespace?: string): Promise<GeneratedRule> {
        const response = await fetch(`${this.baseUrl}/generate-rule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requirement,
                resource_type: resourceType,
                namespace
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to generate rule: ${response.statusText}`);
        }

        return response.json();
    }

    async generateTestCases(ruleExpression: string, resourceType: string, count = 3): Promise<{ testCases: TestCase[] }> {
        const response = await fetch(`${this.baseUrl}/generate-test-cases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rule_expression: ruleExpression,
                resource_type: resourceType,
                count
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to generate test cases: ${response.statusText}`);
        }

        return response.json();
    }

    async verifyRule(expression: string, testCases: TestCase[]): Promise<{
        success: boolean;
        results: VerificationResult[];
    }> {
        const response = await fetch(`${this.baseUrl}/verify-rule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                expression,
                test_cases: testCases
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to verify rule: ${response.statusText}`);
        }

        return response.json();
    }

    async startWorkflow(
        requirement: string,
        resourceType: string,
        options: {
            namespace?: string;
            maxRetries?: number;
            generateTestCases?: boolean;
            validateLive?: boolean;
        } = {}
    ): Promise<WorkflowStartResponse> {
        const response = await fetch(`${this.baseUrl}/workflow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requirement,
                resource_type: resourceType,
                namespace: options.namespace,
                max_retries: options.maxRetries || 3,
                generate_test_cases: options.generateTestCases !== false,
                validate_live: options.validateLive || false
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to start workflow: ${response.statusText}`);
        }

        return response.json();
    }

    async getWorkflowSteps(workflowId: string): Promise<{ steps: WorkflowStep[] }> {
        const response = await fetch(`${this.baseUrl}/workflow/${workflowId}/steps`);

        if (!response.ok) {
            throw new Error(`Failed to get workflow steps: ${response.statusText}`);
        }

        return response.json();
    }

    streamWorkflowUpdates(workflowId: string, onStep: (step: WorkflowStep) => void, onComplete: () => void): EventSource {
        const eventSource = new EventSource(`${this.baseUrl}/workflow/${workflowId}/stream`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'complete') {
                onComplete();
                eventSource.close();
            } else {
                onStep(data as WorkflowStep);
            }
        };

        eventSource.onerror = (error) => {
            console.error('EventSource error:', error);
            eventSource.close();
        };

        return eventSource;
    }

    connectWorkflowWebSocket(
        workflowId: string,
        onStep: (step: WorkflowStep) => void,
        onComplete: () => void,
        onError: (error: any) => void
    ): WebSocket {
        const ws = new WebSocket(`ws://localhost:8000/ws/workflow/${workflowId}`);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'complete') {
                onComplete();
                ws.close();
            } else {
                onStep(data as WorkflowStep);
            }
        };

        ws.onerror = (error) => {
            onError(error);
        };

        ws.onclose = () => {
            console.log('WebSocket closed');
        };

        return ws;
    }

    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            const data = await response.json();
            return data.status === 'healthy';
        } catch {
            return false;
        }
    }
} 
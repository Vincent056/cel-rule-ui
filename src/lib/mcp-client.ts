/**
 * MCP Client for streamable-http transport
 * Communicates with CEL RPC server's MCP endpoint
 */

interface MCPRequest {
    jsonrpc: '2.0';
    method: string;
    params?: any;
    id: string | number;
}

interface MCPResponse {
    jsonrpc: '2.0';
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
    id: string | number;
}

interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
}

export class MCPClient {
    private endpoint: string;

    private static resolveDefaultEndpoint(): string {
        // Prefer environment variable injected at build time (Vite)
        // Fallback to same-origin relative path, which works when the UI is served by the same domain/port as the backend or via reverse proxy.
        // Example: import.meta.env.VITE_CEL_RPC_ENDPOINT="http://cel-rpc-server:8349/mcp"
        const envEndpoint = (import.meta as any).env?.VITE_CEL_RPC_ENDPOINT as string | undefined;
        if (envEndpoint && envEndpoint.trim() !== "") {
            return envEndpoint;
        }
        // Default to relative path, letting the browser target the current host.
        return "/mcp";
    }
    private sessionId?: string;
    private requestId = 0;

    constructor(endpoint: string = MCPClient.resolveDefaultEndpoint()) {
        this.endpoint = endpoint;
    }

    private getNextId(): number {
        return ++this.requestId;
    }

    private async sendRequest(request: MCPRequest): Promise<MCPResponse> {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.sessionId && { 'X-Session-ID': this.sessionId })
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(`MCP Error: ${data.error.message}`);
        }

        return data;
    }

    async initialize(): Promise<void> {
        const request: MCPRequest = {
            jsonrpc: '2.0',
            method: 'initialize',
            params: {
                clientInfo: {
                    name: 'compliance-chat-ui',
                    version: '1.0.0'
                }
            },
            id: this.getNextId()
        };

        const response = await this.sendRequest(request);
        this.sessionId = response.result?.sessionId;
    }

    async listTools(): Promise<MCPTool[]> {
        const request: MCPRequest = {
            jsonrpc: '2.0',
            method: 'tools/list',
            id: this.getNextId()
        };

        const response = await this.sendRequest(request);
        return response.result?.tools || [];
    }

    async callTool(name: string, args: any): Promise<any> {
        const request: MCPRequest = {
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
                name,
                arguments: args
            },
            id: this.getNextId()
        };

        const response = await this.sendRequest(request);
        return response.result;
    }
}

// Specialized client for compliance operations
export class ComplianceMCPClient extends MCPClient {
    async verifyWithTests(expression: string, testCases: Array<{
        description: string;
        input: any;
        expectedResult: boolean;
    }>): Promise<{
        success: boolean;
        results: Array<{
            testCase: string;
            passed: boolean;
            error?: string;
            details?: string;
        }>;
    }> {
        return this.callTool('verify_cel_with_tests', {
            expression,
            test_cases: testCases
        });
    }

    async verifyLiveResources(
        expression: string,
        resourceType: string,
        namespace?: string
    ): Promise<{
        success: boolean;
        results: Array<{
            resourceName: string;
            passed: boolean;
            error?: string;
        }>;
    }> {
        return this.callTool('verify_cel_live_resources', {
            expression,
            resource_type: resourceType,
            namespace
        });
    }

    async discoverResourceTypes(namespace?: string): Promise<{
        resourceTypes: Array<{
            apiVersion: string;
            kind: string;
            count: number;
        }>;
    }> {
        return this.callTool('discover_resource_types', {
            namespace,
            fast_mode: true
        });
    }

    async countResources(
        resourceTypes: Array<{ apiVersion: string; kind: string }>,
        namespace?: string
    ): Promise<{
        counts: Array<{
            apiVersion: string;
            kind: string;
            count: number;
        }>;
    }> {
        return this.callTool('count_resources', {
            resource_types: resourceTypes,
            namespace
        });
    }

    async getResourceSamples(
        resourceType: { apiVersion: string; kind: string },
        namespace?: string,
        count: number = 3
    ): Promise<{
        samples: Array<{
            name: string;
            namespace?: string;
            metadata: any;
            spec?: any;
        }>;
    }> {
        return this.callTool('get_resource_samples', {
            resource_type: resourceType,
            namespace,
            count
        });
    }
}

// React hook for using MCP client
import { useState, useEffect, useRef } from 'react';

export function useMCPClient(endpoint?: string) {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const clientRef = useRef<ComplianceMCPClient | null>(null);

    useEffect(() => {
        const client = new ComplianceMCPClient(endpoint);
        clientRef.current = client;

        client.initialize()
            .then(() => {
                setIsConnected(true);
                setError(null);
            })
            .catch(err => {
                setError(err.message);
                setIsConnected(false);
            });

        return () => {
            clientRef.current = null;
        };
    }, [endpoint]);

    return {
        client: clientRef.current,
        isConnected,
        error
    };
} 
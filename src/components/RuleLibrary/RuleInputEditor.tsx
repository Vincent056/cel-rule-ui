import { useState, useEffect } from 'react';
import { create } from '@bufbuild/protobuf';
import { 
    CELRuleSchema,
    RuleInputSchema,
    KubernetesInputSchema,
    FileInputSchema,
    HttpInputSchema
} from '../../gen/cel/v1/cel_pb';
import type { CELRule, RuleInput } from '../../gen/cel/v1/cel_pb';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

import { X } from 'lucide-react';

interface RuleInputEditorProps {
    input: RuleInput;
    index: number;
    editedRule: CELRule;
    setEditedRule: (rule: CELRule) => void;
    onRemove: () => void;
}

export function RuleInputEditor({ input, index, editedRule, setEditedRule, onRemove }: RuleInputEditorProps) {
    // Local state for current input type to ensure immediate UI updates
    const [currentInputType, setCurrentInputType] = useState<string>(() => input.inputType?.case || 'kubernetes');
    
    // Update local state when input prop changes
    useEffect(() => {
        setCurrentInputType(input.inputType?.case || 'kubernetes');
    }, [input.inputType?.case]);

    // Helper to clone CELRule with forced new reference for React reactivity
    const cloneRule = (rule: CELRule): CELRule => {
        const cloned = create(CELRuleSchema, {
            ...rule,
            inputs: rule.inputs.map(input => create(RuleInputSchema, input)),
            testCases: rule.testCases.map(testCase => ({ ...testCase })),
        });
        return cloned;
    };

    // Helper to update input at specific index
    const updateInput = (updatedInput: RuleInput) => {
        const newRule = cloneRule(editedRule);
        newRule.inputs[index] = updatedInput;
        setEditedRule(newRule);
    };

    // Get input type for display
    const getInputType = () => {
        return currentInputType;
    };

    // Handle input type change
    const handleInputTypeChange = (newType: string) => {
        // Immediately update local state for instant UI feedback
        setCurrentInputType(newType);
        
        const newInput = create(RuleInputSchema, {
            name: input.name
        });

        switch (newType) {
            case 'kubernetes':
                newInput.inputType = {
                    case: 'kubernetes',
                    value: create(KubernetesInputSchema, {
                        group: '',
                        version: '',
                        resource: '',
                        namespace: '',
                        resourceName: '',
                        listAll: false
                    })
                };
                break;
            case 'file':
                newInput.inputType = {
                    case: 'file',
                    value: create(FileInputSchema, {
                        path: '',
                        format: 'JSON',
                        recursive: false,
                        checkPermissions: false
                    })
                };
                break;
            case 'http':
                newInput.inputType = {
                    case: 'http',
                    value: create(HttpInputSchema, {
                        url: '',
                        method: 'GET',
                        body: ''
                    })
                };
                break;
        }

        updateInput(newInput);
    };

    // Handle field updates for each input type
    const handleKubernetesUpdate = (field: string, value: string | boolean) => {
        if (input.inputType?.case !== 'kubernetes') return;
        
        const newInput = create(RuleInputSchema, input);
        const currentKubernetes = input.inputType.value;
        const newKubernetesInput = create(KubernetesInputSchema, currentKubernetes);
        (newKubernetesInput as any)[field] = value;
        newInput.inputType = {
            case: 'kubernetes',
            value: newKubernetesInput
        };
        updateInput(newInput);
    };

    const handleFileUpdate = (field: string, value: string | boolean) => {
        if (input.inputType?.case !== 'file') return;
        
        const newInput = create(RuleInputSchema, input);
        const currentFile = input.inputType.value;
        const newFileInput = create(FileInputSchema, currentFile);
        (newFileInput as any)[field] = value;
        newInput.inputType = {
            case: 'file',
            value: newFileInput
        };
        updateInput(newInput);
    };

    const handleHttpUpdate = (field: string, value: string) => {
        if (input.inputType?.case !== 'http') return;
        
        const newInput = create(RuleInputSchema, input);
        const currentHttp = input.inputType.value;
        const newHttpInput = create(HttpInputSchema, currentHttp);
        (newHttpInput as any)[field] = value;
        newInput.inputType = {
            case: 'http',
            value: newHttpInput
        };
        updateInput(newInput);
    };

    const handleBasicUpdate = (field: 'name', value: string) => {
        const newInput = create(RuleInputSchema, input);
        newInput[field] = value;
        updateInput(newInput);
    };

    const currentType = getInputType();

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Input {index + 1}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={onRemove}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Basic Input Information */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Input Name
                    </label>
                    <Input
                        value={input.name}
                        onChange={(e) => handleBasicUpdate('name', e.target.value)}
                        placeholder="e.g., pod, file, request"
                    />
                </div>

                {/* Input Type Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Input Type
                    </label>
                    <Select value={currentType} onValueChange={handleInputTypeChange}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="kubernetes">Kubernetes</SelectItem>
                            <SelectItem value="file">File</SelectItem>
                            <SelectItem value="http">HTTP</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Type-specific Configuration */}
                {currentType === 'kubernetes' && input.inputType?.case === 'kubernetes' && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="text-blue-800 font-medium mb-3">Kubernetes Configuration</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-blue-700 mb-1">
                                    Resource
                                </label>
                                <Input
                                    value={input.inputType.value.resource}
                                    onChange={(e) => handleKubernetesUpdate('resource', e.target.value)}
                                    placeholder="e.g., pods, deployments"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-700 mb-1">
                                    Version
                                </label>
                                <Input
                                    value={input.inputType.value.version}
                                    onChange={(e) => handleKubernetesUpdate('version', e.target.value)}
                                    placeholder="e.g., v1, apps/v1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-700 mb-1">
                                    Group
                                </label>
                                <Input
                                    value={input.inputType.value.group}
                                    onChange={(e) => handleKubernetesUpdate('group', e.target.value)}
                                    placeholder="e.g., apps, extensions"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-700 mb-1">
                                    Namespace
                                </label>
                                <Input
                                    value={input.inputType.value.namespace}
                                    onChange={(e) => handleKubernetesUpdate('namespace', e.target.value)}
                                    placeholder="e.g., default, kube-system"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-700 mb-1">
                                    Resource Name
                                </label>
                                <Input
                                    value={input.inputType.value.resourceName}
                                    onChange={(e) => handleKubernetesUpdate('resourceName', e.target.value)}
                                    placeholder="Specific resource name (optional)"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="listAll"
                                    checked={input.inputType.value.listAll}
                                    onChange={(e) => handleKubernetesUpdate('listAll', e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                />
                                <label htmlFor="listAll" className="text-sm font-medium text-blue-700">
                                    List All Resources
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {currentType === 'file' && input.inputType?.case === 'file' && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-900 mb-3">File Configuration</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">
                                    File Path
                                </label>
                                <Input
                                    value={input.inputType.value.path}
                                    onChange={(e) => handleFileUpdate('path', e.target.value)}
                                    placeholder="/path/to/file.json"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">
                                    Format
                                </label>
                                <Select 
                                    value={input.inputType.value.format} 
                                    onValueChange={(value) => handleFileUpdate('format', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="JSON">JSON</SelectItem>
                                        <SelectItem value="YAML">YAML</SelectItem>
                                        <SelectItem value="Text">Text</SelectItem>
                                        <SelectItem value="Binary">Binary</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="recursive"
                                        checked={input.inputType.value.recursive}
                                        onChange={(e) => handleFileUpdate('recursive', e.target.checked)}
                                        className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                                    />
                                    <label htmlFor="recursive" className="text-sm font-medium text-green-700">
                                        Recursive
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="checkPermissions"
                                        checked={input.inputType.value.checkPermissions}
                                        onChange={(e) => handleFileUpdate('checkPermissions', e.target.checked)}
                                        className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                                    />
                                    <label htmlFor="checkPermissions" className="text-sm font-medium text-green-700">
                                        Check Permissions
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentType === 'http' && input.inputType?.case === 'http' && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-medium text-purple-900 mb-3">HTTP Configuration</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-purple-700 mb-1">
                                    URL
                                </label>
                                <Input
                                    value={input.inputType.value.url}
                                    onChange={(e) => handleHttpUpdate('url', e.target.value)}
                                    placeholder="https://api.example.com/resource"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-purple-700 mb-1">
                                    HTTP Method
                                </label>
                                <Select 
                                    value={input.inputType.value.method} 
                                    onValueChange={(value) => handleHttpUpdate('method', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GET">GET</SelectItem>
                                        <SelectItem value="POST">POST</SelectItem>
                                        <SelectItem value="PUT">PUT</SelectItem>
                                        <SelectItem value="DELETE">DELETE</SelectItem>
                                        <SelectItem value="PATCH">PATCH</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-purple-700 mb-1">
                                    Request Body
                                </label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={input.inputType.value.body}
                                    onChange={(e) => handleHttpUpdate('body', e.target.value)}
                                    placeholder="Request body (JSON, XML, etc.)"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

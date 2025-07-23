import React from 'react';
import { create } from '@bufbuild/protobuf';
import { 
    CELRuleSchema,
    RuleInputSchema,
    KubernetesInputSchema,
    FileInputSchema,
    HttpInputSchema
} from '../../gen/cel/v1/cel_pb';
import type { CELRule, TestCaseResult } from '../../gen/cel/v1/cel_pb';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Plus } from 'lucide-react';
import { TagInput } from '../ui/tag-input';
import { RuleInputEditor } from './RuleInputEditor';

interface RuleEditorFormProps {
    editedRule: CELRule;
    setEditedRule: (rule: CELRule) => void;
    onValidate: () => void;
    isValidating: boolean;
    validationResults: TestCaseResult[];
}

export function RuleEditorForm({ editedRule, setEditedRule, onValidate, isValidating, validationResults }: RuleEditorFormProps) {
    // Helper to clone CELRule with forced new reference for React reactivity
    const cloneRule = (rule: CELRule): CELRule => {
        const cloned = create(CELRuleSchema, {
            ...rule,
            inputs: rule.inputs.map(input => create(RuleInputSchema, input)),
            testCases: rule.testCases.map(testCase => ({ ...testCase })),
        });
        return cloned;
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rule Name
                    </label>
                    <Input
                        value={editedRule.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const newRule = cloneRule(editedRule);
                            newRule.name = e.target.value;
                            setEditedRule(newRule);
                        }}
                        placeholder="Enter rule name"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:col-span-1">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                        </label>
                        <Select
                            value={editedRule.category}
                            onValueChange={(value) => {
                                const newRule = cloneRule(editedRule);
                                newRule.category = value;
                                setEditedRule(newRule);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="security">Security</SelectItem>
                                <SelectItem value="compliance">Compliance</SelectItem>
                                <SelectItem value="best-practices">Best Practices</SelectItem>
                                <SelectItem value="performance">Performance</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Severity
                        </label>
                        <Select
                            value={editedRule.severity}
                            onValueChange={(value) => {
                                const newRule = cloneRule(editedRule);
                                newRule.severity = value;
                                setEditedRule(newRule);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                </label>
                <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    value={editedRule.description}
                    onChange={(e) => {
                        const newRule = cloneRule(editedRule);
                        newRule.description = e.target.value;
                        setEditedRule(newRule);
                    }}
                    placeholder="Describe what this rule checks"
                />
            </div>

            {/* CEL Expression */}
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                        CEL Expression
                    </label>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onValidate}
                        disabled={isValidating}
                    >
                        {isValidating ? 'Validating...' : 'Validate'}
                    </Button>
                </div>
                <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={6}
                    value={editedRule.expression}
                    onChange={(e) => {
                        const newRule = cloneRule(editedRule);
                        newRule.expression = e.target.value;
                        setEditedRule(newRule);
                    }}
                    placeholder="Enter CEL expression"
                />
            </div>

            {/* Tags */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                </label>
                <TagInput
                    tags={editedRule.tags}
                    onChange={(tags) => {
                        const newRule = cloneRule(editedRule);
                        newRule.tags = tags;
                        setEditedRule(newRule);
                    }}
                    placeholder="Type a tag and press Enter or comma to add (e.g., kubernetes, security, compliance)"
                />
                <p className="text-xs text-gray-500 mt-1">
                    💡 Press Enter, comma, or paste to add tags. Click the X to remove tags.
                </p>
            </div>

            {/* Rule Inputs */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Rule Inputs ({editedRule.inputs.length})
                    </label>
                    <Select
                        value="" // Always reset to empty to ensure dropdown shows placeholder after selection
                        onValueChange={(inputType: 'kubernetes' | 'file' | 'http') => {
                            try {
                                const newRule = cloneRule(editedRule);
                                let newInputValue;
                            
                            switch (inputType) {
                                case 'kubernetes':
                                    newInputValue = {
                                        case: 'kubernetes' as const,
                                        value: create(KubernetesInputSchema, {
                                            group: '',
                                            version: 'v1',
                                            resource: 'pods',
                                            namespace: '',
                                            resourceName: '',
                                            listAll: false,
                                        }),
                                    };
                                    break;
                                case 'file':
                                    newInputValue = {
                                        case: 'file' as const,
                                        value: create(FileInputSchema, {
                                            path: '',
                                            format: 'json',
                                            recursive: false,
                                            checkPermissions: false,
                                            target: { case: undefined },
                                            accessMode: 0,
                                        }),
                                    };
                                    break;
                                case 'http':
                                    newInputValue = {
                                        case: 'http' as const,
                                        value: create(HttpInputSchema, {
                                            url: '',
                                            method: 'GET',
                                            headers: {},
                                            body: '',
                                        }),
                                    };
                                    break;
                            }
                            
                                const newInput = create(RuleInputSchema, {
                                    name: `input_${newRule.inputs.length + 1}`,
                                    inputType: newInputValue,
                                });
                                newRule.inputs = [...newRule.inputs, newInput];
                                setEditedRule(newRule);
                            } catch (error) {
                                console.error('Error adding input:', error);
                            }
                        }}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Add Input" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="kubernetes">
                                <Plus className="h-4 w-4 mr-2 inline" />
                                Kubernetes
                            </SelectItem>
                            <SelectItem value="file">
                                <Plus className="h-4 w-4 mr-2 inline" />
                                File
                            </SelectItem>
                            <SelectItem value="http">
                                <Plus className="h-4 w-4 mr-2 inline" />
                                HTTP
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-4">
                    {editedRule.inputs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                            No inputs yet. Use the dropdown above to add an input.
                        </div>
                    ) : (
                        editedRule.inputs.map((input, idx) => {
                            console.log(`Rendering input ${idx}:`, input.name, input.inputType?.case);
                            // Generate stable but unique key based on input content and index
                            const inputKey = `input-${idx}-${input.name || `unnamed_${idx}`}-${input.inputType?.case || 'none'}-${JSON.stringify(input.inputType?.value || {}).substring(0, 50)}`;
                            return (
                                <RuleInputEditor
                                    key={inputKey}
                                    input={input}
                                    index={idx}
                                    editedRule={editedRule}
                                    setEditedRule={setEditedRule}
                                    onRemove={() => {
                                        const newRule = cloneRule(editedRule);
                                        newRule.inputs = newRule.inputs.filter((_, i) => i !== idx);
                                        setEditedRule(newRule);
                                    }}
                                />
                            );
                        })
                    )}
                </div>
            </div>

            {/* Validation Results */}
            {validationResults.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Validation Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {validationResults.map((result, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <span>{result.testCaseName}</span>
                                    {result.passed ? (
                                        <Badge variant="outline" className="text-green-700">PASS</Badge>
                                    ) : (
                                        <Badge variant="destructive">FAIL: {result.error}</Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

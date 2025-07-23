import { useState } from 'react';
import { create } from '@bufbuild/protobuf';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Plus, Trash2, Edit3, Save, X, Wand2 } from 'lucide-react';
import { RuleTestCaseSchema } from '../../gen/cel/v1/cel_pb';
import type { RuleTestCase } from '../../gen/cel/v1/cel_pb';
import { TestCaseDisplay } from './TestCaseDisplay';
import { autoEscapeJson, isValidJson, getJsonErrorMessage, formatJson } from './utils/jsonUtils';

interface TestCasesEditorProps {
    testCases: RuleTestCase[];
    setTestCases: (testCases: RuleTestCase[]) => void;
}

interface TestCaseFormData {
    name: string;
    description: string;
    testData: string;
    expectedResult: boolean;
}

export function TestCasesEditor({ testCases, setTestCases }: TestCasesEditorProps) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState<TestCaseFormData>({
        name: '',
        description: '',
        testData: '{}',
        expectedResult: true
    });
    const [jsonError, setJsonError] = useState<string>('');

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            testData: '{}',
            expectedResult: true
        });
        setJsonError('');
    };

    const validateAndSetTestData = (data: string) => {
        setFormData({ ...formData, testData: data });
        const error = getJsonErrorMessage(data);
        setJsonError(error);
    };

    const handleEscapeJson = () => {
        const escaped = autoEscapeJson(formData.testData);
        setFormData({ ...formData, testData: escaped });
        setJsonError('');
    };

    const handleAddTestCase = () => {
        if (!isValidJson(formData.testData)) {
            setJsonError(getJsonErrorMessage(formData.testData));
            return;
        }

        try {
            const testDataObj = JSON.parse(formData.testData);
            const newTestCase = create(RuleTestCaseSchema, {
                name: formData.name,
                description: formData.description,
                testData: testDataObj,
                expectedResult: formData.expectedResult
            });

            setTestCases([...testCases, newTestCase]);
            setShowAddForm(false);
            resetForm();
        } catch (error) {
            setJsonError('Failed to create test case. Please check your JSON syntax.');
        }
    };

    const handleEditTestCase = (index: number) => {
        const testCase = testCases[index];
        setFormData({
            name: testCase.name,
            description: testCase.description || '',
            testData: formatJson(testCase.testData),
            expectedResult: testCase.expectedResult
        });
        setEditingIndex(index);
        setJsonError('');
    };

    const handleSaveEdit = () => {
        if (editingIndex === null) return;
        
        if (!isValidJson(formData.testData)) {
            setJsonError(getJsonErrorMessage(formData.testData));
            return;
        }

        try {
            const testDataObj = JSON.parse(formData.testData);
            const updatedTestCase = create(RuleTestCaseSchema, {
                name: formData.name,
                description: formData.description,
                testData: testDataObj,
                expectedResult: formData.expectedResult
            });

            const newTestCases = [...testCases];
            newTestCases[editingIndex] = updatedTestCase;
            setTestCases(newTestCases);
            setEditingIndex(null);
            resetForm();
        } catch (error) {
            setJsonError('Failed to save changes. Please check your JSON syntax.');
        }
    };

    const handleDeleteTestCase = (index: number) => {
        if (confirm('Are you sure you want to delete this test case?')) {
            const newTestCases = testCases.filter((_, i) => i !== index);
            setTestCases(newTestCases);
            if (editingIndex === index) {
                setEditingIndex(null);
                resetForm();
            }
        }
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setShowAddForm(false);
        resetForm();
    };

    // Add form component for new test cases
    const AddTestCaseForm = () => (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                    Add New Test Case
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Test Case Name
                    </label>
                    <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Valid Pod Configuration"
                        className="bg-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Optional)
                    </label>
                    <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe what this test case validates"
                        className="bg-white"
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                            Test Data (JSON)
                        </label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleEscapeJson}
                            className="text-xs h-6 px-2"
                            disabled={!formData.testData.trim()}
                        >
                            <Wand2 className="h-3 w-3 mr-1" />
                            Fix JSON
                        </Button>
                    </div>
                    <Textarea
                        value={formData.testData}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => validateAndSetTestData(e.target.value)}
                        className={`font-mono text-sm bg-white min-h-[120px] ${jsonError ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                        placeholder='{\n  "metadata": {\n    "name": "example-pod"\n  }\n}'
                    />
                    {jsonError && (
                        <p className="text-red-600 text-xs mt-1 flex items-center">
                            <X className="h-3 w-3 mr-1" />
                            {jsonError}
                        </p>
                    )}
                </div>

                <div>
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={formData.expectedResult}
                            onChange={(e) => setFormData({ ...formData, expectedResult: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Expected to pass</span>
                    </label>
                </div>
            </div>

            <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                </Button>
                <Button
                    onClick={handleAddTestCase}
                    disabled={!formData.name.trim() || !!jsonError}
                >
                    <Save className="h-4 w-4 mr-2" />
                    Add Test Case
                </Button>
            </div>
        </div>
    );

    // Inline edit component for existing test cases
    const InlineEditTestCase = () => (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                    Edit Test Case
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Test Case Name
                    </label>
                    <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Valid Pod Configuration"
                        className="bg-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Optional)
                    </label>
                    <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe what this test case validates"
                        className="bg-white"
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                            Test Data (JSON)
                        </label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleEscapeJson}
                            className="text-xs h-6 px-2"
                            disabled={!formData.testData.trim()}
                        >
                            <Wand2 className="h-3 w-3 mr-1" />
                            Fix JSON
                        </Button>
                    </div>
                    <Textarea
                        value={formData.testData}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => validateAndSetTestData(e.target.value)}
                        className={`font-mono text-sm bg-white min-h-[120px] ${jsonError ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                        placeholder='{\n  "metadata": {\n    "name": "example-pod"\n  }\n}'
                    />
                    {jsonError && (
                        <p className="text-red-600 text-xs mt-1 flex items-center">
                            <X className="h-3 w-3 mr-1" />
                            {jsonError}
                        </p>
                    )}
                </div>

                <div>
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={formData.expectedResult}
                            onChange={(e) => setFormData({ ...formData, expectedResult: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Expected to pass</span>
                    </label>
                </div>
            </div>

            <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSaveEdit}
                    disabled={!formData.name.trim() || !!jsonError}
                >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Test Cases</h2>
                <Button
                    onClick={() => setShowAddForm(true)}
                    disabled={showAddForm || editingIndex !== null}
                    size="sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Test Case
                </Button>
            </div>

            {/* Add Form */}
            {showAddForm && <AddTestCaseForm />}

            {/* Test Cases List with In-Place Editing */}
            <div className="space-y-3">
                {testCases.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No test cases yet.</p>
                        <p className="text-sm">Add a test case to validate your rule.</p>
                    </div>
                ) : (
                    testCases.map((testCase, index) => (
                        <div key={index}>
                            {editingIndex === index ? (
                                // Show inline edit form for this test case
                                <InlineEditTestCase />
                            ) : (
                                // Show normal test case display with action buttons
                                <div className="relative group">
                                    <TestCaseDisplay testCase={testCase} />
                                    
                                    {/* Action buttons */}
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditTestCase(index)}
                                                disabled={editingIndex !== null || showAddForm}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteTestCase(index)}
                                                disabled={editingIndex !== null || showAddForm}
                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

import { useState } from 'react';
import { create } from '@bufbuild/protobuf';
import type { ImportOptions } from '../../gen/cel/v1/cel_pb';
import { ImportOptionsSchema } from '../../gen/cel/v1/cel_pb';
import { Button } from '../ui/button';

interface ImportDialogProps {
    onImport: (file: File, options: ImportOptions) => void;
    onCancel: () => void;
}

// Import Dialog Component
export function ImportDialog({ onImport, onCancel }: ImportDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [options, setOptions] = useState<ImportOptions>(create(ImportOptionsSchema, {
        overwriteExisting: false,
        validateAll: true,
        runTestCases: true,
        skipOnError: true,
    }));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-semibold mb-4">Import Rules</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select file (JSON or YAML)
                            </label>
                            <input
                                type="file"
                                accept=".json,.yaml,.yml"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="w-full text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={options.overwriteExisting}
                                    onChange={(e) => {
                                        const newOptions = create(ImportOptionsSchema, options);
                                        newOptions.overwriteExisting = e.target.checked;
                                        setOptions(newOptions);
                                    }}
                                    className="mr-2"
                                />
                                <span className="text-sm">Overwrite existing rules</span>
                            </label>

                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={options.validateAll}
                                    onChange={(e) => {
                                        const newOptions = create(ImportOptionsSchema, options);
                                        newOptions.validateAll = e.target.checked;
                                        setOptions(newOptions);
                                    }}
                                    className="mr-2"
                                />
                                <span className="text-sm">Validate all rules</span>
                            </label>

                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={options.runTestCases}
                                    onChange={(e) => {
                                        const newOptions = create(ImportOptionsSchema, options);
                                        newOptions.runTestCases = e.target.checked;
                                        setOptions(newOptions);
                                    }}
                                    className="mr-2"
                                />
                                <span className="text-sm">Run test cases</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6">
                        <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button
                            onClick={() => file && onImport(file, options)}
                            disabled={!file}
                            className="w-full sm:w-auto"
                        >
                            Import
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

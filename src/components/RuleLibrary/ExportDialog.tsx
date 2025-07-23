import { useState } from 'react';
import type { CELRule } from '../../gen/cel/v1/cel_pb';
import { ExportFormat } from '../../gen/cel/v1/cel_pb';
import { Button } from '../ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';

interface ExportDialogProps {
    onExport: (format: ExportFormat, ruleIds?: string[]) => void;
    onCancel: () => void;
    rules: CELRule[];
}

// Export Dialog Component
export function ExportDialog({ onExport, onCancel, rules }: ExportDialogProps) {
    const [format, setFormat] = useState(ExportFormat.JSON);
    const [selectedRules, setSelectedRules] = useState<string[]>([]);
    const [exportAll, setExportAll] = useState(true);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="p-4 sm:p-6 flex-shrink-0">
                    <h2 className="text-lg sm:text-xl font-semibold mb-4">Export Rules</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                            <Select
                                value={String(format)}
                                onValueChange={(value) => setFormat(Number(value) as ExportFormat)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={String(ExportFormat.JSON)}>JSON</SelectItem>
                                    <SelectItem value={String(ExportFormat.YAML)}>YAML</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    checked={exportAll}
                                    onChange={() => setExportAll(true)}
                                    className="mr-2"
                                />
                                <span className="text-sm">Export all rules</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    checked={!exportAll}
                                    onChange={() => setExportAll(false)}
                                    className="mr-2"
                                />
                                <span className="text-sm">Select rules to export</span>
                            </label>
                        </div>

                        {!exportAll && (
                            <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                                {rules.map(rule => (
                                    <label key={rule.id} className="flex items-center p-1 hover:bg-gray-50 rounded">
                                        <input
                                            type="checkbox"
                                            checked={selectedRules.includes(rule.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedRules([...selectedRules, rule.id]);
                                                } else {
                                                    setSelectedRules(selectedRules.filter(id => id !== rule.id));
                                                }
                                            }}
                                            className="mr-2"
                                        />
                                        <span className="text-sm truncate">{rule.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t p-4 sm:p-6 flex-shrink-0">
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                        <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button
                            onClick={() => onExport(format, exportAll ? undefined : selectedRules)}
                            className="w-full sm:w-auto"
                        >
                            Export
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

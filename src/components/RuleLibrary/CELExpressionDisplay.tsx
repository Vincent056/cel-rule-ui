import { useState } from 'react';
import { Button } from '../ui/button';
import { ChevronRight } from 'lucide-react';

interface CELExpressionDisplayProps {
    expression: string;
}

// CEL Expression Display Component with expand/collapse
export function CELExpressionDisplay({ expression }: CELExpressionDisplayProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const maxLines = 3;
    const lines = expression.split('\n');
    const isLong = lines.length > maxLines || expression.length > 200;

    return (
        <div className="min-w-0 max-w-full">
            <pre className={`bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm break-words whitespace-pre-wrap min-w-0 max-w-full ${
                !isExpanded && isLong ? 'max-h-24 overflow-hidden relative' : ''
            }`}>
                <code className="break-words whitespace-pre-wrap">{isExpanded || !isLong ? expression : expression.slice(0, 200) + '...'}</code>
                {!isExpanded && isLong && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-900 to-transparent" />
                )}
            </pre>
            {isLong && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-2 text-blue-600 hover:text-blue-700"
                >
                    {isExpanded ? (
                        <>Show Less <ChevronRight className="h-4 w-4 rotate-90 ml-1" /></>
                    ) : (
                        <>Show More <ChevronRight className="h-4 w-4 -rotate-90 ml-1" /></>
                    )}
                </Button>
            )}
        </div>
    );
}

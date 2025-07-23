import React from 'react';
import { CheckCircle2, Circle, Loader2, XCircle, ChevronRight, Code, Beaker, Shield, RefreshCw, Globe } from 'lucide-react';
import type { WorkflowStep } from '../hooks/use-compliance-workflow';
import { cn } from '../lib/utils';

interface WorkflowProgressProps {
    progress: WorkflowStep[];
    className?: string;
}

const stepIcons = {
    generate: Code,
    test_generation: Beaker,
    verification: Shield,
    correction: RefreshCw,
    live_validation: Globe
};

const stepDescriptions = {
    generate: 'Generate CEL rule from natural language requirement',
    test_generation: 'Create test cases to validate the rule',
    verification: 'Verify rule correctness with test data',
    correction: 'Analyze failures and improve the rule',
    live_validation: 'Test against live Kubernetes resources'
};

export function WorkflowProgress({ progress, className }: WorkflowProgressProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {progress.map((step, index) => {
                const Icon = stepIcons[step.step];
                const isLast = index === progress.length - 1;

                return (
                    <div key={step.id} className="relative">
                        {/* Connection line */}
                        {!isLast && (
                            <div className="absolute left-5 top-10 w-0.5 h-full bg-gray-200 dark:bg-gray-700 -bottom-4" />
                        )}

                        <div className="flex gap-4">
                            {/* Status Icon */}
                            <div className="relative z-10 flex-shrink-0">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                                    step.status === 'complete' && "bg-green-100 dark:bg-green-900",
                                    step.status === 'running' && "bg-blue-100 dark:bg-blue-900",
                                    step.status === 'failed' && "bg-red-100 dark:bg-red-900",
                                    step.status === 'pending' && "bg-gray-100 dark:bg-gray-800"
                                )}>
                                    {step.status === 'complete' && <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />}
                                    {step.status === 'running' && <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />}
                                    {step.status === 'failed' && <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                                    {step.status === 'pending' && <Circle className="w-5 h-5 text-gray-400" />}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    <h4 className={cn(
                                        "font-semibold",
                                        step.status === 'complete' && "text-green-700 dark:text-green-400",
                                        step.status === 'running' && "text-blue-700 dark:text-blue-400",
                                        step.status === 'failed' && "text-red-700 dark:text-red-400",
                                        step.status === 'pending' && "text-gray-500 dark:text-gray-400"
                                    )}>
                                        {step.title}
                                    </h4>
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {stepDescriptions[step.step]}
                                </p>

                                {/* Result or Error */}
                                {step.result && step.status === 'complete' && (
                                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                                        {step.step === 'generate' && (
                                            <div className="space-y-2">
                                                <div className="font-mono text-xs bg-gray-900 text-gray-100 p-2 rounded">
                                                    {step.result.expression}
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-400">{step.result.description}</p>
                                            </div>
                                        )}

                                        {step.step === 'test_generation' && (
                                            <p className="text-gray-700 dark:text-gray-300">
                                                Generated {step.result.count} test cases
                                            </p>
                                        )}

                                        {step.step === 'verification' && (
                                            <div className="space-y-1">
                                                {step.result.results?.map((r: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        {r.passed ? (
                                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-red-500" />
                                                        )}
                                                        <span className="text-gray-700 dark:text-gray-300">{r.testCase}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {step.step === 'correction' && (
                                            <div className="space-y-2">
                                                <p className="text-gray-600 dark:text-gray-400">Rule updated:</p>
                                                <div className="font-mono text-xs bg-gray-900 text-gray-100 p-2 rounded">
                                                    {step.result.expression}
                                                </div>
                                            </div>
                                        )}

                                        {step.step === 'live_validation' && (
                                            <p className="text-gray-700 dark:text-gray-300">
                                                Validated against {step.result.results?.length || 0} live resources
                                            </p>
                                        )}
                                    </div>
                                )}

                                {step.error && step.status === 'failed' && (
                                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                        <p className="text-sm text-red-700 dark:text-red-400">{step.error}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Compact version for inline display
export function WorkflowProgressCompact({ progress }: WorkflowProgressProps) {
    return (
        <div className="flex items-center gap-2">
            {progress.map((step, index) => {
                const Icon = stepIcons[step.step];

                return (
                    <React.Fragment key={step.id}>
                        <div className="flex items-center gap-1">
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center",
                                step.status === 'complete' && "bg-green-500",
                                step.status === 'running' && "bg-blue-500",
                                step.status === 'failed' && "bg-red-500",
                                step.status === 'pending' && "bg-gray-300 dark:bg-gray-600"
                            )}>
                                {step.status === 'complete' && <CheckCircle2 className="w-4 h-4 text-white" />}
                                {step.status === 'running' && <Loader2 className="w-4 h-4 text-white animate-spin" />}
                                {step.status === 'failed' && <XCircle className="w-4 h-4 text-white" />}
                                {step.status === 'pending' && <Icon className="w-3 h-3 text-white" />}
                            </div>
                        </div>
                        {index < progress.length - 1 && (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
} 
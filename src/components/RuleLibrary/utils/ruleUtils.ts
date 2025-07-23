import { create } from '@bufbuild/protobuf';
import type { CELRule } from '../../../gen/cel/v1/cel_pb';
import {
    CELRuleSchema,
    RuleInputSchema,
    KubernetesInputSchema,
    RuleMetadataSchema,
} from '../../../gen/cel/v1/cel_pb';

// Helper function to create a new rule
export function createNewRule(): CELRule {
    return create(CELRuleSchema, {
        id: '',
        name: '',
        description: '',
        expression: '',
        inputs: [
            create(RuleInputSchema, {
                name: 'resource',
                inputType: {
                    case: 'kubernetes',
                    value: create(KubernetesInputSchema, {
                        group: '',
                        version: 'v1',
                        resource: 'pods',
                    }),
                },
            }),
        ],
        tags: [],
        category: '',
        severity: 'medium',
        testCases: [],
        metadata: create(RuleMetadataSchema, {}),
        isVerified: false,
    });
}

// Helper to clone CELRule
export function cloneRule(rule: CELRule): CELRule {
    return create(CELRuleSchema, rule);
}

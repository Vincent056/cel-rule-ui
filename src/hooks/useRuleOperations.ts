import { useState } from 'react'
import { type LogEntry, type Message } from '../types'
import { useToast } from '../hooks/use-toast'

export function useRuleOperations(
  _transport: any, 
  addLog: (level: LogEntry['level'], message: string, details?: any) => void,
  addMessage: (message: Message) => void
) {
  const [isValidating, setIsValidating] = useState(false)
  const { toast } = useToast()

  const saveRule = async (rule: any) => {
    try {
      addLog('info', 'Saving rule to library', { rule })

      // Transform inputs from protobuf format to database format
      // Handle both rule.inputs (from Rule Library) and rule.suggestedInputs (from AI chat)
      const inputsToProcess = rule.inputs || rule.suggestedInputs || []
      const cleanInputs = inputsToProcess.map((input: any) => {
        // If input already has the flat format (from Rule Library), use as-is
        if (input.kubernetes || input.file || input.http) {
          return {
            name: input.name,
            ...(input.kubernetes && { kubernetes: input.kubernetes }),
            ...(input.file && { file: input.file }),
            ...(input.http && { http: input.http })
          }
        }
        
        // Transform from protobuf nested format (from AI chat)
        if (input.inputType) {
          const result: any = { name: input.name }
          
          // Clean protobuf metadata from the value
          const cleanValue = (obj: any): any => {
            if (Array.isArray(obj)) {
              return obj.map(cleanValue)
            } else if (obj && typeof obj === 'object') {
              const cleaned: any = {}
              for (const [key, value] of Object.entries(obj)) {
                if (key !== '$typeName') {
                  cleaned[key] = cleanValue(value)
                }
              }
              return cleaned
            }
            return obj
          }
          
          // Add the input type as a direct property
          result[input.inputType.case] = cleanValue(input.inputType.value)
          return result
        }
        
        // Fallback for unknown format
        return { name: input.name || 'unknown' }
      })

      // Convert test cases to the correct format
      const testCases = rule.testCases?.map((tc: any) => ({
        id: tc.id,
        name: tc.name,
        description: tc.description,
        test_data: tc.testData || {},
        expected_result: tc.expectedResult || false,
        expected_message: tc.expectedMessage || "",
        is_passing: tc.isPassing || false,
        actual_result: tc.actualResult || ""
      })) || []

      const saveRequest = {
        rule: {
          id: "", // Let server generate
          name: rule.name || 'Generated Rule',
          description: rule.explanation || "",
          expression: rule.expression,
          inputs: cleanInputs,
          tags: ['generated', 'ai-assisted'],
          category: "security", // Default category
          severity: "medium", // Default severity
          test_cases: testCases,
          metadata: {
            compliance_framework: "",
            references: [],
            remediation: "",
            platforms: ["kubernetes"]
          },
          is_verified: false,
          created_at: 0, // Let server set
          updated_at: 0, // Let server set
          created_by: "chat-ui",
          last_modified_by: "chat-ui"
        },
        validate_before_save: false,
        run_test_cases: false
      }

      const response = await fetch((import.meta.env.VITE_RPC_BASE_URL || '__VITE_RPC_BASE_URL_PLACEHOLDER__') + '/cel.v1.CELValidationService/SaveRule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Connect-Protocol-Version': '1',
        },
        body: JSON.stringify(saveRequest),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Save failed: ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()

      if (result.success) {
        addLog('info', 'Rule saved successfully')
        toast({
          title: "Rule Saved",
          description: `Rule "${rule.name || 'Generated Rule'}" has been saved to your library.`,
        })
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Failed to save rule:', error)
      addLog('error', 'Failed to save rule', error)
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      })
    }
  }

  const runValidation = async (rule: any, useTestCases: boolean = false) => {
    try {
      setIsValidating(true)
      addLog('info', useTestCases ? 'Running validation with test cases' : 'Running validation on cluster', { rule })

      // Build the validation request
      let validationRequest: any = {
        $typeName: "cel.v1.ValidateCELRequest",
        expression: rule.expression,
        inputs: [],
        testCases: []
      }

      if (useTestCases) {
        // Use test cases for validation
        if (rule.testCases && rule.testCases.length > 0) {
          validationRequest.testCases = rule.testCases.map((tc: any) => {
            // Convert testData object to map of input name -> JSON string
            const testData: Record<string, string> = {}
            for (const [key, value] of Object.entries(tc.testData)) {
              // Check if value is already a string (from textarea input)
              if (typeof value === 'string') {
                // It's already a JSON string, use it directly
                testData[key] = value
              } else {
                // It's an object, stringify it
                testData[key] = JSON.stringify(value)
              }
            }

            return {
              id: tc.id,
              description: tc.description || tc.name,
              testData: testData,
              expected_result: tc.expectedResult
            }
          })

          // We still need to provide input definitions for the validator
          if (rule.suggestedInputs && rule.suggestedInputs.length > 0) {
            const inputs = rule.suggestedInputs.map((input: any) => {
              const cleanInput = (obj: any): any => {
                if (Array.isArray(obj)) {
                  return obj.map(cleanInput)
                } else if (obj && typeof obj === 'object') {
                  const cleaned: any = {}
                  for (const [key, value] of Object.entries(obj)) {
                    if (key !== '$typeName') {
                      cleaned[key] = cleanInput(value)
                    }
                  }
                  return cleaned
                }
                return obj
              }

              const cleaned = cleanInput(input)

              if (cleaned.inputType && cleaned.inputType.case === 'kubernetes' && cleaned.inputType.value) {
                return {
                  name: cleaned.name,
                  kubernetes: cleaned.inputType.value
                }
              } else if (cleaned.kubernetes) {
                return {
                  name: cleaned.name,
                  kubernetes: cleaned.kubernetes
                }
              }

              return {
                name: cleaned.name || input.name,
                kubernetes: {
                  group: "",
                  version: "v1",
                  resource: cleaned.name || input.name,
                  namespace: "",
                  listAll: true
                }
              }
            })
            validationRequest.inputs = inputs
          }
        } else {
          throw new Error("No test cases available for this rule")
        }
      } else {
        // Live cluster validation - existing code
        let inputs: any[] = []

        if (rule.suggestedInputs && rule.suggestedInputs.length > 0) {
          inputs = rule.suggestedInputs.map((input: any) => {
            const cleanInput = (obj: any): any => {
              if (Array.isArray(obj)) {
                return obj.map(cleanInput)
              } else if (obj && typeof obj === 'object') {
                const cleaned: any = {}
                for (const [key, value] of Object.entries(obj)) {
                  if (key !== '$typeName') {
                    cleaned[key] = cleanInput(value)
                  }
                }
                return cleaned
              }
              return obj
            }

            const cleaned = cleanInput(input)

            if (cleaned.inputType && cleaned.inputType.case === 'kubernetes' && cleaned.inputType.value) {
              return {
                name: cleaned.name,
                kubernetes: cleaned.inputType.value
              }
            } else if (cleaned.kubernetes) {
              return {
                name: cleaned.name,
                kubernetes: cleaned.kubernetes
              }
            }

            return {
              name: cleaned.name || input.name,
              kubernetes: {
                group: "",
                version: "v1",
                resource: cleaned.name || input.name,
                namespace: "",
                listAll: true
              }
            }
          })
        } else if (rule.variables && rule.variables.length > 0) {
          inputs = rule.variables.map((varName: string) => ({
            name: varName,
            kubernetes: {
              group: "",
              version: "v1",
              resource: varName,
              namespace: "",
              listAll: true
            }
          }))
        }

        validationRequest.inputs = inputs
      }

      addLog('info', 'Sending validation request', validationRequest)

      const response = await fetch((import.meta.env.VITE_RPC_BASE_URL || '__VITE_RPC_BASE_URL_PLACEHOLDER__') + '/cel.v1.CELValidationService/ValidateCEL', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Connect-Protocol-Version': '1',
        },
        body: JSON.stringify(validationRequest),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Validation failed: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      addLog('info', 'Validation results received', data)

      // Add validation results as a chat message
      const validationMessage: Message = {
        id: Date.now().toString(),
        type: 'validation',
        content: useTestCases ? 'Test Cases Results' : 'Validation Results',
        data: data,
        timestamp: Date.now(),
      }
      addMessage(validationMessage)



      return data
    } catch (error) {
      console.error('Failed to run validation:', error)
      addLog('error', 'Failed to run validation', error)

      return null
    } finally {
      setIsValidating(false)
    }
  }

  return {
    isValidating,
    saveRule,
    runValidation
  }
}

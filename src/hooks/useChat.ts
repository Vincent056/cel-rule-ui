import { useState, useRef, useEffect } from 'react'
import { createConnectTransport } from '@connectrpc/connect-web'
import { createClient } from '@connectrpc/connect'
import { create } from '@bufbuild/protobuf'
import { CELValidationService } from '../gen/cel/v1/cel_pb'
import {
  ChatAssistRequestSchema,
  RuleGenerationContextSchema,
  type ChatAssistResponse,
} from '../gen/cel/v1/cel_pb'
import { type Message, type LogEntry } from '../types'
import { toast } from './use-toast'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Create transport for Connect-RPC
  const transport = createConnectTransport({
    baseUrl: import.meta.env.VITE_RPC_BASE_URL || '__VITE_RPC_BASE_URL_PLACEHOLDER__',
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addLog = (level: LogEntry['level'], message: string, details?: any) => {
    const log: LogEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      level,
      message,
      details
    }
    setLogs(prev => [...prev, log])
  }

  const clearLogs = () => {
    setLogs([])
  }

  const handleStreamResponse = (response: ChatAssistResponse) => {
    // Handle different response types based on the content case
    switch (response.content.case) {
      case 'thinking': {
        const thinking = response.content.value
        addLog('debug', 'Processing thinking message', { message: thinking.message })

        const msg: Message = {
          id: Date.now().toString(),
          type: 'thinking',
          content: thinking.message,
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev, msg])
        break
      }

      case 'rule': {
        const rule = response.content.value
        addLog('info', 'Received rule generation', rule)

        const msg: Message = {
          id: Date.now().toString(),
          type: 'rule',
          content: rule.explanation || 'Rule generated successfully',
          data: rule,
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev, msg])
        break
      }

      case 'validation': {
        const validation = response.content.value
        addLog('info', 'Received validation results', validation)

        const msg: Message = {
          id: Date.now().toString(),
          type: 'validation',
          content: 'Test Scenarios',
          data: validation,
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev, msg])
        break
      }

      case 'text': {
        const text = response.content.value
        addLog('debug', 'Processing text response', { text: text.text })

        const msg: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: text.text,
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev, msg])
        break
      }

      case 'error': {
        const error = response.content.value
        addLog('error', 'Received error response', error)

        const msg: Message = {
          id: Date.now().toString(),
          type: 'error',
          content: error.error,
          data: error.details,
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev, msg])
        break
      }

      case 'resources': {
        const resources = response.content.value
        addLog('info', 'Received resources', resources)

        const msg: Message = {
          id: Date.now().toString(),
          type: 'resources',
          content: `Found ${resources.count} ${resources.resourceType}(s)`,
          data: resources,
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev, msg])
        break
      }

      default:
        addLog('warning', 'Unknown response type', response)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    addLog('info', 'Sending message to server', { message: input })

    try {
      // Create the request using the new protobuf API
      const request = create(ChatAssistRequestSchema, {
        message: input,
        conversationId: `chat-${Date.now()}`,
      })

      // Add rule generation context if needed
      if (input.toLowerCase().includes('rule') || input.toLowerCase().includes('create') || input.toLowerCase().includes('generate')) {
        const ruleContext = create(RuleGenerationContextSchema, {
          resourceType: 'Pod',
          apiVersion: 'v1',
          namespace: 'default',
          validationIntent: input,
          useLiveCluster: false,
        })
        request.context = { case: 'ruleContext', value: ruleContext }
      }

      addLog('debug', 'Sending Connect-RPC request', { request })

      // Stream responses using Connect-RPC v2
      const client = createClient(CELValidationService, transport)
      const stream = client.chatAssist(request)

      for await (const response of stream) {
        addLog('debug', 'Received streaming response', response)
        handleStreamResponse(response)
      }

      setIsLoading(false)
      addLog('info', 'Stream completed successfully')
      toast({
        title: "Success",
        description: "Message sent successfully!",
      })

    } catch (error) {
      console.error('Failed to send message:', error)
      addLog('error', 'Failed to send message', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)

      const errorMsg: Message = {
        id: Date.now().toString(),
        type: 'error',
        content: `Failed to send message: ${error}`,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, errorMsg])
    }
  }

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message])
  }

  return {
    messages,
    input,
    setInput,
    isLoading,
    logs,
    isValidating,
    messagesEndRef,
    transport,
    handleSubmit,
    addLog,
    clearLogs,
    setIsValidating,
    addMessage
  }
}

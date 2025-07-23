import React from 'react'
import { Bot } from 'lucide-react'
import type { Message } from '../../types'

interface MessageListProps {
  messages: Message[]
  renderMessage: (message: Message) => React.ReactNode
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export function MessageList({ messages, renderMessage, messagesEndRef }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <div className="space-y-4">
          <Bot className="w-16 h-16 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Welcome to CEL Rule Assistant</h2>
          <p className="text-muted-foreground max-w-md">
            I can help you generate CEL rules for Kubernetes resource validation.
            Just describe what you want to validate!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="divide-y">
      {messages.map(message => (
        <div key={message.id}>{renderMessage(message)}</div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}

import React from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'

interface MessageInputProps {
  input: string
  setInput: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
}

export function MessageInput({ input, setInput, onSubmit, isLoading }: MessageInputProps) {
  return (
    <div className="border-t p-4">
      <form onSubmit={onSubmit} className="max-w-4xl mx-auto">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the validation rule you need..."
            className="flex-1 px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

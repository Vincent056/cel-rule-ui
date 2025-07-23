// Type definitions for the chat application

export interface Message {
  id: string
  type: 'user' | 'assistant' | 'thinking' | 'rule' | 'validation' | 'error' | 'resources'
  content: string
  data?: any
  timestamp: number
}

export interface LogEntry {
  id: string
  timestamp: number
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  details?: any
}

export type ActiveTab = 'chat' | 'library'

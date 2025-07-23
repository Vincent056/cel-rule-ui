import { useState } from 'react'
import { Terminal, MessageSquare } from 'lucide-react'
import { RuleLibrary } from './RuleLibrary'
import { Toaster } from './components/ui/toaster'
import { MessageInput } from './components/Chat/MessageInput'
import { MessageRenderer } from './components/Chat/MessageRenderer'
import { LogsDrawer } from './components/Chat/LogsDrawer'
import { useChat } from './hooks/useChat'
import { useRuleOperations } from './hooks/useRuleOperations'
import type { ActiveTab } from './types'
import './App.css'

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
  const {
    messages,
    input,
    setInput,
    isLoading,
    logs,
    isValidating: chatValidating,
    messagesEndRef,
    transport,
    handleSubmit,
    addLog,
    clearLogs,
    addMessage
  } = useChat()
  
  const { isValidating: ruleValidating, saveRule, runValidation } = useRuleOperations(transport, addLog, addMessage)
  
  const isValidating = chatValidating || ruleValidating

  const renderMessage = (message: any) => (
    <MessageRenderer
      key={message.id}
      message={message}
      onSaveRule={saveRule}
      onRunValidation={runValidation}
      isValidating={isValidating}
    />
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b px-4 sm:px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">CEL Assistant</h1>
            <div className="flex items-center gap-4">
              {/* Tab navigation */}
              <div className="flex items-center bg-muted rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'chat'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('library')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'library'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Rule Library
                </button>
              </div>
              
              {/* Logs toggle */}
              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                <Terminal className="w-4 h-4" />
                Logs {logs.length > 0 && <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">{logs.length}</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden min-h-0">
          {activeTab === 'chat' ? (
            <div className="h-full flex flex-col min-w-0">
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 min-w-0">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Welcome to CEL Assistant</h3>
                      <p className="text-muted-foreground max-w-md">
                        Ask me to help you create CEL expressions, validate rules, or analyze Kubernetes resources.
                        I can generate rules, test them with scenarios, and save them to your library.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map(renderMessage)}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input area */}
              <div className="border-t px-4 sm:px-6 py-4 flex-shrink-0">
                <MessageInput
                  input={input}
                  setInput={setInput}
                  isLoading={isLoading}
                  onSubmit={handleSubmit}
                />
              </div>
            </div>
          ) : (
            <RuleLibrary transport={transport} />
          )}
        </div>
      </div>

      {/* Logs drawer */}
      {isDrawerOpen && (
        <LogsDrawer
          logs={logs}
          onClear={clearLogs}
          onClose={() => setIsDrawerOpen(false)}
        />
      )}

      <Toaster />
    </div>
  )
}

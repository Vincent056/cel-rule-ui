import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

interface AIResponseCollapsibleProps {
  content: string
}

export function AIResponseCollapsible({ content }: AIResponseCollapsibleProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  // Check if content starts with "🤖 AI Response:" and contains JSON
  const isAIResponse = content.startsWith('🤖 AI Response:')
  
  if (!isAIResponse) {
    // Show regular content with markdown rendering for non-AI responses
    return (
      <div className="text-sm text-foreground prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            pre: ({ children, ...props }) => (
              <pre {...props} className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto max-w-full">
                {children}
              </pre>
            ),
            code: ({ children, className, ...props }) => {
              const isInline = !className
              if (isInline) {
                return (
                  <code {...props} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                )
              }
              return (
                <code {...props} className={className}>
                  {children}
                </code>
              )
            },
            blockquote: ({ children, ...props }) => (
              <blockquote {...props} className="border-l-4 border-muted-foreground/20 pl-4 italic text-muted-foreground">
                {children}
              </blockquote>
            ),
            h1: ({ children, ...props }) => (
              <h1 {...props} className="text-lg font-semibold mb-2">
                {children}
              </h1>
            ),
            h2: ({ children, ...props }) => (
              <h2 {...props} className="text-base font-semibold mb-2">
                {children}
              </h2>
            ),
            h3: ({ children, ...props }) => (
              <h3 {...props} className="text-sm font-semibold mb-1">
                {children}
              </h3>
            ),
            ul: ({ children, ...props }) => (
              <ul {...props} className="list-disc list-inside space-y-1 ml-4">
                {children}
              </ul>
            ),
            ol: ({ children, ...props }) => (
              <ol {...props} className="list-decimal list-inside space-y-1 ml-4">
                {children}
              </ol>
            ),
            li: ({ children, ...props }) => (
              <li {...props} className="text-sm">
                {children}
              </li>
            ),
            p: ({ children, ...props }) => (
              <p {...props} className="text-sm mb-2 last:mb-0 break-words">
                {children}
              </p>
            ),
            strong: ({ children, ...props }) => (
              <strong {...props} className="font-semibold">
                {children}
              </strong>
            ),
            em: ({ children, ...props }) => (
              <em {...props} className="italic">
                {children}
              </em>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    )
  }
  
  // Extract JSON content after "🤖 AI Response:"
  const jsonStart = content.indexOf('```json')
  const jsonEnd = content.lastIndexOf('```')
  
  let jsonContent = ''
  let parsedData = null
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    jsonContent = content.substring(jsonStart + 7, jsonEnd).trim()
    try {
      parsedData = JSON.parse(jsonContent)
    } catch (e) {
      console.warn('Failed to parse AI response JSON:', e)
    }
  }
  
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground italic">🤖 AI Response</p>
      
      {parsedData ? (
        <div className="border rounded-lg overflow-hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted/70 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              <span className="text-sm font-medium">Generated Rule Details</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {parsedData.name ? `"${parsedData.name}"` : 'Rule Configuration'}
            </span>
          </button>
          
          {isExpanded && (
            <div className="p-4 bg-card space-y-3 animate-in slide-in-from-top-2">
              {parsedData.name && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Rule Name</h4>
                  <p className="text-sm">{parsedData.name}</p>
                </div>
              )}
              
              {parsedData.expression && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">CEL Expression</h4>
                  <div className="bg-muted rounded p-2 font-mono text-xs overflow-x-auto">
                    {parsedData.expression}
                  </div>
                </div>
              )}
              
              {parsedData.explanation && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Explanation</h4>
                  <p className="text-sm text-muted-foreground">{parsedData.explanation}</p>
                </div>
              )}
              
              {parsedData.variables && parsedData.variables.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Variables</h4>
                  <div className="flex flex-wrap gap-1">
                    {parsedData.variables.map((variable: string, idx: number) => (
                      <span key={idx} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {parsedData.inputs && parsedData.inputs.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Inputs ({parsedData.inputs.length})</h4>
                  <div className="space-y-2">
                    {parsedData.inputs.map((input: any, idx: number) => (
                      <div key={idx} className="bg-muted/50 rounded p-2 text-xs">
                        <div className="font-medium">{input.name} ({input.type})</div>
                        {input.spec && (
                          <div className="text-muted-foreground mt-1">
                            {input.spec.resource && `Resource: ${input.spec.resource}`}
                            {input.spec.version && ` | Version: ${input.spec.version}`}
                            {input.spec.group && ` | Group: ${input.spec.group}`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <details className="group">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
                  View raw JSON
                </summary>
                <pre className="mt-2 bg-muted rounded p-2 text-xs overflow-x-auto">
                  {JSON.stringify(parsedData, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-3 bg-muted/20">
          <p className="text-sm text-muted-foreground">Raw AI response (failed to parse JSON):</p>
          <pre className="mt-2 text-xs font-mono whitespace-pre-wrap">{content}</pre>
        </div>
      )}
    </div>
  )
}

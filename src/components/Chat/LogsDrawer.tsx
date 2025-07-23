import type { LogEntry } from '../../types'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

interface LogsDrawerProps {
  logs: LogEntry[]
  onClear: () => void
  onClose: () => void
}

export function LogsDrawer({ logs, onClear, onClose }: LogsDrawerProps) {

  return (
    <div className="w-72 sm:w-80 max-w-sm bg-card border-l flex flex-col animate-in slide-in-from-right flex-shrink-0">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Logs</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
          >
            Clear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            ×
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {logs.map((log, index) => (
          <div key={`${log.id}-${index}`} className={cn(
            "text-xs p-2 rounded-md font-mono",
            log.level === 'error' && "bg-destructive/10 text-destructive",
            log.level === 'warning' && "bg-yellow-500/10 text-yellow-700",
            log.level === 'info' && "bg-blue-500/10 text-blue-700",
            log.level === 'debug' && "bg-muted text-muted-foreground"
          )}>
            <div className="flex items-center gap-2">
              <span className="font-semibold uppercase">[{log.level}]</span>
              <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
            <p className="mt-1">{log.message}</p>
            {log.details && (
              <pre className="mt-2 text-[10px] overflow-x-auto">
                {JSON.stringify(log.details, (_, value) => {
                  try {
                    return JSON.parse(value)
                  } catch {
                    return value
                  }
                }, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

import { useEffect, useRef } from 'react'

export interface LogEntry {
  timestamp: number
  content: string
  type: 'input' | 'output' | 'error'
}

interface ConsoleHistoryProps {
  logs: Array<LogEntry>
}

export function ConsoleHistory({ logs }: ConsoleHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="flex-1 overflow-y-auto font-mono text-sm space-y-1 p-2 scrollbar-hide">
      {logs.map((log, i) => (
        <div key={i} className="flex space-x-2">
          <span className="text-matrix-primary/30 shrink-0">
            [
            {new Date(log.timestamp).toLocaleTimeString([], {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
            ]
          </span>
          <span
            className={`${
              log.type === 'input'
                ? 'text-matrix-secondary'
                : log.type === 'error'
                  ? 'text-red-500'
                  : 'text-matrix-primary'
            }`}
          >
            {log.type === 'input' && '> '}
            {log.content}
          </span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

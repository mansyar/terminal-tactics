import { useEffect, useState } from 'react'

interface TimerDisplayProps {
  startTime: number
  durationMs: number
  onTimeout?: () => void
  label: string
}

export function TimerDisplay({
  startTime,
  durationMs,
  onTimeout,
  label,
}: TimerDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, durationMs - elapsed)
      setTimeLeft(remaining)

      if (remaining === 0 && onTimeout) {
        onTimeout()
        clearInterval(timer)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [startTime, durationMs, onTimeout])

  const seconds = Math.ceil(timeLeft / 1000)
  const isWarning = seconds <= 15

  return (
    <div
      className={`font-mono border p-2 flex flex-col items-center justify-center transition-all ${
        isWarning
          ? 'border-red-500 text-red-500 animate-pulse'
          : 'border-matrix-primary/30 text-matrix-primary/60'
      }`}
    >
      <span className="text-[10px] uppercase">{label}</span>
      <span className={`text-xl font-bold ${isWarning ? 'glow-red' : ''}`}>
        {seconds.toString().padStart(2, '0')}s
      </span>
    </div>
  )
}

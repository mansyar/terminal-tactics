import React, { useEffect, useRef, useState } from 'react'

interface CLIInputProps {
  onCommand: (command: string) => void
}

export function CLIInput({ onCommand }: CLIInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleFocus = () => inputRef.current?.focus()
    window.addEventListener('click', handleFocus)
    return () => window.removeEventListener('click', handleFocus)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      onCommand(value)
      setValue('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center space-x-2 p-2 border-t border-matrix-primary/30"
    >
      <span className="text-matrix-primary glow font-bold">&gt;</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1 bg-transparent border-none outline-none text-matrix-primary font-mono caret-matrix-primary"
        autoComplete="off"
        autoFocus
        spellCheck="false"
      />
    </form>
  )
}

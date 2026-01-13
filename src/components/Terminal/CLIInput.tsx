import React, { useEffect, useRef, useState } from 'react'

interface CLIInputProps {
  onCommand: (command: string) => void
  onTyping?: (isTyping: boolean) => void
}

export const CLIInput: React.FC<CLIInputProps> = ({ onCommand, onTyping }) => {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    onCommand(input.trim())
    setInput('')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInput(val)
    if (onTyping) {
      onTyping(val.length > 0)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center space-x-2 bg-black border border-matrix-primary/30 p-2 focus-within:border-matrix-primary/60 transition-colors"
    >
      <span className="text-matrix-primary font-mono font-bold animate-pulse">
        &gt;
      </span>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={handleChange}
        autoFocus
        spellCheck={false}
        autoComplete="off"
        className="flex-1 bg-transparent border-none outline-none text-matrix-primary font-mono placeholder:text-matrix-primary/20"
        placeholder="ENTER_COMMAND..."
      />
    </form>
  )
}

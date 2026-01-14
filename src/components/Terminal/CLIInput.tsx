import React, { useEffect, useRef, useState } from 'react'
import { playKeystroke } from '../../lib/audio'

interface CLIInputProps {
  onCommand: (command: string) => void
  onTyping?: (isTyping: boolean) => void
  units?: Array<any>
  playerId?: string
}

const COMMAND_SUGGESTIONS = [
  'mv ',
  'atk ',
  'scan ',
  'inspect ',
  'ovw ',
  'end',
  'help',
  'clear',
  'forfeit',
  'sudo mv ',
  'sudo atk ',
  'sudo scan',
  'say ',
  'offer draw',
  'accept draw',
]

export const CLIInput: React.FC<CLIInputProps> = ({
  onCommand,
  onTyping,
  units = [],
  playerId,
}) => {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<
    Array<{ value: string; label: string; desc?: string }>
  >([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const getSuggestions = (val: string) => {
    if (!val.trim()) return []
    const parts = val.split(' ')
    const cmd = parts[0].toLowerCase()
    const lastPart = parts[parts.length - 1].toLowerCase()

    // 1. Command Suggestions
    if (parts.length === 1) {
      const matches = COMMAND_SUGGESTIONS.filter((s) =>
        s.toLowerCase().startsWith(lastPart),
      )

      // If exactly one match and it matches perfectly, no need to suggest
      if (
        matches.length === 1 &&
        matches[0].toLowerCase() === val.toLowerCase()
      ) {
        return []
      }

      return matches.map((s: string) => ({
        value: s,
        label: s,
        desc: 'SYSTEM_COMMAND',
      }))
    }

    // 2. Tactical Suggestions (Coordinates)
    const isSudo = cmd === 'sudo'
    const actualCmd = isSudo ? parts[1]?.toLowerCase() : cmd
    const isTactical = ['mv', 'atk', 'inspect', 'ovw', 'scan'].includes(
      actualCmd,
    )

    if (isTactical) {
      const myPlayerKey = playerId || 'p1'
      const myUnits = units.filter((u: any) => u.ownerId === myPlayerKey)
      const enemyUnits = units.filter((u: any) => u.ownerId !== myPlayerKey)

      const toCoord = (x: number, y: number) => {
        const xChar = String.fromCharCode(65 + x)
        const yNum = 12 - y
        return `${xChar}${yNum}`
      }

      const argPos = isSudo ? parts.length - 1 : parts.length

      // First Argument: Friendly Units
      if (argPos === 2) {
        return myUnits
          .map((u: any) => {
            const coord = toCoord(u.x, u.y)
            return {
              value: coord + ' ',
              label: `${coord} [${u.type}]`,
              desc: 'FRIENDLY_UNIT',
            }
          })
          .filter((s: { value: string }) =>
            s.value.toLowerCase().startsWith(lastPart),
          )
      }

      // Second Argument (Target): Enemies if 'atk'
      if (argPos === 3 && actualCmd === 'atk') {
        return enemyUnits
          .map((u: any) => {
            const coord = toCoord(u.x, u.y)
            return {
              value: coord + ' ',
              label: `${coord} [${u.type}]`,
              desc: 'HOSTILE_TARGET',
            }
          })
          .filter((s: { value: string }) =>
            s.value.toLowerCase().startsWith(lastPart),
          )
      }
    }

    return []
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (suggestions.length > 0 && selectedIndex !== -1) {
      applySuggestion(suggestions[selectedIndex])
      return
    }
    if (!input.trim()) return

    onCommand(input.trim())
    setInput('')
    setSuggestions([])
  }

  const applySuggestion = (s: { value: string; label: string }) => {
    const parts = input.split(' ')
    parts[parts.length - 1] = s.value
    const newVal = parts.join(' ')
    setInput(newVal)
    const nextSugs = getSuggestions(newVal)
    setSuggestions(nextSugs)
    setSelectedIndex(nextSugs.length > 0 ? 0 : -1)
    playKeystroke()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInput(val)
    playKeystroke()
    if (onTyping) {
      onTyping(val.length > 0)
    }

    const newSugs = getSuggestions(val)
    setSuggestions(newSugs)
    setSelectedIndex(newSugs.length > 0 ? 0 : -1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      if (suggestions.length > 0) {
        applySuggestion(suggestions[selectedIndex === -1 ? 0 : selectedIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(
        (prev) => (prev - 1 + suggestions.length) % suggestions.length,
      )
    } else if (e.key === 'Escape') {
      setSuggestions([])
    }
  }

  return (
    <div className="relative">
      {suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 bg-black border border-matrix-primary shadow-[0_0_15px_rgba(0,255,0,0.3)] min-w-[200px] z-50 terminal-fade">
          <ul className="py-1">
            {suggestions.map((s, i) => (
              <li
                key={i}
                onClick={() => applySuggestion(s)}
                className={`px-3 py-1 font-mono text-xs cursor-pointer flex justify-between gap-4 ${
                  i === selectedIndex
                    ? 'bg-matrix-primary text-black'
                    : 'text-matrix-primary hover:bg-matrix-primary/10'
                }`}
              >
                <span>{s.label}</span>
                <span
                  className={`text-[10px] opacity-50 ${
                    i === selectedIndex ? 'text-black/70' : ''
                  }`}
                >
                  {s.desc}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent border-none outline-none text-matrix-primary font-mono placeholder:text-matrix-primary/20"
          placeholder="ENTER_COMMAND..."
        />
      </form>
    </div>
  )
}

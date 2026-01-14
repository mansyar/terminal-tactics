export type CommandType =
  | 'mv'
  | 'atk'
  | 'heal'
  | 'scan'
  | 'inspect'
  | 'ovw'
  | 'help'
  | 'clear'
  | 'end'
  | 'sudo mv'
  | 'sudo scan'
  | 'sudo atk'
  | 'forfeit'
  | 'offer draw'
  | 'accept draw'
  | 'say'
  | 'unknown'

export interface ParsedCommand {
  type: CommandType
  args: Array<string>
  raw: string
}

export function parseCommand(input: string): ParsedCommand {
  const parts = input.trim().split(/\s+/)
  const first = parts[0]?.toLowerCase()

  if (first === 'sudo') {
    const second = parts[1]?.toLowerCase()
    if (second === 'mv')
      return { type: 'sudo mv', args: parts.slice(2), raw: input }
    if (second === 'scan')
      return { type: 'sudo scan', args: parts.slice(2), raw: input }
    if (second === 'atk')
      return { type: 'sudo atk', args: parts.slice(2), raw: input }
  }

  if (first === 'offer' && parts[1]?.toLowerCase() === 'draw') {
    return { type: 'offer draw', args: [], raw: input }
  }
  if (first === 'accept' && parts[1]?.toLowerCase() === 'draw') {
    return { type: 'accept draw', args: [], raw: input }
  }

  const type = first as CommandType
  const args = parts.slice(1)

  const validTypes: Array<CommandType> = [
    'mv',
    'atk',
    'heal',
    'scan',
    'inspect',
    'ovw',
    'help',
    'clear',
    'end',
    'forfeit',
    'say',
  ]

  if (validTypes.includes(type)) {
    return { type, args, raw: input }
  }

  return { type: 'unknown', args, raw: input }
}

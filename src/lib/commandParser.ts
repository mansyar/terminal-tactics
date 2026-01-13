export type CommandType =
  | 'mv'
  | 'atk'
  | 'scan'
  | 'inspect'
  | 'ovw'
  | 'sudo'
  | 'help'
  | 'clear'
  | 'end'
  | 'unknown'

export interface ParsedCommand {
  type: CommandType
  args: Array<string>
  raw: string
}

export function parseCommand(input: string): ParsedCommand {
  const parts = input.trim().split(/\s+/)
  const type = parts[0]?.toLowerCase() as CommandType
  const args = parts.slice(1)

  const validTypes: Array<CommandType> = [
    'mv',
    'atk',
    'scan',
    'inspect',
    'ovw',
    'sudo',
    'help',
    'clear',
    'end',
  ]

  if (validTypes.includes(type)) {
    return { type, args, raw: input }
  }

  return { type: 'unknown', args, raw: input }
}

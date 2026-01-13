import { describe, expect, it } from 'bun:test'
import { parseCommand } from './commandParser'

describe('commandParser', () => {
  it('parses "help" command', () => {
    const result = parseCommand('help')
    expect(result).toEqual({ type: 'help', args: [], raw: 'help' })
  })

  it('parses "clear" command', () => {
    const result = parseCommand('clear')
    expect(result).toEqual({ type: 'clear', args: [], raw: 'clear' })
  })

  it('parses "mv" command with arguments', () => {
    const result = parseCommand('mv u1 c4')
    expect(result).toEqual({ type: 'mv', args: ['u1', 'c4'], raw: 'mv u1 c4' })
  })

  it('parses "atk" command with arguments', () => {
    const result = parseCommand('atk u1 e2')
    expect(result).toEqual({
      type: 'atk',
      args: ['u1', 'e2'],
      raw: 'atk u1 e2',
    })
  })

  it('parses "scan" command', () => {
    const result = parseCommand('scan')
    expect(result).toEqual({ type: 'scan', args: [], raw: 'scan' })
  })

  it('handles standard input trimming', () => {
    const result = parseCommand('  mv   u1   c4  ')
    expect(result).toEqual({
      type: 'mv',
      args: ['u1', 'c4'],
      raw: '  mv   u1   c4  ',
    })
  })

  it('is case insensitive for command type', () => {
    const result = parseCommand('MV u1 c4')
    expect(result).toEqual({ type: 'mv', args: ['u1', 'c4'], raw: 'MV u1 c4' })
  })

  it('returns "unknown" for invalid commands', () => {
    const result = parseCommand('dance')
    expect(result).toEqual({ type: 'unknown', args: [], raw: 'dance' })
  })

  it('parses "sudo" command', () => {
    const result = parseCommand('sudo reboot')
    expect(result).toEqual({
      type: 'sudo',
      args: ['reboot'],
      raw: 'sudo reboot',
    })
  })
})

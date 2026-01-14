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

  it('parses "sudo mv" command', () => {
    const result = parseCommand('sudo mv A1 B2')
    expect(result).toEqual({
      type: 'sudo mv',
      args: ['A1', 'B2'],
      raw: 'sudo mv A1 B2',
    })
  })

  it('parses "forfeit" command', () => {
    const result = parseCommand('forfeit')
    expect(result).toEqual({
      type: 'forfeit',
      args: [],
      raw: 'forfeit',
    })
  })

  it('parses "offer draw" command', () => {
    const result = parseCommand('offer draw')
    expect(result).toEqual({
      type: 'offer draw',
      args: [],
      raw: 'offer draw',
    })
  })

  it('parses "say" command', () => {
    const result = parseCommand('say hello world')
    expect(result).toEqual({
      type: 'say',
      args: ['hello', 'world'],
      raw: 'say hello world',
    })
  })
})

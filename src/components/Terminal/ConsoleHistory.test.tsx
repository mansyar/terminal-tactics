import { describe, expect, test } from 'bun:test'
import { render } from '@testing-library/react'
import { ConsoleHistory } from './ConsoleHistory'
import type { LogEntry } from './ConsoleHistory'

// Mock scrollIntoView
Element.prototype.scrollIntoView = () => {}

describe('ConsoleHistory - Private Log Styling (Task 7.2.4)', () => {
  test('renders public log output normally (green text)', () => {
    const logs: Array<LogEntry> = [
      { timestamp: 1000, content: 'MOVE_SUCCESS', type: 'output' },
    ]
    const { container } = render(<ConsoleHistory logs={logs} />)
    const outputSpan = container.querySelector('.text-matrix-primary')
    expect(outputSpan).toBeTruthy()
    expect(outputSpan!.textContent).toContain('MOVE_SUCCESS')
  })

  test('renders private log output with italic styling', () => {
    const logs: Array<LogEntry> = [
      {
        timestamp: 1000,
        content: 'SCAN_COMPLETE',
        type: 'output',
        isPrivate: true,
      },
    ]
    const { container } = render(<ConsoleHistory logs={logs} />)
    const italicSpan = container.querySelector('span[style*="italic"]')
    expect(italicSpan).toBeTruthy()
  })

  test('renders private log with dimmed opacity', () => {
    const logs: Array<LogEntry> = [
      {
        timestamp: 1000,
        content: 'SCAN_COMPLETE',
        type: 'output',
        isPrivate: true,
      },
    ]
    const { container } = render(<ConsoleHistory logs={logs} />)
    const italicSpan = container.querySelector('span[style*="italic"]')
    expect(italicSpan).toBeTruthy()
    expect(italicSpan!.getAttribute('style')?.toLowerCase()).toMatch(/opacity/i)
  })

  test('renders [PRIVATE] label for private log entries', () => {
    const logs: Array<LogEntry> = [
      {
        timestamp: 1000,
        content: 'SCAN_COMPLETE: Area revealed.',
        type: 'output',
        isPrivate: true,
      },
    ]
    const { container } = render(<ConsoleHistory logs={logs} />)
    const privateLabels = container.querySelectorAll('span')
    const matched = Array.from(privateLabels).filter(
      (s) => s.textContent === '[PRIVATE]',
    )
    expect(matched.length).toBe(1)
  })

  test('does not render [PRIVATE] label for public log entries', () => {
    const logs: Array<LogEntry> = [
      { timestamp: 1000, content: 'MOVE_SUCCESS', type: 'output' },
    ]
    const { container } = render(<ConsoleHistory logs={logs} />)
    const privateLabels = container.querySelectorAll('span')
    const matched = Array.from(privateLabels).filter(
      (s) => s.textContent === '[PRIVATE]',
    )
    expect(matched.length).toBe(0)
  })

  test('private input entries also show italic styling', () => {
    const logs: Array<LogEntry> = [
      {
        timestamp: 1000,
        content: 'scan D4',
        type: 'input',
        isPrivate: true,
      },
    ]
    const { container } = render(<ConsoleHistory logs={logs} />)
    const italicSpan = container.querySelector('span[style*="italic"]')
    expect(italicSpan).toBeTruthy()
  })
})

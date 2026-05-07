import { describe, expect, it, mock, afterEach } from 'bun:test'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { CLIInput } from './CLIInput'

mock.module('../../lib/audio', () => ({
  playKeystroke: mock(() => {}),
  playSFX: mock(() => {}),
  playError: mock(() => {}),
  playSuccess: mock(() => {}),
  playAttack: mock(() => {}),
  playHeal: mock(() => {}),
  playKernelPanic: mock(() => {}),
  playTurnEnd: mock(() => {}),
}))

afterEach(cleanup)

describe('CLIInput', () => {
  it('renders the input field with placeholder ENTER_COMMAND...', () => {
    render(<CLIInput onCommand={mock()} />)
    expect(
      screen.getByPlaceholderText('ENTER_COMMAND...'),
    ).toBeTruthy()
  })

  it('renders the > prompt', () => {
    render(<CLIInput onCommand={mock()} />)
    expect(screen.getByText('>')).toBeTruthy()
  })

  it('calls onCommand when form is submitted with non-empty input', () => {
    const onCommand = mock()
    render(<CLIInput onCommand={onCommand} />)

    const input = screen.getByPlaceholderText('ENTER_COMMAND...')
    fireEvent.change(input, { target: { value: 'help' } })
    fireEvent.submit(input.closest('form')!)

    expect(onCommand).toHaveBeenCalledTimes(1)
    expect(onCommand).toHaveBeenCalledWith('help')
  })

  it('clears input after command submission', () => {
    const onCommand = mock()
    render(<CLIInput onCommand={onCommand} />)

    const input = screen.getByPlaceholderText('ENTER_COMMAND...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'help' } })
    fireEvent.submit(input.closest('form')!)

    expect(input.value).toBe('')
  })

  it('calls onTyping(true) when input changes to non-empty', () => {
    const onTyping = mock()
    render(<CLIInput onCommand={mock()} onTyping={onTyping} />)

    const input = screen.getByPlaceholderText('ENTER_COMMAND...')
    fireEvent.change(input, { target: { value: 'h' } })

    expect(onTyping).toHaveBeenCalledWith(true)
  })

  it('calls onTyping(false) when input changes to empty', () => {
    const onTyping = mock()
    render(<CLIInput onCommand={mock()} onTyping={onTyping} />)

    const input = screen.getByPlaceholderText('ENTER_COMMAND...')
    fireEvent.change(input, { target: { value: 'h' } })
    fireEvent.change(input, { target: { value: '' } })

    expect(onTyping).toHaveBeenCalledWith(false)
  })

  it('does not call onCommand when input is empty', () => {
    const onCommand = mock()
    render(<CLIInput onCommand={onCommand} />)

    const input = screen.getByPlaceholderText('ENTER_COMMAND...')
    fireEvent.submit(input.closest('form')!)

    expect(onCommand).not.toHaveBeenCalled()
  })

  it('shows suggestions when typing a command', () => {
    render(<CLIInput onCommand={mock()} />)

    const input = screen.getByPlaceholderText('ENTER_COMMAND...')
    fireEvent.change(input, { target: { value: 'h' } })

    expect(screen.getByText('help')).toBeTruthy()
  })

  it('Tab key applies the first suggestion', () => {
    render(<CLIInput onCommand={mock()} />)

    const input = screen.getByPlaceholderText('ENTER_COMMAND...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'h' } })
    fireEvent.keyDown(input, { key: 'Tab' })

    expect(input.value).toBe('help')
  })

  it('Escape key clears suggestions', () => {
    render(<CLIInput onCommand={mock()} />)

    const input = screen.getByPlaceholderText('ENTER_COMMAND...')
    fireEvent.change(input, { target: { value: 'h' } })
    expect(screen.getByText('help')).toBeTruthy()

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByText('help')).toBeNull()
  })

  it('ArrowDown/ArrowUp cycle through suggestions', () => {
    render(<CLIInput onCommand={mock()} />)

    const input = screen.getByPlaceholderText('ENTER_COMMAND...')
    fireEvent.change(input, { target: { value: 's' } })

    const listItems = screen.getAllByRole('listitem')
    expect(listItems.length).toBeGreaterThanOrEqual(2)

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const index2Item = screen.getAllByRole('listitem')[2]
    const isSelected = index2Item.className.includes('bg-matrix-primary')
    expect(isSelected).toBe(true)
  })
})

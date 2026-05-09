import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { LobbyScreen } from './LobbyScreen'

// Mock convex/react
mock.module('convex/react', () => ({
  useMutation: () => () => Promise.resolve({}),
  useQuery: () => undefined,
  useAction: () => () => {},
}))

describe('LobbyScreen - Handle Widget', () => {
  beforeEach(() => {
    cleanup()
  })

  const defaultProps = {
    playerId: 'user_test',
    handle: 'user_test',
    onGameJoined: () => {},
  }

  it('shows current handle from props', () => {
    render(<LobbyScreen {...defaultProps} handle="neon_ninja" />)
    expect(screen.getByTestId('handle-display').textContent).toContain(
      'neon_ninja',
    )
    cleanup()
  })

  it('shows [EDIT] button next to handle', () => {
    render(<LobbyScreen {...defaultProps} />)
    expect(screen.getByTestId('handle-edit-btn').textContent).toContain('EDIT')
    cleanup()
  })

  it('shows handle input when [EDIT] is clicked', () => {
    render(<LobbyScreen {...defaultProps} />)
    fireEvent.click(screen.getByTestId('handle-edit-btn'))
    expect(screen.getByTestId('handle-input')).toBeDefined()
    expect(screen.getByTestId('handle-save-btn')).toBeDefined()
    expect(screen.getByTestId('handle-cancel-btn')).toBeDefined()
    cleanup()
  })

  it('pre-fills handle input with current handle on edit', () => {
    render(<LobbyScreen {...defaultProps} handle="neon_ninja" />)
    fireEvent.click(screen.getByTestId('handle-edit-btn'))
    const input = screen.getByTestId('handle-input') as HTMLInputElement
    expect(input.value).toBe('neon_ninja')
    cleanup()
  })

  it('shows validation error for handle shorter than 2 chars', () => {
    render(<LobbyScreen {...defaultProps} />)
    fireEvent.click(screen.getByTestId('handle-edit-btn'))
    const input = screen.getByTestId('handle-input')
    fireEvent.change(input, { target: { value: 'a' } })
    fireEvent.click(screen.getByTestId('handle-save-btn'))
    expect(screen.getByTestId('handle-error').textContent).toContain(
      'HANDLE_TOO_SHORT',
    )
    cleanup()
  })

  it('shows validation error for handle longer than 20 chars', () => {
    render(<LobbyScreen {...defaultProps} />)
    fireEvent.click(screen.getByTestId('handle-edit-btn'))
    const input = screen.getByTestId('handle-input')
    fireEvent.change(input, { target: { value: 'a'.repeat(21) } })
    fireEvent.click(screen.getByTestId('handle-save-btn'))
    expect(screen.getByTestId('handle-error').textContent).toContain(
      'HANDLE_TOO_LONG',
    )
    cleanup()
  })

  it('shows validation error for invalid characters', () => {
    render(<LobbyScreen {...defaultProps} />)
    fireEvent.click(screen.getByTestId('handle-edit-btn'))
    const input = screen.getByTestId('handle-input')
    fireEvent.change(input, { target: { value: 'hello world!' } })
    fireEvent.click(screen.getByTestId('handle-save-btn'))
    expect(screen.getByTestId('handle-error').textContent).toContain(
      'HANDLE_INVALID_CHARS',
    )
    cleanup()
  })

  it('returns to display mode after successful handle change', async () => {
    render(<LobbyScreen {...defaultProps} handle="old_handle" />)

    // Click the handle display to edit
    fireEvent.click(screen.getByTestId('handle-edit-btn'))
    expect(screen.getByTestId('handle-input')).toBeDefined()

    const input = screen.getByTestId('handle-input')
    fireEvent.change(input, { target: { value: 'new_handle' } })
    fireEvent.click(screen.getByTestId('handle-save-btn'))

    // Wait for the async mutation to resolve — should return to display mode
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByTestId('handle-input')).toBeNull()
    expect(screen.getByTestId('handle-display').textContent).toContain(
      'old_handle',
    )
    cleanup()
  })

  it('cancels edit and returns to display mode', () => {
    render(<LobbyScreen {...defaultProps} handle="original" />)
    fireEvent.click(screen.getByTestId('handle-edit-btn'))

    // Verify we're in edit mode
    expect(screen.getByTestId('handle-input')).toBeDefined()

    // Cancel
    fireEvent.click(screen.getByTestId('handle-cancel-btn'))

    // Should be back to display mode showing original handle
    expect(screen.queryByTestId('handle-input')).toBeNull()
    expect(screen.getByTestId('handle-display').textContent).toContain(
      'original',
    )
    cleanup()
  })

  it('renders the title TERMINAL_TACTICS', () => {
    render(<LobbyScreen {...defaultProps} />)
    expect(screen.getByText(/TERMINAL_TACTICS/i)).toBeDefined()
    cleanup()
  })
})

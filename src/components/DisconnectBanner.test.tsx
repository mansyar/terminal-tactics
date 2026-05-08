import { describe, expect, it } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { DisconnectBanner } from './DisconnectBanner'

describe('DisconnectBanner', () => {
  it('renders ENEMY_DISCONNECTED when opponent status is disconnected', () => {
    render(
      <DisconnectBanner
        opponentStatus="disconnected"
        myStatus="connected"
        remainingGraceMs={90000}
      />,
    )
    expect(screen.getByText(/ENEMY_DISCONNECTED/)).toBeDefined()
  })

  it('shows grace period countdown correctly', () => {
    render(
      <DisconnectBanner
        opponentStatus="disconnected"
        myStatus="connected"
        remainingGraceMs={65000}
      />,
    )
    expect(screen.getByText(/Grace: 1:05/)).toBeDefined()
  })

  it('shows CONNECTION_LOST when own connection is lost', () => {
    render(
      <DisconnectBanner
        opponentStatus="connected"
        myStatus="disconnected"
        remainingGraceMs={null}
      />,
    )
    expect(screen.getByText(/CONNECTION_LOST/)).toBeDefined()
  })

  it('returns null when both players are connected', () => {
    const { container } = render(
      <DisconnectBanner
        opponentStatus="connected"
        myStatus="connected"
        remainingGraceMs={null}
      />,
    )
    expect(container.innerHTML).toBe('')
  })
})

import { describe, expect, it } from 'bun:test'
import { render, cleanup } from '@testing-library/react'
import { TurnIndicator } from './TurnIndicator'

describe('TurnIndicator', () => {
  it('shows MY_TURN when isMyTurn is true', () => {
    const { container } = render(<TurnIndicator turnNum={1} isMyTurn={true} />)
    expect(container.textContent).toContain('MY_TURN')
    cleanup()
  })

  it('shows WAITING_FOR_ENEMY when isMyTurn is false', () => {
    const { container } = render(<TurnIndicator turnNum={1} isMyTurn={false} />)
    expect(container.textContent).toContain('WAITING_FOR_ENEMY')
    cleanup()
  })

  it('shows enemy typing indicator when enemyTyping is true', () => {
    const { container } = render(
      <TurnIndicator turnNum={1} isMyTurn={false} enemyTyping={true} />,
    )
    expect(container.textContent).toContain('Enemy_is_typing')
    cleanup()
  })

  it('does not show enemy typing indicator when enemyTyping is false/undefined', () => {
    const { container, rerender } = render(
      <TurnIndicator turnNum={1} isMyTurn={false} enemyTyping={false} />,
    )
    expect(container.textContent).not.toContain('Enemy_is_typing')
    rerender(<TurnIndicator turnNum={1} isMyTurn={false} />)
    expect(container.textContent).not.toContain('Enemy_is_typing')
    cleanup()
  })

  it('displays the turn number', () => {
    const { container } = render(<TurnIndicator turnNum={5} isMyTurn={true} />)
    expect(container.textContent).toContain('Turn_Num:')
    cleanup()
  })
})

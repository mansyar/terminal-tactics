import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import { TimerDisplay } from './TimerDisplay'

let dateNowSpy: ReturnType<typeof spyOn>

describe('TimerDisplay', () => {
  beforeEach(() => {
    dateNowSpy = spyOn(Date, 'now').mockReturnValue(1000000)
  })

  afterEach(() => {
    dateNowSpy.mockRestore()
  })

  it('renders the label and time', async () => {
    render(
      <TimerDisplay startTime={1000000} durationMs={60000} label="TIME_LEFT" />,
    )
    expect(screen.getByText('TIME_LEFT')).toBeDefined()
    await waitFor(() => {
      expect(screen.getByText('60s')).toBeDefined()
    })
  })

  it('shows warning styling when seconds <= 15', async () => {
    const { container } = render(
      <TimerDisplay startTime={950000} durationMs={60000} label="TIME" />,
    )
    await waitFor(() => {
      expect(screen.getByText('10s')).toBeDefined()
    })
    const timeSpan = container.querySelector('.text-xl.font-bold')
    expect(timeSpan?.className).toContain('glow-red')
  })

  it('shows TIMER_PAUSED when paused prop is true', async () => {
    render(
      <TimerDisplay
        startTime={1000000}
        durationMs={60000}
        label="TURN"
        paused={true}
      />,
    )
    expect(screen.getByText('TIMER_PAUSED')).toBeDefined()
  })
})

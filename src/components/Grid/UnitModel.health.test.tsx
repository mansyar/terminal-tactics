import { describe, expect, it } from 'bun:test'
import { render } from '@testing-library/react'
import { UnitModel } from './UnitModel'

describe('UnitModel - Health Bar (Task 7.1.1)', () => {
  it('renders a health bar with correct width ratio for full HP', () => {
    const { container } = render(
      <svg>
        <UnitModel type="K" x={0} y={0} ownerId="p1" hp={10} maxHp={10} ap={3} maxAp={3} />
      </svg>,
    )
    const healthBarBg = container.querySelector('[data-testid="health-bar-bg"]')
    const healthBarFill = container.querySelector('[data-testid="health-bar-fill"]')
    expect(healthBarBg).toBeTruthy()
    expect(healthBarFill).toBeTruthy()
    expect(healthBarFill!.getAttribute('width')).toBe('60')
  })

  it('renders health bar with 50% width for half HP', () => {
    const { container } = render(
      <svg>
        <UnitModel type="K" x={0} y={0} ownerId="p1" hp={5} maxHp={10} ap={3} maxAp={3} />
      </svg>,
    )
    const healthBarFill = container.querySelector('[data-testid="health-bar-fill"]')
    expect(parseFloat(healthBarFill!.getAttribute('width') || '0')).toBeGreaterThanOrEqual(29)
    expect(parseFloat(healthBarFill!.getAttribute('width') || '0')).toBeLessThanOrEqual(31)
  })

  it('renders health bar green when HP > 50%', () => {
    const { container } = render(
      <svg>
        <UnitModel type="K" x={0} y={0} ownerId="p1" hp={8} maxHp={10} ap={3} maxAp={3} />
      </svg>,
    )
    const fill = container.querySelector('[data-testid="health-bar-fill"]')
    expect(fill?.getAttribute('fill')).toBe('#00FF00')
  })

  it('renders health bar yellow when HP between 25-50%', () => {
    const { container } = render(
      <svg>
        <UnitModel type="K" x={0} y={0} ownerId="p1" hp={3} maxHp={10} ap={3} maxAp={3} />
      </svg>,
    )
    const fill = container.querySelector('[data-testid="health-bar-fill"]')
    expect(fill?.getAttribute('fill')).toBe('#FFFF00')
  })

  it('renders health bar red when HP < 25%', () => {
    const { container } = render(
      <svg>
        <UnitModel type="K" x={0} y={0} ownerId="p1" hp={1} maxHp={10} ap={3} maxAp={3} />
      </svg>,
    )
    const fill = container.querySelector('[data-testid="health-bar-fill"]')
    expect(fill?.getAttribute('fill')).toBe('#FF4444')
  })

  it('renders health bar at 0 width for 0 HP', () => {
    const { container } = render(
      <svg>
        <UnitModel type="K" x={0} y={0} ownerId="p1" hp={0} maxHp={10} ap={3} maxAp={3} />
      </svg>,
    )
    const fill = container.querySelector('[data-testid="health-bar-fill"]')
    expect(fill?.getAttribute('width')).toBe('0')
  })

  it('clamps health ratio to minimum 0', () => {
    const { container } = render(
      <svg>
        <UnitModel type="K" x={0} y={0} ownerId="p1" hp={-5} maxHp={10} ap={3} maxAp={3} />
      </svg>,
    )
    const fill = container.querySelector('[data-testid="health-bar-fill"]')
    expect(parseFloat(fill?.getAttribute('width') || '0')).toBe(0)
  })
})

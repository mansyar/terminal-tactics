import { describe, expect, it, mock } from 'bun:test'
import { render, fireEvent } from '@testing-library/react'
import { UnitModel } from './UnitModel'

describe('UnitModel - Interaction Callbacks (Task 7.1.0)', () => {
  it('calls onClick when unit group is clicked', () => {
    const onClick = mock(() => {})
    const { container } = render(
      <svg>
          <UnitModel
            type="K"
            x={5}
            y={3}
            ownerId="p1"
            hp={10}
            maxHp={10}
            ap={3}
            maxAp={3}
            onClick={onClick}
          />
      </svg>,
    )
    const unitGroup = container.querySelector('g')
    expect(unitGroup).not.toBeNull()
    fireEvent.click(unitGroup!)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('calls onMouseEnter when unit is hovered', () => {
    const onMouseEnter = mock(() => {})
    const { container } = render(
      <svg>
          <UnitModel
            type="S"
            x={2}
            y={5}
            ownerId="p2"
            hp={8}
            maxHp={8}
            ap={2}
            maxAp={4}
            onMouseEnter={onMouseEnter}
          />
      </svg>,
    )
    const unitGroup = container.querySelector('g')
    expect(unitGroup).not.toBeNull()
    fireEvent.mouseEnter(unitGroup!)
    expect(onMouseEnter).toHaveBeenCalledTimes(1)
  })

  it('calls onMouseLeave when mouse leaves unit', () => {
    const onMouseLeave = mock(() => {})
    const { container } = render(
      <svg>
          <UnitModel
            type="M"
            x={7}
            y={8}
            ownerId="p1"
            hp={6}
            maxHp={10}
            ap={1}
            maxAp={3}
            onMouseLeave={onMouseLeave}
          />
      </svg>,
    )
    const unitGroup = container.querySelector('g')
    expect(unitGroup).not.toBeNull()
    fireEvent.mouseLeave(unitGroup!)
    expect(onMouseLeave).toHaveBeenCalledTimes(1)
  })

  it('accepts currentPlayerId prop without crashing', () => {
    const { container } = render(
      <svg>
          <UnitModel
            type="A"
            x={0}
            y={0}
            ownerId="p1"
            hp={10}
            maxHp={10}
            ap={3}
            maxAp={3}
            currentPlayerId="p1"
          />
      </svg>,
    )
    expect(container.querySelector('g')).toBeTruthy()
  })

  it('does not throw when optional callbacks are omitted', () => {
    const { container } = render(
      <svg>
        <UnitModel type="K" x={3} y={4} ownerId="p2" hp={5} maxHp={5} ap={2} maxAp={2} />
      </svg>,
    )
    expect(container.querySelector('g')).toBeTruthy()
  })
})

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
    // 50% of 60 = 30
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

describe('UnitModel - Enemy Color Coding (Task 7.1.2)', () => {
  it('renders friendly unit in Matrix Green when ownerId matches currentPlayerId', () => {
    const { container } = render(
      <svg>
        <UnitModel
          type="K"
          x={0}
          y={0}
          ownerId="p1"
          currentPlayerId="p1"
          hp={10}
          maxHp={10}
          ap={3}
          maxAp={3}
        />
      </svg>,
    )
    // Glow border rect
    const rects = container.querySelectorAll('rect')
    const glowRect = Array.from(rects).find(
      (r) => r.getAttribute('stroke') && r.getAttribute('stroke') !== 'none',
    )
    expect(glowRect).toBeTruthy()
    expect(glowRect!.getAttribute('stroke')).toBe('#00FF00')
  })

  it('renders enemy unit in Hostile Red when ownerId differs from currentPlayerId', () => {
    const { container } = render(
      <svg>
        <UnitModel
          type="S"
          x={3}
          y={4}
          ownerId="p2"
          currentPlayerId="p1"
          hp={8}
          maxHp={8}
          ap={2}
          maxAp={4}
        />
      </svg>,
    )
    const rects = container.querySelectorAll('rect')
    const glowRect = Array.from(rects).find(
      (r) => r.getAttribute('stroke') && r.getAttribute('stroke') !== 'none',
    )
    expect(glowRect).toBeTruthy()
    expect(glowRect!.getAttribute('stroke')).toBe('#FF4444')
  })

  it('renders direction indicator in correct enemy color', () => {
    const { container } = render(
      <svg>
        <UnitModel
          type="A"
          x={5}
          y={5}
          ownerId="p2"
          currentPlayerId="p1"
          direction="N"
          hp={6}
          maxHp={10}
          ap={1}
          maxAp={3}
        />
      </svg>,
    )
    const lines = container.querySelectorAll('line')
    const dirLine = Array.from(lines).find((l) => l.getAttribute('stroke-width') === '3')
    expect(dirLine).toBeTruthy()
    expect(dirLine!.getAttribute('stroke')).toBe('#FF4444')
  })

  it('renders AP dots in correct enemy color', () => {
    const { container } = render(
      <svg>
        <UnitModel
          type="M"
          x={7}
          y={8}
          ownerId="p2"
          currentPlayerId="p1"
          hp={4}
          maxHp={12}
          ap={2}
          maxAp={3}
        />
      </svg>,
    )
    const circles = container.querySelectorAll('circle')
    // At least some filled AP dots should be red
    const filledDots = Array.from(circles).filter(
      (c) => c.getAttribute('fill') && c.getAttribute('fill') !== 'none',
    )
    expect(filledDots.length).toBeGreaterThan(0)
    filledDots.forEach((dot) => {
      expect(dot.getAttribute('fill')).toBe('#FF4444')
    })
  })

  it('renders type label text in correct enemy color', () => {
    const { container } = render(
      <svg>
        <UnitModel
          type="K"
          x={1}
          y={1}
          ownerId="p2"
          currentPlayerId="p1"
          hp={5}
          maxHp={10}
          ap={3}
          maxAp={3}
        />
      </svg>,
    )
    const text = container.querySelector('text')
    expect(text).toBeTruthy()
    expect(text!.getAttribute('fill')).toBe('#FF4444')
  })

  it('renders health bar fill using default green (no color change needed for HP)', () => {
    // HP bar color should still be based on HP ratio, not ownership
    const { container } = render(
      <svg>
        <UnitModel
          type="M"
          x={2}
          y={3}
          ownerId="p2"
          currentPlayerId="p1"
          hp={9}
          maxHp={10}
          ap={1}
          maxAp={3}
        />
      </svg>,
    )
    const fill = container.querySelector('[data-testid="health-bar-fill"]')
    expect(fill?.getAttribute('fill')).toBe('#00FF00')
  })
})

describe('UnitModel - Direction Indicator Type (Task 7.1.0)', () => {
  it('renders with direction prop applied', () => {
    const { container } = render(
      <svg>
        <UnitModel
          type="K"
          x={5}
          y={3}
          ownerId="p1"
          direction="E"
          hp={10}
          maxHp={10}
          ap={3}
          maxAp={3}
        />
      </svg>,
    )
    const unitGroup = container.querySelector('g')
    expect(unitGroup).toBeTruthy()
  })
})

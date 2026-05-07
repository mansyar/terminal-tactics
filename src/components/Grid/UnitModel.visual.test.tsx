import { describe, expect, it } from 'bun:test'
import { render } from '@testing-library/react'
import { UnitModel } from './UnitModel'

describe('UnitModel - Overwatch Direction Cone (Task 7.3.4)', () => {
  it('renders a cone-shaped polygon when overwatching', () => {
    const { container } = render(
      <svg>
        <UnitModel
          type="K"
          x={5}
          y={3}
          ownerId="p1"
          currentPlayerId="p1"
          direction="N"
          hp={10}
          maxHp={10}
          ap={3}
          maxAp={3}
          isOverwatching={true}
        />
      </svg>,
    )
    const polygons = container.querySelectorAll('polygon')
    expect(polygons.length).toBeGreaterThanOrEqual(1)
  })

  it('renders overwatch cone for north-facing unit', () => {
    const { container } = render(
      <svg>
        <UnitModel
          type="K"
          x={5}
          y={3}
          ownerId="p1"
          currentPlayerId="p1"
          direction="N"
          hp={10}
          maxHp={10}
          ap={3}
          maxAp={3}
          isOverwatching={true}
        />
      </svg>,
    )
    const polygons = container.querySelectorAll('polygon')
    const overwatchPoly = Array.from(polygons).find(
      (p) => p.getAttribute('data-testid') === 'overwatch-cone',
    )
    expect(overwatchPoly).toBeTruthy()
  })

  it('does not render overwatch cone when not overwatching', () => {
    const { container } = render(
      <svg>
        <UnitModel
          type="K"
          x={5}
          y={3}
          ownerId="p1"
          currentPlayerId="p1"
          direction="N"
          hp={10}
          maxHp={10}
          ap={3}
          maxAp={3}
          isOverwatching={false}
        />
      </svg>,
    )
    const overwatchPoly = container.querySelector('[data-testid="overwatch-cone"]')
    expect(overwatchPoly).toBeNull()
  })

  it('replaces pulsing rect with cone (no overwatch rect)', () => {
    const { container } = render(
      <svg>
        <UnitModel
          type="K"
          x={5}
          y={3}
          ownerId="p1"
          currentPlayerId="p1"
          direction="N"
          hp={10}
          maxHp={10}
          ap={3}
          maxAp={3}
          isOverwatching={true}
        />
      </svg>,
    )
    const rects = container.querySelectorAll('rect')
    const glowRects = Array.from(rects).filter(
      (r) => r.getAttribute('stroke-width') === '1',
    )
    expect(glowRects.length).toBeGreaterThanOrEqual(1)
  })
})

describe('UnitModel - Direction Indicator Arrow (Task 7.1.3)', () => {
  it('renders an arrow polygon for North-facing unit', () => {
    const { container } = render(
      <svg>
        <UnitModel
          type="K"
          x={0}
          y={0}
          ownerId="p1"
          currentPlayerId="p1"
          direction="N"
          hp={10}
          maxHp={10}
          ap={3}
          maxAp={3}
        />
      </svg>,
    )
    const polygons = container.querySelectorAll('polygon')
    expect(polygons.length).toBeGreaterThan(0)
    const arrowPoly = polygons[0]
    const points = arrowPoly.getAttribute('points') || ''
    expect(points).toContain('5')
  })

  it('renders an arrow polygon for South-facing unit', () => {
    const { container } = render(
      <svg>
        <UnitModel
          type="K"
          x={0}
          y={0}
          ownerId="p1"
          currentPlayerId="p1"
          direction="S"
          hp={10}
          maxHp={10}
          ap={3}
          maxAp={3}
        />
      </svg>,
    )
    const polygons = container.querySelectorAll('polygon')
    expect(polygons.length).toBeGreaterThan(0)
    const arrowPoly = polygons[0]
    const points = arrowPoly.getAttribute('points') || ''
    const yValues = points.split(' ').map((p) => parseInt(p.split(',')[1]))
    expect(yValues.some((y) => y > 80)).toBe(true)
  })

  it('renders an arrow polygon for East-facing unit', () => {
    const { container } = render(
      <svg>
        <UnitModel
          type="K"
          x={0}
          y={0}
          ownerId="p1"
          currentPlayerId="p1"
          direction="E"
          hp={10}
          maxHp={10}
          ap={3}
          maxAp={3}
        />
      </svg>,
    )
    const polygons = container.querySelectorAll('polygon')
    expect(polygons.length).toBeGreaterThan(0)
    const arrowPoly = polygons[0]
    const points = arrowPoly.getAttribute('points') || ''
    const xValues = points.split(' ').map((p) => parseInt(p.split(',')[0]))
    expect(xValues.some((x) => x > 80)).toBe(true)
  })

  it('renders an arrow polygon for West-facing unit', () => {
    const { container } = render(
      <svg>
        <UnitModel
          type="K"
          x={0}
          y={0}
          ownerId="p1"
          currentPlayerId="p1"
          direction="W"
          hp={10}
          maxHp={10}
          ap={3}
          maxAp={3}
        />
      </svg>,
    )
    const polygons = container.querySelectorAll('polygon')
    expect(polygons.length).toBeGreaterThan(0)
    const arrowPoly = polygons[0]
    const points = arrowPoly.getAttribute('points') || ''
    const xValues = points.split(' ').map((p) => parseInt(p.split(',')[0]))
    expect(xValues.some((x) => x < 30)).toBe(true)
  })

  it('does not render a direction line (replaced by arrow)', () => {
    const { container } = render(
      <svg>
        <UnitModel
          type="K"
          x={0}
          y={0}
          ownerId="p1"
          currentPlayerId="p1"
          direction="N"
          hp={10}
          maxHp={10}
          ap={3}
          maxAp={3}
        />
      </svg>,
    )
    const lines = container.querySelectorAll('line')
    const thickLines = Array.from(lines).filter(
      (l) => l.getAttribute('stroke-width') === '3',
    )
    expect(thickLines.length).toBe(0)
  })

  it('applies the correct arrow color based on ownership', () => {
    const { container } = render(
      <svg>
        <UnitModel
          type="S"
          x={2}
          y={3}
          ownerId="p2"
          currentPlayerId="p1"
          direction="E"
          hp={8}
          maxHp={8}
          ap={2}
          maxAp={4}
        />
      </svg>,
    )
    const polygons = container.querySelectorAll('polygon')
    const dirArrow = polygons[0]
    expect(dirArrow.getAttribute('fill')).toBe('#FF4444')
  })
})

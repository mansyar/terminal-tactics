import { describe, expect, it, mock } from 'bun:test'
import { render } from '@testing-library/react'
import { GridBoard } from './GridBoard'
import { UnitModel } from './UnitModel'

describe('GridBoard - Interaction Callbacks (Task 7.1.0)', () => {
  it('accepts onUnitClick callback prop', () => {
    const onUnitClick = mock(() => {})
    const { container } = render(
      <GridBoard onUnitClick={onUnitClick}>
        <UnitModel type="K" x={5} y={3} ownerId="p1" hp={10} maxHp={10} ap={3} maxAp={3} />
      </GridBoard>,
    )
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('accepts onUnitHover callback prop', () => {
    const onUnitHover = mock(() => {})
    const { container } = render(
      <GridBoard onUnitHover={onUnitHover}>
        <UnitModel type="K" x={5} y={3} ownerId="p1" hp={10} maxHp={10} ap={3} maxAp={3} />
      </GridBoard>,
    )
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('accepts onUnitLeave callback prop', () => {
    const onUnitLeave = mock(() => {})
    const { container } = render(
      <GridBoard onUnitLeave={onUnitLeave}>
        <UnitModel type="K" x={5} y={3} ownerId="p1" hp={10} maxHp={10} ap={3} maxAp={3} />
      </GridBoard>,
    )
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('passes through unit children with click handlers', () => {
    const onUnitClick = mock(() => {})
    const { container } = render(
      <GridBoard onUnitClick={onUnitClick}>
        <UnitModel type="M" x={1} y={2} ownerId="p2" hp={6} maxHp={10} ap={1} maxAp={2} />
      </GridBoard>,
    )
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  it('renders correctly without callback props', () => {
    const { container } = render(
      <GridBoard>
        <UnitModel type="A" x={0} y={0} ownerId="p1" hp={10} maxHp={10} ap={3} maxAp={3} />
      </GridBoard>,
    )
    expect(container.querySelector('svg')).toBeTruthy()
  })
})

describe('GridBoard - Coordinate Labels Toggle (Task 7.3.1)', () => {
  it('renders coordinate labels by default (showCoordinates=true)', () => {
    const { container } = render(
      <GridBoard>
        <UnitModel type="K" x={0} y={0} ownerId="p1" hp={10} maxHp={10} ap={3} maxAp={3} />
      </GridBoard>,
    )
    // Row labels: 12, 11, 10... and Column labels: A, B, C...
    const rowLabel12 = Array.from(container.querySelectorAll('text')).find(
      (t) => t.textContent === '12',
    )
    const colLabelA = Array.from(container.querySelectorAll('text')).find(
      (t) => t.textContent === 'A',
    )
    expect(rowLabel12).toBeTruthy()
    expect(colLabelA).toBeTruthy()
  })

  it('hides coordinate labels when showCoordinates is false', () => {
    const { container } = render(
      <GridBoard showCoordinates={false}>
        <UnitModel type="K" x={0} y={0} ownerId="p1" hp={10} maxHp={10} ap={3} maxAp={3} />
      </GridBoard>,
    )
    const rowLabel12 = Array.from(container.querySelectorAll('text')).find(
      (t) => t.textContent === '12',
    )
    const colLabelA = Array.from(container.querySelectorAll('text')).find(
      (t) => t.textContent === 'A',
    )
    expect(rowLabel12).toBeFalsy()
    expect(colLabelA).toBeFalsy()
  })

  it('still renders tiles and units when coordinates are hidden', () => {
    const { container } = render(
      <GridBoard showCoordinates={false}>
        <UnitModel type="K" x={0} y={0} ownerId="p1" hp={10} maxHp={10} ap={3} maxAp={3} />
      </GridBoard>,
    )
    // Grid lines should still render
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })
})

describe('GridBoard - Last Move Highlight (Task 7.3.2)', () => {
  it('renders a highlight rectangle at the move origin', () => {
    const { container } = render(
      <GridBoard lastMoveOrigin={{ x: 2, y: 3 }}>
        <UnitModel type="K" x={5} y={5} ownerId="p1" hp={10} maxHp={10} ap={3} maxAp={3} />
      </GridBoard>,
    )
    // Should have a highlight rect at origin
    const highlightRect = container.querySelector('[data-testid="last-move-origin"]')
    expect(highlightRect).toBeTruthy()
    expect(highlightRect!.getAttribute('x')).toBe('200') // x * tileSize
    expect(highlightRect!.getAttribute('y')).toBe('300') // y * tileSize
  })

  it('renders a highlight rectangle at the move destination', () => {
    const { container } = render(
      <GridBoard lastMoveDestination={{ x: 5, y: 5 }}>
        <UnitModel type="K" x={5} y={5} ownerId="p1" hp={10} maxHp={10} ap={3} maxAp={3} />
      </GridBoard>,
    )
    const highlightRect = container.querySelector('[data-testid="last-move-destination"]')
    expect(highlightRect).toBeTruthy()
    expect(highlightRect!.getAttribute('x')).toBe('500')
    expect(highlightRect!.getAttribute('y')).toBe('500')
  })

  it('does not render highlights when no lastMove props provided', () => {
    const { container } = render(
      <GridBoard>
        <UnitModel type="K" x={0} y={0} ownerId="p1" hp={10} maxHp={10} ap={3} maxAp={3} />
      </GridBoard>,
    )
    const originRects = container.querySelectorAll('[data-testid="last-move-origin"]')
    const destRects = container.querySelectorAll('[data-testid="last-move-destination"]')
    expect(originRects.length).toBe(0)
    expect(destRects.length).toBe(0)
  })
})

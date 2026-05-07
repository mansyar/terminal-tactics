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

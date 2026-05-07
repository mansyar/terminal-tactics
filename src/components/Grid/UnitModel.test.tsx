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
        <UnitModel type="K" x={3} y={4} ownerId="p2" ap={2} maxAp={2} />
      </svg>,
    )
    expect(container.querySelector('g')).toBeTruthy()
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
          ap={3}
          maxAp={3}
        />
      </svg>,
    )
    const unitGroup = container.querySelector('g')
    expect(unitGroup).toBeTruthy()
  })
})

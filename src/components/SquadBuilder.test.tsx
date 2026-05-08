import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { UNIT_TEMPLATES } from '../../convex/squadBuilder'
import { SquadBuilder } from './SquadBuilder'

afterEach(cleanup)

const defaultProps = { onDeploy: mock(), isP1: true }

describe('SquadBuilder', () => {
  it('renders the squad builder title', () => {
    render(<SquadBuilder {...defaultProps} />)
    expect(screen.getByText('Squad_Initialization')).toBeTruthy()
  })

  it('shows all 4 unit type buttons', () => {
    render(<SquadBuilder {...defaultProps} />)
    for (const [, stats] of Object.entries(UNIT_TEMPLATES)) {
      expect(screen.getByText(stats.label, { exact: false })).toBeTruthy()
    }
  })

  it('adding a unit shows it in the manifest', () => {
    render(<SquadBuilder {...defaultProps} />)

    const knightBtn = screen.getByText(/Knight/).closest('button')!
    fireEvent.click(knightBtn)

    expect(screen.getByText('[K]')).toBeTruthy()
  })

  it('shows remaining credits decreasing after adding a unit', () => {
    render(<SquadBuilder {...defaultProps} />)

    const knightCost = UNIT_TEMPLATES['K'].cost
    const remainingLabel = `CREDITS_REMAINING: ${1000 - knightCost}`

    const knightBtn = screen.getByText(/Knight/).closest('button')!
    fireEvent.click(knightBtn)

    expect(screen.getByText(remainingLabel)).toBeTruthy()
  })

  it('disables deploy button when squad is empty', () => {
    render(<SquadBuilder {...defaultProps} />)

    const deployBtn = screen.getByText('Initiate_Deployment_Sequence')
    expect((deployBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('disables deploy button when squad has only 1 unit', () => {
    render(<SquadBuilder {...defaultProps} />)

    const knightBtn = screen.getByText(/Knight/).closest('button')!
    fireEvent.click(knightBtn)

    const deployBtn = screen.getByText('Initiate_Deployment_Sequence')
    expect((deployBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('enables deploy button when squad has 2+ units', () => {
    render(<SquadBuilder {...defaultProps} />)

    fireEvent.click(screen.getByText(/Knight/).closest('button')!)
    fireEvent.click(screen.getByText(/Archer/).closest('button')!)

    const deployBtn = screen.getByText('Initiate_Deployment_Sequence')
    expect((deployBtn as HTMLButtonElement).disabled).toBe(false)
  })

  it('calls onDeploy with the correct squad when deployed', () => {
    const onDeploy = mock()
    render(<SquadBuilder onDeploy={onDeploy} isP1={true} />)

    fireEvent.click(screen.getByText(/Knight/).closest('button')!)
    fireEvent.click(screen.getByText(/Archer/).closest('button')!)

    fireEvent.click(screen.getByText('Initiate_Deployment_Sequence'))

    expect(onDeploy).toHaveBeenCalledTimes(1)
    expect(onDeploy).toHaveBeenCalledWith(['K', 'A'])
  })

  it('removes a unit when clicking on it in the manifest', () => {
    render(<SquadBuilder {...defaultProps} />)

    fireEvent.click(screen.getByText(/Knight/).closest('button')!)
    expect(screen.getByText('[K]')).toBeTruthy()

    fireEvent.click(screen.getByText('[K]'))
    expect(screen.queryByText('[K]')).toBeNull()
  })

  it('shows the MINIMUM_2_UNITS_REQUIRED error when 1 unit is selected', () => {
    render(<SquadBuilder {...defaultProps} />)

    fireEvent.click(screen.getByText(/Knight/).closest('button')!)

    expect(screen.getByText('> ERROR: MINIMUM_2_UNITS_REQUIRED')).toBeTruthy()
  })
})

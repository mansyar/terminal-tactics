import { describe, expect, it } from 'bun:test'
import { render } from '@testing-library/react'

// Import jest-dom matchers for accessible DOM queries (side-effect only)
import '@testing-library/jest-dom'

describe('Accessibility Testing Infrastructure (Task 2.0)', () => {
  it('toHaveAccessibleName matcher works', () => {
    const { container } = render(<button aria-label="Close menu">X</button>)
     
    expect(container.querySelector('button') as any).toHaveAccessibleName(
      'Close menu',
    )
  })

  it('toHaveRole matcher works', () => {
    const { container } = render(<button aria-label="Submit">Go</button>)
     
    expect(container.querySelector('button') as any).toHaveRole('button')
  })

  it('toHaveAccessibleDescription matcher works', () => {
    const { container } = render(<button aria-describedby="desc">Save</button>)
    const desc = document.createElement('div')
    desc.id = 'desc'
    desc.textContent = 'Saves the current document'
    document.body.appendChild(desc)
     
    expect(
      container.querySelector('button') as any,
    ).toHaveAccessibleDescription('Saves the current document')
    document.body.removeChild(desc)
  })
})

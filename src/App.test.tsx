import { describe, expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import App from './App.tsx'

// Mock the Convex React Client
const mockConvex = new ConvexReactClient('https://mock.convex.cloud')

// Mock scrollIntoView for JSDOM
Element.prototype.scrollIntoView = () => {}

describe('App', () => {
  test('renders', () => {
    // We need to wrap App in ConvexProvider because it uses useQuery
    render(
      <ConvexProvider client={mockConvex}>
        <App />
      </ConvexProvider>,
    )
    expect(screen.getByText(/VIEWPORT_01/i)).toBeDefined()
  })
})

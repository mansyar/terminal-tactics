import { describe, expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import App from './App.tsx'

// Mock the Convex React Client
const mockConvex = new ConvexReactClient('https://mock.convex.cloud')

// Mock scrollIntoView for JSDOM
// Mock scrollIntoView for JSDOM
Element.prototype.scrollIntoView = () => {}

// Mock localStorage
const localStorageMock = (function () {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    clear: () => {
      store = {}
    },
    removeItem: (key: string) => {
      delete store[key]
    },
  }
})()

// @ts-ignore -- Polyfilling localStorage for JSDOM
global.localStorage = localStorageMock
// @ts-ignore -- Polyfilling window.localStorage if window exists
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true, // Ensure it can be written
  })
}

describe('App', () => {
  test('renders', () => {
    // We need to wrap App in ConvexProvider because it uses useQuery
    render(
      <ConvexProvider client={mockConvex}>
        <App />
      </ConvexProvider>,
    )
    expect(screen.getByText(/TERMINAL_TACTICS/i)).toBeDefined()
  })
})

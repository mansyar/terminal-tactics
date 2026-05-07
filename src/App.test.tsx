import { describe, expect, mock, test } from 'bun:test'
import { render, screen } from '@testing-library/react'

// Mock convex/react to prevent WebSocket connection attempts
mock.module('convex/react', () => ({
  ConvexProvider: ({ children }: { children: any }) => children,
  useQuery: () => undefined,
  useMutation: () => () => {},
  useAction: () => () => {},
}))

// Must import App after mocking convex/react
const { default: App } = await import('./App.tsx')

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
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })
}

describe('App', () => {
  test('renders', () => {
    render(<App />)
    expect(screen.getByText(/TERMINAL_TACTICS/i)).toBeDefined()
  })
})

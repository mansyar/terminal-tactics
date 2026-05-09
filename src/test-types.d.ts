// Extend bun:test's Matchers with @testing-library/jest-dom matchers
import 'vitest'
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare module 'bun:test' {
  interface Matchers<T> extends TestingLibraryMatchers<any, T> {}
}

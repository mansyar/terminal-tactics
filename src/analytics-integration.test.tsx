import { describe, expect, it, mock } from 'bun:test'

// Mock convex/react to prevent WebSocket connection attempts
mock.module('convex/react', () => ({
  ConvexProvider: ({ children }: any) => children,
  useQuery: () => undefined,
  useMutation: () => mock(() => Promise.resolve({})),
  useAction: () => () => {},
}))

describe('Analytics Frontend Integration', () => {
  it('exports logAnalyticsEvent from convex API', async () => {
    const api = await import('../convex/_generated/api')
    expect((api.api as any).analytics).toBeDefined()
    expect((api.api as any).analytics.logAnalyticsEvent).toBeDefined()
    expect((api.api as any).analytics.getAnalyticsSummary).toBeDefined()
  })
})

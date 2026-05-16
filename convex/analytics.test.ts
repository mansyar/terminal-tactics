import { beforeEach, describe, expect, it, mock } from 'bun:test'
import {
  getAnalyticsSummaryHandler,
  logAnalyticsEventHandler,
} from './analytics'

const mockInsert = mock((): any => 'analytics-event-id')
const mockCollect = mock((): any => [])
const mockQuery = mock((): any => ({ collect: mockCollect }))

const mockDb = {
  insert: mockInsert,
  query: mockQuery,
}

const mockCtx = { db: mockDb } as any

describe('Analytics - logAnalyticsEvent', () => {
  beforeEach(() => {
    mockInsert.mockClear()
    mockQuery.mockClear()
  })

  it('inserts a PAGE_LOAD event with correct fields', async () => {
    const result = await logAnalyticsEventHandler(mockCtx, {
      eventType: 'PAGE_LOAD',
      timestamp: 1700000000000,
    })

    expect(result).toBe('analytics-event-id')
    expect(mockInsert).toHaveBeenCalledTimes(1)
    const call = mockInsert.mock.calls[0] as any
    expect(call[0]).toBe('analytics_events')
    expect(call[1].eventType).toBe('PAGE_LOAD')
    expect(call[1].timestamp).toBe(1700000000000)
  })

  it('inserts a GAME_START event', async () => {
    await logAnalyticsEventHandler(mockCtx, {
      eventType: 'GAME_START',
      timestamp: 1700000001000,
    })

    expect(mockInsert).toHaveBeenCalledTimes(1)
    const call = mockInsert.mock.calls[0] as any
    expect(call[1].eventType).toBe('GAME_START')
  })

  it('inserts a GAME_COMPLETE event', async () => {
    await logAnalyticsEventHandler(mockCtx, {
      eventType: 'GAME_COMPLETE',
      timestamp: 1700000002000,
    })

    expect(mockInsert).toHaveBeenCalledTimes(1)
    const call = mockInsert.mock.calls[0] as any
    expect(call[1].eventType).toBe('GAME_COMPLETE')
  })

  it('includes optional metadata when provided', async () => {
    await logAnalyticsEventHandler(mockCtx, {
      eventType: 'GAME_COMPLETE',
      timestamp: 1700000002000,
      metadata: { winner: 'p1', turns: 12 },
    })

    const call = mockInsert.mock.calls[0] as any
    expect(call[1].metadata).toEqual({ winner: 'p1', turns: 12 })
  })

  it('rejects invalid event type', () => {
    expect(
      logAnalyticsEventHandler(mockCtx, {
        eventType: 'INVALID_EVENT',
        timestamp: 1700000000000,
      }),
    ).rejects.toThrow()
  })
})

describe('Analytics - getAnalyticsSummary', () => {
  beforeEach(() => {
    mockQuery.mockClear()
  })

  it('returns aggregated event counts', async () => {
    const mockEvents = mock(() => [
      { eventType: 'PAGE_LOAD', timestamp: 1000 },
      { eventType: 'PAGE_LOAD', timestamp: 2000 },
      { eventType: 'GAME_START', timestamp: 3000 },
      { eventType: 'GAME_COMPLETE', timestamp: 4000 },
      { eventType: 'GAME_COMPLETE', timestamp: 5000 },
    ])
    mockQuery.mockReturnValue({ collect: mockEvents } as any)

    const summary = await getAnalyticsSummaryHandler(mockCtx, { limit: 100 })

    expect(summary).toEqual({
      total: 5,
      events: {
        PAGE_LOAD: 2,
        GAME_START: 1,
        GAME_COMPLETE: 2,
      },
      recent: [
        { eventType: 'PAGE_LOAD', timestamp: 1000 },
        { eventType: 'PAGE_LOAD', timestamp: 2000 },
        { eventType: 'GAME_START', timestamp: 3000 },
        { eventType: 'GAME_COMPLETE', timestamp: 4000 },
        { eventType: 'GAME_COMPLETE', timestamp: 5000 },
      ],
    })
  })

  it('returns empty summary when no events exist', async () => {
    const mockEmpty = mock(() => [])
    mockQuery.mockReturnValue({ collect: mockEmpty } as any)

    const summary = await getAnalyticsSummaryHandler(mockCtx, { limit: 100 })

    expect(summary).toEqual({
      total: 0,
      events: {
        PAGE_LOAD: 0,
        GAME_START: 0,
        GAME_COMPLETE: 0,
      },
      recent: [],
    })
  })
})

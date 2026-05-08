import { describe, expect, it } from 'bun:test'
import {
  isDisconnected,
  isGraceExpired,
  shouldSendHeartbeat,
} from './heartbeat'

describe('shouldSendHeartbeat', () => {
  it('returns true when enough time has passed since last sent', () => {
    const result = shouldSendHeartbeat(1000, 10_000, 12_000)
    expect(result).toBe(true) // 11s gap > 10s interval
  })

  it('returns false when within the interval', () => {
    const result = shouldSendHeartbeat(1000, 10_000, 8_000)
    expect(result).toBe(false) // 7s gap < 10s interval
  })

  it('returns true when lastSent is null (never sent)', () => {
    const result = shouldSendHeartbeat(null, 10_000, 5000)
    expect(result).toBe(true)
  })
})

describe('isDisconnected', () => {
  it('returns true after 30s threshold', () => {
    const result = isDisconnected(1000, 30_000, 35_000)
    expect(result).toBe(true) // 34s gap > 30s threshold
  })

  it('returns false when within threshold', () => {
    const result = isDisconnected(1000, 30_000, 25_000)
    expect(result).toBe(false) // 24s gap < 30s threshold
  })

  it('returns false when lastHeartbeat is undefined', () => {
    const result = isDisconnected(undefined, 30_000, 50_000)
    expect(result).toBe(false)
  })
})

describe('isGraceExpired', () => {
  it('returns true after 2-minute grace period', () => {
    const result = isGraceExpired(1000, 120_000, 125_000)
    expect(result).toBe(true) // 124s gap > 120s grace
  })

  it('returns false when within grace period', () => {
    const result = isGraceExpired(1000, 120_000, 60_000)
    expect(result).toBe(false) // 59s gap < 120s grace
  })

  it('returns false when disconnectStartTime is undefined', () => {
    const result = isGraceExpired(undefined, 120_000, 200_000)
    expect(result).toBe(false)
  })
})

// ===========================================================================
// TabCoordinator — BroadcastChannel-based multi-tab prevention
// ===========================================================================

const CHANNEL_PREFIX = 'tt-tab-coord-'
const PING_INTERVAL_MS = 1_000
const ORPHAN_TIMEOUT_MS = 2_500

export type TabMessageType = 'tab-joined' | 'tab-left' | 'ping'

export interface TabMessage {
  type: TabMessageType
  gameId: string
  tabId: string
  timestamp: number
}

export type TabCallback = (message: TabMessage) => void

// ===========================================================================
// Pure Functions (testable)
// ===========================================================================

export function createChannelName(gameId: string): string {
  return `${CHANNEL_PREFIX}${gameId}`
}

export function isValidMessage(data: unknown): data is TabMessage {
  if (!data || typeof data !== 'object') return false

  const msg = data as Record<string, unknown>
  if (typeof msg.type !== 'string') return false
  if (!['tab-joined', 'tab-left', 'ping'].includes(msg.type)) return false
  if (typeof msg.gameId !== 'string') return false
  if (typeof msg.tabId !== 'string') return false
  if (typeof msg.timestamp !== 'number') return false

  return true
}

// ===========================================================================
// TabCoordinator Class
// ===========================================================================

export class TabCoordinator {
  private channel: BroadcastChannel | null = null
  private gameId: string
  private tabId: string
  private onSecondaryTabDetected: TabCallback | null = null
  private onPrimaryAbsent: (() => void) | null = null
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private lastPingTime = 0
  private isPrimary = true
  private orphanCheckInterval: ReturnType<typeof setInterval> | null = null

  constructor(
    gameId: string,
    callbacks: {
      onSecondaryTabDetected?: TabCallback
      onPrimaryAbsent?: () => void
    } = {},
  ) {
    this.gameId = gameId
    this.tabId = crypto.randomUUID()
    this.onSecondaryTabDetected = callbacks.onSecondaryTabDetected ?? null
    this.onPrimaryAbsent = callbacks.onPrimaryAbsent ?? null
  }

  start(): void {
    if (this.channel) return // Already started

    this.channel = new BroadcastChannel(createChannelName(this.gameId))

    this.channel.onmessage = (event: MessageEvent) => {
      const data = event.data
      if (!isValidMessage(data)) return

      if (data.type === 'tab-joined' && data.tabId !== this.tabId) {
        // Another tab joined the same game — we're the secondary
        this.isPrimary = false
        this.onSecondaryTabDetected?.(data)
      }

      if (data.type === 'ping' && data.tabId !== this.tabId) {
        // Track latest ping from the primary tab
        this.lastPingTime = data.timestamp
      }
    }

    // Announce this tab's presence
    this.broadcast('tab-joined')

    // Send periodic pings
    this.pingInterval = setInterval(() => {
      this.broadcast('ping')
    }, PING_INTERVAL_MS)

    // Orphan detection: check if primary tab has gone silent
    this.orphanCheckInterval = setInterval(() => {
      if (!this.isPrimary) {
        const elapsed = Date.now() - this.lastPingTime
        if (elapsed > ORPHAN_TIMEOUT_MS) {
          // Primary tab is gone — promote this tab to primary
          this.isPrimary = true
          this.onPrimaryAbsent?.()
        }
      }
    }, PING_INTERVAL_MS)

    // Clean up on tab close
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  }

  stop(): void {
    this.broadcast('tab-left')

    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }

    if (this.orphanCheckInterval) {
      clearInterval(this.orphanCheckInterval)
      this.orphanCheckInterval = null
    }

    if (this.channel) {
      this.channel.close()
      this.channel = null
    }

    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  }

  isPrimaryTab(): boolean {
    return this.isPrimary
  }

  private handleBeforeUnload = (): void => {
    this.broadcast('tab-left')
  }

  private broadcast(type: TabMessageType): void {
    if (!this.channel) return
    this.channel.postMessage({
      type,
      gameId: this.gameId,
      tabId: this.tabId,
      timestamp: Date.now(),
    } satisfies TabMessage)
  }
}

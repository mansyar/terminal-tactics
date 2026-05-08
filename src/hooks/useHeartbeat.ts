import { useEffect, useRef } from 'react'
import { shouldSendHeartbeat } from '../lib/heartbeat'

const HEARTBEAT_INTERVAL_MS = 10_000

interface UseHeartbeatParams {
  gameId: any
  playerId: string
  heartbeatMutation: (args: any) => void
  enabled: boolean
}

export function useHeartbeat({
  gameId,
  playerId,
  heartbeatMutation,
  enabled,
}: UseHeartbeatParams) {
  const lastSentRef = useRef<number | null>(null)

  // Keep mutation ref updated to avoid stale closure
  const heartbeatRef = useRef(heartbeatMutation)
  heartbeatRef.current = heartbeatMutation

  useEffect(() => {
    if (!enabled || !gameId) return

    const sendHeartbeatIfNeeded = () => {
      // Skip if tab is hidden (Page Visibility API)
      if (document.hidden) return

      const now = Date.now()
      if (
        shouldSendHeartbeat(lastSentRef.current, HEARTBEAT_INTERVAL_MS, now)
      ) {
        lastSentRef.current = now
        heartbeatRef.current({ gameId, playerId })
      }
    }

    // Send immediate heartbeat on mount
    sendHeartbeatIfNeeded()

    // Periodic heartbeat interval
    const intervalId = setInterval(sendHeartbeatIfNeeded, HEARTBEAT_INTERVAL_MS)

    // On tab re-show, send an immediate heartbeat
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        sendHeartbeatIfNeeded()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      lastSentRef.current = null
    }
  }, [gameId, playerId, enabled])
}

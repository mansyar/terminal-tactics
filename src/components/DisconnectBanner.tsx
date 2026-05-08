interface DisconnectBannerProps {
  opponentStatus: string | null
  myStatus: string | null
  remainingGraceMs: number | null
  onReconnected?: () => void
}

export function DisconnectBanner({
  opponentStatus,
  myStatus,
  remainingGraceMs,
}: DisconnectBannerProps) {
  // Own disconnect detected
  if (myStatus === 'disconnected') {
    return (
      <div className="border border-yellow-500/50 bg-yellow-900/10 p-3 text-center animate-pulse">
        <span className="text-yellow-400 font-mono text-sm">
          CONNECTION_LOST — Attempting reconnection...
        </span>
      </div>
    )
  }

  // Opponent disconnected
  if (opponentStatus === 'disconnected' && remainingGraceMs !== null) {
    const graceSeconds = Math.ceil(remainingGraceMs / 1000)
    const minutes = Math.floor(graceSeconds / 60)
    const seconds = graceSeconds % 60
    const graceStr = `${minutes}:${seconds.toString().padStart(2, '0')}`

    const isUrgent = graceSeconds <= 30
    const isWarning = graceSeconds <= 60 && !isUrgent

    return (
      <div
        className={`border p-3 text-center font-mono text-sm ${
          isUrgent
            ? 'border-red-500 text-red-400 animate-pulse'
            : isWarning
              ? 'border-yellow-500 text-yellow-400'
              : 'border-red-500/50 text-red-300'
        }`}
      >
        <span>ENEMY_DISCONNECTED — Grace: {graceStr}</span>
      </div>
    )
  }

  // Not disconnected — show nothing
  return null
}

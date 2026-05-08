/**
 * Returns true if enough time has passed since the last heartbeat was sent.
 */
export function shouldSendHeartbeat(
  lastSent: number | null,
  intervalMs: number,
  now: number,
): boolean {
  if (lastSent === null) return true
  return now - lastSent >= intervalMs
}

/**
 * Returns true if the player has been inactive past the disconnect threshold.
 */
export function isDisconnected(
  lastHeartbeat: number | undefined,
  thresholdMs: number,
  now: number,
): boolean {
  if (lastHeartbeat === undefined) return false
  return now - lastHeartbeat > thresholdMs
}

/**
 * Returns true if the grace period has expired since the disconnect started.
 */
export function isGraceExpired(
  disconnectStartTime: number | undefined,
  graceMs: number,
  now: number,
): boolean {
  if (disconnectStartTime === undefined) return false
  return now - disconnectStartTime > graceMs
}

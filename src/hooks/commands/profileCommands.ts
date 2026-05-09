import { cleanErrorMessage } from '../../lib/utils'
import { playError, playSuccess } from '../../lib/audio'

export interface ProfileCommandContext {
  playerId: string
  gameState: any
  matchHistory?: Array<any>
  mutations: {
    setHandle: any
  }
}

export async function handleHandleCommand(
  ctx: ProfileCommandContext,
  args: Array<string>,
): Promise<{ result: string; visibility: 'public' | 'private' }> {
  const [newHandle] = args

  if (!newHandle) {
    playError()
    return {
      result: 'ERROR: MISSING_HANDLE. USAGE: handle [name]',
      visibility: 'public',
    }
  }

  try {
    const res = await ctx.mutations.setHandle({
      userId: ctx.playerId,
      newHandle,
    })
    playSuccess()
    return { result: `HANDLE_SET: ${res.handle}`, visibility: 'public' }
  } catch (err: any) {
    playError()
    return {
      result: `ERROR: ${cleanErrorMessage(err.message)}`,
      visibility: 'public',
    }
  }
}

export async function handleHistoryCommand(
  ctx: ProfileCommandContext,
): Promise<{ result: string; visibility: 'public' | 'private' }> {
  const { matchHistory, playerId, gameState } = ctx

  if (!matchHistory || matchHistory.length === 0) {
    playSuccess()
    return { result: 'NO_MATCHES_FOUND', visibility: 'public' }
  }

  const entries = matchHistory.slice(0, 20)
  const myPlayerKey = gameState.p1 === playerId ? 'p1' : ('p2' as const)
  const opponentKey = myPlayerKey === 'p1' ? 'p2' : 'p1'

  const rows = entries.map((match: any, i: number) => {
    const isWin =
      match.winner === myPlayerKey
        ? true
        : match.winner === opponentKey
          ? false
          : undefined
    const resultLabel =
      isWin === true ? 'WIN' : isWin === false ? 'LOSS' : 'DRAW'
    const opponentHandle = match[`${opponentKey}Handle`]
    const minutes = Math.floor(match.duration / 60000)
    const seconds = Math.round((match.duration % 60000) / 1000)
    const durationStr = `${minutes}m ${seconds}s`
    return `  ${String(i + 1).padStart(2)}  │ ${opponentHandle.padEnd(10)} │ ${resultLabel.padEnd(5)} │ ${String(match.turns).padEnd(7)} │ ${durationStr.padEnd(7)}`
  })

  const asciiTable =
    '┌──────┬────────────┬──────────┬──────────┬──────────┐\n' +
    '│ #    │ Opponent   │ Result   │ Turns    │ Duration │\n' +
    '├──────┼────────────┼──────────┼──────────┼──────────┤\n' +
    rows.join('\n') +
    '\n' +
    '└──────┴────────────┴──────────┴──────────┴──────────┘'

  playSuccess()
  return { result: asciiTable, visibility: 'private' }
}

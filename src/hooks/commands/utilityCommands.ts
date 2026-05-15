import { playError, playSuccess } from '../../lib/audio'
import { parseCoord } from '../../lib/utils'

export function handleInspectCommand(
  gameState: any,
  args: Array<string>,
): { result: string; logVisibility: 'public' | 'private' } {
  const [coord] = args
  const target = parseCoord(coord)
  if (!target) {
    playError()
    return {
      result: 'ERROR: MISSING_COORD. USAGE: inspect [coord]',
      logVisibility: 'public',
    }
  }
  const unit = gameState.units.find(
    (u: any) => u.x === target.x && u.y === target.y,
  )
  playSuccess()
  if (!unit) {
    return {
      result: `NOTICE: NO_UNIT_DETECTED_AT ${target.label}`,
      logVisibility: 'private',
    }
  }
  let result = `UNIT_ID: [${unit.type}] | OWNER: ${unit.ownerId.toUpperCase()} | HP: ${unit.hp}/${unit.maxHp} | AP: ${unit.ap}/${unit.maxAp} | ATK: ${unit.atk} | RNG: ${unit.rng} | POS: ${target.label}`
  if (unit.isOverwatching)
    result += ` | OVERWATCHING: ${unit.overwatchDirection}`
  if (unit.isStealthed) result += ` | STEALTHED`
  return { result, logVisibility: 'private' }
}

export interface UtilityCommandContext {
  playerId: string
  gameState: any
  mutations: {
    forfeit: any
    offerDraw: any
    acceptDraw: any
    sendMessage: any
  }
}

export async function handleForfeitCommand(
  ctx: UtilityCommandContext,
): Promise<string> {
  await ctx.mutations.forfeit({
    gameId: ctx.gameState._id,
    playerId: ctx.playerId,
  })
  playSuccess()
  return 'FORFEIT_ACCEPTED. INITIATING_SHUTDOWN.'
}

export async function handleOfferDrawCommand(
  ctx: UtilityCommandContext,
): Promise<string> {
  await ctx.mutations.offerDraw({
    gameId: ctx.gameState._id,
    playerId: ctx.playerId,
  })
  playSuccess()
  return 'DRAW_OFFER_TRANSMITTED'
}

export async function handleAcceptDrawCommand(
  ctx: UtilityCommandContext,
): Promise<string> {
  try {
    await ctx.mutations.acceptDraw({
      gameId: ctx.gameState._id,
      playerId: ctx.playerId,
    })
    playSuccess()
    return 'DRAW_ACCEPTED. CONNECTION_TERMINATED.'
  } catch (err: any) {
    playError()
    return `ERROR: ${(err as Error).message}`
  }
}

export async function handleSayCommand(
  ctx: UtilityCommandContext,
  args: Array<string>,
): Promise<string> {
  const message = args.join(' ')
  if (message) {
    await ctx.mutations.sendMessage({
      gameId: ctx.gameState._id,
      playerId: ctx.playerId,
      message,
    })
    playSuccess()
    return 'MSG_SENT'
  }
  return ''
}

import { playError, playSuccess } from '../../lib/audio'

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

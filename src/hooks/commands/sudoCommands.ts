import { cleanErrorMessage, parseCoord } from '../../lib/utils'
import { playAttack, playError, playSuccess } from '../../lib/audio'

export interface SudoCommandContext {
  playerId: string
  gameState: any
  mutations: {
    sudoMove: any
    sudoScan: any
    sudoAttack: any
  }
}

export async function handleSudoMoveCommand(
  ctx: SudoCommandContext,
  args: Array<string>,
): Promise<string> {
  const [unitCoord, targetCoord] = args
  const unitPos = parseCoord(unitCoord)
  const targetPos = parseCoord(targetCoord)

  if (!unitPos || !targetPos) {
    playError()
    return 'ERROR: INVALID_ARGS. USAGE: sudo mv [unit] [target]'
  }

  const unit = ctx.gameState.units.find(
    (u: any) => u.x === unitPos.x && u.y === unitPos.y,
  )

  if (!unit) {
    playError()
    return `ERROR: NO_UNIT_AT ${unitPos.label}`
  }

  try {
    await ctx.mutations.sudoMove({
      gameId: ctx.gameState._id,
      playerId: ctx.playerId,
      unitId: unit._id,
      targetX: targetPos.x,
      targetY: targetPos.y,
    })
    playSuccess()
    return `SUDO_MOVE: [${unit.type}] bypassed security to ${targetPos.label}`
  } catch (err: any) {
    playError()
    return `ERROR: ${cleanErrorMessage(err.message)}`
  }
}

export async function handleSudoScanCommand(
  ctx: SudoCommandContext,
): Promise<string> {
  try {
    await ctx.mutations.sudoScan({
      gameId: ctx.gameState._id,
      playerId: ctx.playerId,
    })
    playSuccess()
    return 'SUDO_SCAN: FULL_MAP_DECRYPTED'
  } catch (err: any) {
    playError()
    return `ERROR: ${cleanErrorMessage(err.message)}`
  }
}

export async function handleSudoAttackCommand(
  ctx: SudoCommandContext,
  args: Array<string>,
): Promise<string> {
  const [atkCoord, targetCoord] = args
  const atkPos = parseCoord(atkCoord)
  const targetPos = parseCoord(targetCoord)

  if (!atkPos || !targetPos) {
    playError()
    return 'ERROR: INVALID_ARGS. USAGE: sudo atk [atk] [target]'
  }

  const attacker = ctx.gameState.units.find(
    (u: any) => u.x === atkPos.x && u.y === atkPos.y,
  )
  const defender = ctx.gameState.units.find(
    (u: any) => u.x === targetPos.x && u.y === targetPos.y,
  )

  if (!attacker || !defender) {
    playError()
    return 'ERROR: UNIT_NOT_FOUND'
  }

  try {
    const res = await ctx.mutations.sudoAttack({
      gameId: ctx.gameState._id,
      playerId: ctx.playerId,
      attackerId: attacker._id,
      targetId: defender._id,
      damage: 0,
    })
    playAttack()
    let result = `SUDO_ATTACK: [${attacker.type}] dealt ${res.damage} DMG to [${defender.type}] bypassing systems.`
    if (res.destroyed) result += ' [ELIMINATED]'
    return result
  } catch (err: any) {
    playError()
    return `ERROR: ${cleanErrorMessage(err.message)}`
  }
}

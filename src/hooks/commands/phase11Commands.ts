import { cleanErrorMessage, parseCoord } from '../../lib/utils'
import { playError, playSuccess } from '../../lib/audio'
import { renderMapAscii } from '../../lib/mapPreviewer'
import { PRESET_MAPS } from '../../lib/mapPresets'

export interface Phase11CommandContext {
  playerId: string
  gameState: any
  mutations: {
    buildWall: any
    demolishWall: any
    useRally: any
  }
}

export async function handleBuildCommand(
  ctx: Phase11CommandContext,
  args: Array<string>,
): Promise<string> {
  const [coord] = args
  const target = parseCoord(coord)

  if (!target) {
    playError()
    return 'ERROR: INVALID_ARGUMENTS. USAGE: build [coord]'
  }

  const engineer = ctx.gameState.units.find(
    (u: any) =>
      u.ownerId ===
        (ctx.gameState.currentPlayer === 'p1'
          ? ctx.gameState.p1
          : ctx.gameState.p2) &&
      u.type === 'E' &&
      u.ap >= 1,
  )

  if (!engineer) {
    playError()
    return 'ERROR: NO_ENGINEER_WITH_AP'
  }

  try {
    await ctx.mutations.buildWall({
      gameId: ctx.gameState._id,
      playerId: ctx.playerId,
      unitId: engineer._id,
      targetX: target.x,
      targetY: target.y,
    })
    playSuccess()
    return `BUILD_SUCCESS: Engineer [${engineer.type}] built wall at ${target.label}.`
  } catch (err: any) {
    playError()
    return `ERROR: ${cleanErrorMessage(err.message)}`
  }
}

export async function handleDemolishCommand(
  ctx: Phase11CommandContext,
  args: Array<string>,
): Promise<string> {
  const [coord] = args
  const target = parseCoord(coord)

  if (!target) {
    playError()
    return 'ERROR: INVALID_ARGUMENTS. USAGE: demolish [coord]'
  }

  const engineer = ctx.gameState.units.find(
    (u: any) =>
      u.ownerId ===
        (ctx.gameState.currentPlayer === 'p1'
          ? ctx.gameState.p1
          : ctx.gameState.p2) &&
      u.type === 'E' &&
      u.ap >= 1,
  )

  if (!engineer) {
    playError()
    return 'ERROR: NO_ENGINEER_WITH_AP'
  }

  try {
    await ctx.mutations.demolishWall({
      gameId: ctx.gameState._id,
      playerId: ctx.playerId,
      unitId: engineer._id,
      targetX: target.x,
      targetY: target.y,
    })
    playSuccess()
    return `DEMOLISH_SUCCESS: Engineer [${engineer.type}] demolished wall at ${target.label}.`
  } catch (err: any) {
    playError()
    return `ERROR: ${cleanErrorMessage(err.message)}`
  }
}

export async function handleRallyCommand(
  ctx: Phase11CommandContext,
  args: Array<string>,
): Promise<string> {
  const [coord] = args
  const target = parseCoord(coord)

  if (!target) {
    playError()
    return 'ERROR: INVALID_ARGUMENTS. USAGE: rally [coord]'
  }

  const commander = ctx.gameState.units.find(
    (u: any) =>
      u.ownerId ===
        (ctx.gameState.currentPlayer === 'p1'
          ? ctx.gameState.p1
          : ctx.gameState.p2) &&
      u.type === 'C' &&
      u.ap >= 1,
  )

  if (!commander) {
    playError()
    return 'ERROR: NO_COMMANDER_WITH_AP'
  }

  try {
    await ctx.mutations.useRally({
      gameId: ctx.gameState._id,
      playerId: ctx.playerId,
      commanderId: commander._id,
      targetX: target.x,
      targetY: target.y,
    })
    playSuccess()
    return `RALLY_SUCCESS: Commander rallied allies at ${target.label}.`
  } catch (err: any) {
    playError()
    return `ERROR: ${cleanErrorMessage(err.message)}`
  }
}

export function handleMapCommand(gameState: any): {
  result: string
  logVisibility: 'public' | 'private'
} {
  const presetName = gameState.mapPreset
  if (presetName && presetName in PRESET_MAPS) {
    const mapData = PRESET_MAPS[presetName]
    return {
      result: `MAP_PREVIEW: "${mapData.name}"\n${renderMapAscii(mapData)}`,
      logVisibility: 'private',
    }
  }

  if (gameState.mapData?.tiles?.length) {
    const mapData = {
      name: 'CURRENT_MAP',
      description: '',
      tiles: gameState.mapData.tiles,
    }
    return {
      result: `MAP_PREVIEW: "CURRENT_MAP"\n${renderMapAscii(mapData)}`,
      logVisibility: 'private',
    }
  }

  return { result: 'ERROR: NO_MAP_AVAILABLE', logVisibility: 'public' }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { isBot } from '../lib/botDetection'
import { parseCommand } from '../lib/commandParser'
import { cleanErrorMessage, parseCoord } from '../lib/utils'
import {
  playAttack,
  playError,
  playHeal,
  playKernelPanic,
  playSuccess,
  playTurnEnd,
} from '../lib/audio'
import { useGameDerivedState } from './useGameDerivedState'
import {
  handleHandleCommand,
  handleHistoryCommand,
} from './commands/profileCommands'
import {
  handleSudoAttackCommand,
  handleSudoMoveCommand,
  handleSudoScanCommand,
} from './commands/sudoCommands'
import {
  handleBuildCommand,
  handleDemolishCommand,
  handleMapCommand,
  handleRallyCommand,
} from './commands/phase11Commands'
import {
  handleAcceptDrawCommand,
  handleForfeitCommand,
  handleOfferDrawCommand,
  handleSayCommand,
} from './commands/utilityCommands'

export interface GameMutations {
  logCommand: any
  setTyping: any
  endTurn: any
  moveUnit: any
  attackUnit: any
  healUnit: any
  scanArea: any
  setOverwatch: any
  sudoMove: any
  sudoScan: any
  sudoAttack: any
  forfeit: any
  offerDraw: any
  acceptDraw: any
  sendMessage: any
  checkDraftTimeout: any
  checkTurnTimeout: any
  checkDisconnect: any
  checkDisconnectGracePeriod: any
  heartbeat: any
  setHandle: any
  buildWall: any
  demolishWall: any
  useRally: any
  aiTurn: any
}

interface UseGameCommandsParams {
  playerId: string
  gameState: any
  logs: any
  mutations: GameMutations
  matchHistory?: Array<any>
}

export function useGameCommands({
  playerId,
  gameState,
  logs,
  mutations,
  matchHistory,
}: UseGameCommandsParams) {
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null)
  const [showCoordinates, setShowCoordinates] = useState(true)
  const [lastMoveOrigin, setLastMoveOrigin] = useState<{
    x: number
    y: number
  } | null>(null)
  const [lastMoveDestination, setLastMoveDestination] = useState<{
    x: number
    y: number
  } | null>(null)
  const [aiThinking, setAiThinking] = useState(false)
  const aiThinkingRef = useRef(false)

  void selectedUnit
  void hoveredUnit
  const handleUnitClick = useCallback((unitId: string) => {
    setSelectedUnit((prev) => (prev === unitId ? null : unitId))
  }, [])
  const handleUnitHover = useCallback((unitId: string) => {
    setHoveredUnit(unitId)
  }, [])
  const handleUnitLeave = useCallback(() => {
    setHoveredUnit(null)
  }, [])
  // Timer polling
  useEffect(() => {
    if (!gameState) return
    const interval = setInterval(() => {
      if (gameState.status === 'drafting') {
        mutations.checkDraftTimeout({ gameId: gameState._id })
      } else if (gameState.status === 'playing') {
        mutations.checkTurnTimeout({ gameId: gameState._id })
        mutations.checkDisconnect({ gameId: gameState._id })
        mutations.checkDisconnectGracePeriod({ gameId: gameState._id })
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [
    gameState,
    mutations.checkDraftTimeout,
    mutations.checkTurnTimeout,
    mutations.checkDisconnect,
    mutations.checkDisconnectGracePeriod,
  ])
  // Audio effects for game state changes
  const [lastTurn, setLastTurn] = useState<number | undefined>()
  const [lastPanic, setLastPanic] = useState<string | undefined>()

  useEffect(() => {
    if (gameState?.turnNum !== lastTurn) {
      if (lastTurn !== undefined) playTurnEnd()
      setLastTurn(gameState?.turnNum)
    }
    if (
      gameState?.kernelPanicActive &&
      gameState.kernelPanicActive !== lastPanic
    ) {
      playKernelPanic()
      setLastPanic(gameState.kernelPanicActive)
    }
  }, [gameState?.turnNum, gameState?.kernelPanicActive, lastTurn, lastPanic])
  const handleCommand = useCallback(
    async (raw: string) => {
      const cmd = parseCommand(raw)

      if (cmd.type === 'clear') {
        return
      }

      // Clear last move highlights on any new action
      setLastMoveOrigin(null)
      setLastMoveDestination(null)

      if (!gameState) return

      // Reset typing status when command is sent
      await mutations.setTyping({
        gameId: gameState._id,
        playerId,
        isTyping: false,
      })

      let result = `EXECUTING: ${cmd.type.toUpperCase()}`
      let logVisibility: 'public' | 'private' = 'public'

      if (cmd.type === 'toggle labels') {
        setShowCoordinates((prev) => !prev)
        result = showCoordinates
          ? 'COORDINATE_LABELS: OFF'
          : 'COORDINATE_LABELS: ON'
        playSuccess()
        await mutations.logCommand({
          gameId: gameState._id,
          playerId: playerId,
          command: raw,
          result,
          visibility: 'public',
        })
        return
      }

      if (cmd.type === 'help') {
        result =
          'AVAILABLE_COMMANDS: mv, atk, scan, inspect, ovw, map, end, help, clear'
        playSuccess()
      } else if (cmd.type === 'mv') {
        const [fromCoord, toCoord] = cmd.args
        const from = parseCoord(fromCoord)
        const to = parseCoord(toCoord)

        if (!from || !to) {
          result =
            'ERROR: INVALID_ARGUMENTS. USAGE: mv [from] [to] (e.g., mv C2 C5)'
        } else {
          const unitAtSource = gameState.units.find(
            (u: any) => u.x === from.x && u.y === from.y,
          )

          if (!unitAtSource) {
            result = `ERROR: NO_UNIT_AT "${from.label}"`
          } else {
            try {
              const res = await mutations.moveUnit({
                gameId: gameState._id,
                playerId,
                unitId: unitAtSource._id,
                targetX: to.x,
                targetY: to.y,
              })
              setLastMoveOrigin({ x: res.originX, y: res.originY })
              setLastMoveDestination({ x: to.x, y: to.y })
              result = `MOVE_SUCCESS: [${unitAtSource.type}] ${from.label} -> ${to.label}`
              playSuccess()
              if (res.overwatchTriggered) {
                result += ` | WARNING: OVERWATCH TRIGGERED! Took ${res.damageTaken} damage.`
                playError()
              }
            } catch (err: any) {
              result = `ERROR: ${cleanErrorMessage(err.message)}`
              playError()
            }
          }
        }
      } else if (cmd.type === 'atk') {
        const [fromCoord, toCoord] = cmd.args
        const from = parseCoord(fromCoord)
        const to = parseCoord(toCoord)

        if (!from || !to) {
          result =
            'ERROR: INVALID_ARGUMENTS. USAGE: atk [from] [to] (e.g., atk C4 E4)'
        } else {
          const attacker = gameState.units.find(
            (u: any) => u.x === from.x && u.y === from.y,
          )
          const defender = gameState.units.find(
            (u: any) => u.x === to.x && u.y === to.y,
          )

          if (!attacker) result = `ERROR: NO_UNIT_AT "${from.label}"`
          else if (!defender) result = `ERROR: NO_TARGET_AT "${to.label}"`
          else {
            try {
              const res = await mutations.attackUnit({
                gameId: gameState._id,
                playerId,
                attackerId: attacker._id,
                targetId: defender._id,
              })
              result = `ATTACK_HIT: [${attacker.type}] dealt ${res.damage} DMG to [${defender.type}] at ${to.label}. (${res.zone.toUpperCase()}${res.shieldApplied ? ' + SHIELD REDUCTION' : ''})`
              playAttack()
              if (res.destroyed) result += ` [UNIT_ELIMINATED]`
            } catch (err: any) {
              result = `ERROR: ${cleanErrorMessage(err.message)}`
              playError()
            }
          }
        }
      } else if (cmd.type === 'heal') {
        const [fromCoord, toCoord] = cmd.args
        const from = parseCoord(fromCoord)
        const to = parseCoord(toCoord)

        if (!from || !to) {
          result = 'ERROR: INVALID_ARGUMENTS. USAGE: heal [from] [to]'
        } else {
          const healer = gameState.units.find(
            (u: any) => u.x === from.x && u.y === from.y,
          )
          const target = gameState.units.find(
            (u: any) => u.x === to.x && u.y === to.y,
          )

          if (!healer) result = `ERROR: NO_UNIT_AT "${from.label}"`
          else if (!target) result = `ERROR: NO_TARGET_AT "${to.label}"`
          else {
            try {
              const res = await mutations.healUnit({
                gameId: gameState._id,
                playerId,
                healerId: healer._id,
                targetId: target._id,
              })
              result = `HEAL_SUCCESS: [${healer.type}] restored ${res.healed} HP to [${target.type}] at ${to.label}.`
              playHeal()
            } catch (err: any) {
              result = `ERROR: ${cleanErrorMessage(err.message)}`
              playError()
            }
          }
        }
      } else if (cmd.type === 'scan') {
        const [coord] = cmd.args
        const target = parseCoord(coord)

        if (!target) {
          result = 'ERROR: INVALID_ARGUMENTS. USAGE: scan [coord]'
        } else {
          try {
            const res = await mutations.scanArea({
              gameId: gameState._id,
              playerId,
              x: target.x,
              y: target.y,
            })
            result = `SCAN_COMPLETE: Area centered at ${target.label} revealed. ${res.hostilesCount} hostiles detected.`
            logVisibility = 'private'
            playSuccess()
          } catch (err: any) {
            result = `ERROR: ${cleanErrorMessage(err.message)}`
            playError()
          }
        }
      } else if (cmd.type === 'ovw') {
        const [coord, dir] = cmd.args
        const target = parseCoord(coord)
        const direction = dir.toUpperCase()

        if (!target || !['N', 'E', 'S', 'W'].includes(direction)) {
          result = 'ERROR: INVALID_ARGUMENTS. USAGE: ovw [coord] [N|E|S|W]'
        } else {
          const unit = gameState.units.find(
            (u: any) => u.x === target.x && u.y === target.y,
          )
          if (!unit) {
            result = `ERROR: NO_UNIT_AT "${target.label}"`
          } else {
            try {
              await mutations.setOverwatch({
                gameId: gameState._id,
                playerId,
                unitId: unit._id,
                direction,
              })
              result = `OVERWATCH_SET: [${unit.type}] at ${target.label} watching ${direction}.`
              playSuccess()
            } catch (err: any) {
              result = `ERROR: ${cleanErrorMessage(err.message)}`
              playError()
            }
          }
        }
      } else if (cmd.type === 'build') {
        result = await handleBuildCommand(
          { playerId, gameState, mutations },
          cmd.args,
        )
      } else if (cmd.type === 'demolish') {
        result = await handleDemolishCommand(
          { playerId, gameState, mutations },
          cmd.args,
        )
      } else if (cmd.type === 'rally') {
        result = await handleRallyCommand(
          { playerId, gameState, mutations },
          cmd.args,
        )
      } else if (cmd.type === 'map') {
        const mapResult = handleMapCommand(gameState)
        result = mapResult.result
        logVisibility = mapResult.logVisibility
        if (mapResult.logVisibility === 'private') {
          playSuccess()
        } else {
          playError()
        }
      } else if (cmd.type === 'inspect') {
        const [coord] = cmd.args
        const target = parseCoord(coord)
        if (!target) {
          result = 'ERROR: MISSING_COORD. USAGE: inspect [coord]'
          playError()
        } else {
          const unit = gameState.units.find(
            (u: any) => u.x === target.x && u.y === target.y,
          )
          playSuccess()
          if (!unit) {
            result = `NOTICE: NO_UNIT_DETECTED_AT ${target.label}`
          } else {
            result = `UNIT_ID: [${unit.type}] | OWNER: ${unit.ownerId.toUpperCase()} | HP: ${unit.hp}/${unit.maxHp} | AP: ${unit.ap}/${unit.maxAp} | ATK: ${unit.atk} | RNG: ${unit.rng} | POS: ${target.label}`
            logVisibility = 'private'
            if (unit.isOverwatching)
              result += ` | OVERWATCHING: ${unit.overwatchDirection}`
            if (unit.isStealthed) result += ` | STEALTHED`
          }
        }
      } else if (cmd.type === 'end') {
        const isTurn =
          (gameState.currentPlayer === 'p1' && gameState.p1 === playerId) ||
          (gameState.currentPlayer === 'p2' && gameState.p2 === playerId)

        if (!isTurn) {
          result = 'ERROR: NOT_YOUR_TURN'
          playError()
        } else {
          await mutations.endTurn({ gameId: gameState._id, playerId })
          result = 'TURN_ENDED'
          playSuccess()

          // Check if the opponent is AI — trigger AI turn with "thinking" delay
          const opponentId =
            gameState.currentPlayer === 'p1' ? gameState.p2 : gameState.p1
          if (opponentId && isBot(opponentId) && !aiThinkingRef.current) {
            aiThinkingRef.current = true
            setAiThinking(true)

            // 1.5s "thinking" delay for human readability
            await new Promise((resolve) => setTimeout(resolve, 1500))

            try {
              const difficulty =
                opponentId === '__ai_easy__'
                  ? 'easy'
                  : opponentId === '__ai_hard__'
                    ? 'hard'
                    : 'medium'
              await mutations.aiTurn({ gameId: gameState._id, difficulty })
            } catch {
              // AI turn failed silently — game state will handle via existing flows
            } finally {
              aiThinkingRef.current = false
              setAiThinking(false)
            }
          }
        }
      } else if (cmd.type === 'sudo mv') {
        result = await handleSudoMoveCommand(
          { playerId, gameState, mutations },
          cmd.args,
        )
      } else if (cmd.type === 'sudo scan') {
        result = await handleSudoScanCommand({
          playerId,
          gameState,
          mutations,
        })
      } else if (cmd.type === 'sudo atk') {
        result = await handleSudoAttackCommand(
          { playerId, gameState, mutations },
          cmd.args,
        )
      } else if (cmd.type === 'forfeit') {
        result = await handleForfeitCommand({ playerId, gameState, mutations })
      } else if (cmd.type === 'offer draw') {
        result = await handleOfferDrawCommand({
          playerId,
          gameState,
          mutations,
        })
      } else if (cmd.type === 'accept draw') {
        result = await handleAcceptDrawCommand({
          playerId,
          gameState,
          mutations,
        })
      } else if (cmd.type === 'handle') {
        const profileResult = await handleHandleCommand(
          { playerId, gameState, matchHistory, mutations },
          cmd.args,
        )
        result = profileResult.result
        logVisibility = profileResult.visibility
      } else if (cmd.type === 'history') {
        const profileResult = await handleHistoryCommand({
          playerId,
          gameState,
          matchHistory,
          mutations,
        })
        result = profileResult.result
        logVisibility = profileResult.visibility
      } else if (cmd.type === 'say') {
        result = await handleSayCommand(
          { playerId, gameState, mutations },
          cmd.args,
        )
      } else {
        result = `ERROR: UNKNOWN_COMMAND "${cmd.raw}"`
        playError()
      }

      await mutations.logCommand({
        gameId: gameState._id,
        playerId: playerId,
        command: raw,
        result,
        visibility: logVisibility,
      })
    },
    [
      gameState,
      mutations.logCommand,
      playerId,
      mutations.setTyping,
      mutations.endTurn,
      mutations.moveUnit,
      mutations.attackUnit,
      mutations.healUnit,
      mutations.scanArea,
      mutations.setOverwatch,
      mutations.sudoMove,
      mutations.sudoScan,
      mutations.sudoAttack,
      mutations.forfeit,
      mutations.offerDraw,
      mutations.acceptDraw,
      mutations.sendMessage,
      mutations.setHandle,
      mutations.buildWall,
      mutations.demolishWall,
      mutations.useRally,
      showCoordinates,
    ],
  )

  const {
    formattedLogs,
    currentlyVisibleTiles,
    visibleUnits,
    attackRangeTiles,
    hoverTooltipData,
    hoverTooltipPosition,
  } = useGameDerivedState(gameState, playerId, logs, selectedUnit, hoveredUnit)

  return {
    aiThinking,
    selectedUnit,
    showCoordinates,
    setShowCoordinates,
    lastMoveOrigin,
    lastMoveDestination,
    handleUnitClick,
    handleUnitHover,
    handleUnitLeave,
    handleCommand,
    formattedLogs,
    currentlyVisibleTiles,
    visibleUnits,
    attackRangeTiles,
    hoverTooltipData,
    hoverTooltipPosition,
  }
}

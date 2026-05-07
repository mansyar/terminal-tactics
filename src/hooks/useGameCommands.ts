import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { hasLineOfSight } from '../lib/combatSystem'
import type { LogEntry } from '../components/Terminal/ConsoleHistory'

interface GameMutations {
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
}

interface UseGameCommandsParams {
  playerId: string
  gameState: any
  logs: any
  mutations: GameMutations
}

export function useGameCommands({
  playerId,
  gameState,
  logs,
  mutations,
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
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [gameState, mutations.checkDraftTimeout, mutations.checkTurnTimeout])

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
          'AVAILABLE_COMMANDS: mv, atk, scan, inspect, ovw, end, help, clear'
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
        }
      } else if (cmd.type === 'sudo mv') {
        const [unitCoord, targetCoord] = cmd.args
        const unitPos = parseCoord(unitCoord)
        const targetPos = parseCoord(targetCoord)
        if (!unitPos || !targetPos) {
          result = 'ERROR: INVALID_ARGS. USAGE: sudo mv [unit] [target]'
          playError()
        } else {
          const unit = gameState.units.find(
            (u: any) => u.x === unitPos.x && u.y === unitPos.y,
          )
          if (!unit) {
            result = `ERROR: NO_UNIT_AT ${unitPos.label}`
            playError()
          } else {
            try {
              await mutations.sudoMove({
                gameId: gameState._id,
                playerId,
                unitId: unit._id,
                targetX: targetPos.x,
                targetY: targetPos.y,
              })
              result = `SUDO_MOVE: [${unit.type}] bypassed security to ${targetPos.label}`
              playSuccess()
            } catch (err: any) {
              result = `ERROR: ${cleanErrorMessage(err.message)}`
              playError()
            }
          }
        }
      } else if (cmd.type === 'sudo scan') {
        try {
          await mutations.sudoScan({ gameId: gameState._id, playerId })
          result = 'SUDO_SCAN: FULL_MAP_DECRYPTED'
          playSuccess()
        } catch (err: any) {
          result = `ERROR: ${cleanErrorMessage(err.message)}`
          playError()
        }
      } else if (cmd.type === 'sudo atk') {
        const [atkCoord, targetCoord] = cmd.args
        const atkPos = parseCoord(atkCoord)
        const targetPos = parseCoord(targetCoord)
        if (!atkPos || !targetPos) {
          result = 'ERROR: INVALID_ARGS. USAGE: sudo atk [atk] [target]'
          playError()
        } else {
          const attacker = gameState.units.find(
            (u: any) => u.x === atkPos.x && u.y === atkPos.y,
          )
          const defender = gameState.units.find(
            (u: any) => u.x === targetPos.x && u.y === targetPos.y,
          )
          if (!attacker || !defender) {
            result = 'ERROR: UNIT_NOT_FOUND'
            playError()
          } else {
            try {
              const res = await mutations.sudoAttack({
                gameId: gameState._id,
                playerId,
                attackerId: attacker._id,
                targetId: defender._id,
                damage: 0,
              })
              result = `SUDO_ATTACK: [${attacker.type}] dealt ${res.damage} DMG to [${defender.type}] bypassing systems.`
              playAttack()
              if (res.destroyed) result += ' [ELIMINATED]'
            } catch (err: any) {
              result = `ERROR: ${cleanErrorMessage(err.message)}`
              playError()
            }
          }
        }
      } else if (cmd.type === 'forfeit') {
        await mutations.forfeit({ gameId: gameState._id, playerId })
        result = 'FORFEIT_ACCEPTED. INITIATING_SHUTDOWN.'
        playSuccess()
      } else if (cmd.type === 'offer draw') {
        await mutations.offerDraw({ gameId: gameState._id, playerId })
        result = 'DRAW_OFFER_TRANSMITTED'
        playSuccess()
      } else if (cmd.type === 'accept draw') {
        try {
          await mutations.acceptDraw({ gameId: gameState._id, playerId })
          result = 'DRAW_ACCEPTED. CONNECTION_TERMINATED.'
          playSuccess()
        } catch (err: any) {
          result = `ERROR: ${cleanErrorMessage(err.message)}`
          playError()
        }
      } else if (cmd.type === 'say') {
        const message = cmd.args.join(' ')
        if (message) {
          await mutations.sendMessage({
            gameId: gameState._id,
            playerId,
            message,
          })
          result = 'MSG_SENT'
          playSuccess()
        }
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
      showCoordinates,
    ],
  )

  const formattedLogs = useMemo(() => {
    const result: Array<LogEntry> = []
    if (!logs) return result

    for (const l of logs) {
      const isPrivate = l.visibility === 'private'
      result.push({
        timestamp: l.timestamp,
        content: l.commandString,
        type: 'input',
        isPrivate,
      })
      result.push({
        timestamp: l.timestamp,
        content: l.result,
        type: l.result.startsWith('ERROR') ? 'error' : 'output',
        isPrivate,
      })
    }
    return result
  }, [logs])

  const currentlyVisibleTiles = useMemo(() => {
    if (!gameState || !playerId) return new Set<string>()
    const myPlayerKey = gameState.p1 === playerId ? 'p1' : 'p2'
    const myUnits = gameState.units.filter(
      (u: any) => u.ownerId === myPlayerKey,
    )

    const set = new Set<string>()
    myUnits.forEach((u: any) => {
      const vis = u.vis || 3
      for (let dy = -vis; dy <= vis; dy++) {
        for (let dx = -vis; dx <= vis; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) <= vis) {
            const tx = u.x + dx
            const ty = u.y + dy
            if (tx >= 0 && tx < 12 && ty >= 0 && ty < 12) {
              if (
                hasLineOfSight(
                  { x: u.x, y: u.y },
                  { x: tx, y: ty },
                  gameState.mapData,
                )
              ) {
                set.add(`${tx},${ty}`)
              }
            }
          }
        }
      }
    })
    return set
  }, [gameState, playerId])

  const visibleUnits = useMemo(() => {
    if (!gameState) return []
    const myPlayerKey = gameState.p1 === playerId ? 'p1' : 'p2'

    return gameState.units.filter((u: any) => {
      if (u.ownerId === myPlayerKey) return true

      // Enemy visibility
      const isVisible = currentlyVisibleTiles.has(`${u.x},${u.y}`)

      // Scout stealth check: invisible unless adjacent
      if (u.type === 'S' && u.isStealthed) {
        const myUnits = gameState.units.filter(
          (my: any) => my.ownerId === myPlayerKey,
        )
        const isAdjacent = myUnits.some(
          (my: any) => Math.abs(my.x - u.x) + Math.abs(my.y - u.y) <= 1,
        )
        if (!isAdjacent) return false
      }

      return isVisible
    })
  }, [gameState, currentlyVisibleTiles, playerId])

  // Attack range preview from selected/hovered unit
  const attackRangeTiles = useMemo(() => {
    if (!gameState || (!selectedUnit && !hoveredUnit)) return []
    const targetId = selectedUnit || hoveredUnit
    const unit = gameState.units.find((u: any) => u._id === targetId)
    if (!unit) return []
    const rng = unit.rng || 1
    const tiles: Array<string> = []
    for (let dy = -rng; dy <= rng; dy++) {
      for (let dx = -rng; dx <= rng; dx++) {
        if (Math.abs(dx) + Math.abs(dy) <= rng) {
          const tx = unit.x + dx
          const ty = unit.y + dy
          if (tx >= 0 && tx < 12 && ty >= 0 && ty < 12) {
            tiles.push(`${tx},${ty}`)
          }
        }
      }
    }
    return tiles
  }, [gameState, selectedUnit, hoveredUnit])

  // Hover tooltip — single pass lookup for data + position
  const hoverTooltipInfo = useMemo(() => {
    if (!gameState || !hoveredUnit) return null
    const unit = gameState.units.find((u: any) => u._id === hoveredUnit)
    if (!unit) return null
    return {
      data: {
        type: unit.type,
        hp: unit.hp,
        maxHp: unit.maxHp,
        ap: unit.ap,
        maxAp: unit.maxAp,
        atk: unit.atk ?? 0,
        rng: unit.rng ?? 1,
      },
      position: { x: unit.x * 100, y: unit.y * 100 },
    }
  }, [gameState, hoveredUnit])

  const hoverTooltipData = hoverTooltipInfo?.data
  const hoverTooltipPosition = hoverTooltipInfo?.position

  return {
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

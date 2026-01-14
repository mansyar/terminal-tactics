import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import './styles.css'
import { GameLayout } from './components/GameLayout'
import { CLIInput } from './components/Terminal/CLIInput'
import { ConsoleHistory } from './components/Terminal/ConsoleHistory'
import { GridBoard } from './components/Grid/GridBoard'
import { UnitModel } from './components/Grid/UnitModel'
import { LobbyScreen } from './components/LobbyScreen'
import { TurnIndicator } from './components/TurnIndicator'
import { parseCommand } from './lib/commandParser'
import { getOrSetUserId } from './lib/utils'
import { SquadBuilder } from './components/SquadBuilder'
import { hasLineOfSight } from './lib/combatSystem'
import { TimerDisplay } from './components/TimerDisplay'
import {
  playAttack,
  playError,
  playHeal,
  playKernelPanic,
  playSuccess,
  playTurnEnd,
} from './lib/audio'
import type { LogEntry } from './components/Terminal/ConsoleHistory'

const cleanErrorMessage = (message: string) => {
  return message
    .replace(/\[CONVEX M\(.*?\)\]/g, '')
    .replace(/\[Request ID: .*?\]/g, '')
    .replace(/Server Error/g, '')
    .replace(/Uncaught Error:/g, '')
    .split(' at handler')[0]
    .trim()
    .toUpperCase()
}

function App() {
  const [playerId] = useState(() => getOrSetUserId())
  const [activeGameId, setActiveGameId] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('terminal_tactics_game_id')
    }
    return null
  })

  const gameState = useQuery(api.game.getGameState, {
    gameId: activeGameId || undefined,
  })

  const logs = useQuery(
    api.game.getLogs,
    gameState ? { gameId: gameState._id } : 'skip',
  )
  const logCommand = useMutation(api.game.logCommand)
  const setTyping = useMutation(api.lobby.setTyping)
  const endTurn = useMutation(api.game.endTurn)
  const moveUnit = useMutation(api.movement.moveUnit)
  const submitDraft = useMutation(api.squadBuilder.submitDraft)
  const attackUnit = useMutation(api.combat.attackUnit)
  const healUnit = useMutation(api.combat.healUnit)
  const scanArea = useMutation(api.combat.scanArea)
  const setOverwatch = useMutation(api.combat.setOverwatch)

  // Phase 6 Mutations
  const sudoMove = useMutation(api.sudo.sudoMove)
  const sudoScan = useMutation(api.sudo.sudoScan)
  const sudoAttack = useMutation(api.sudo.sudoAttack)
  const forfeit = useMutation(api.gameEnd.forfeit)
  const offerDraw = useMutation(api.gameEnd.offerDraw)
  const acceptDraw = useMutation(api.gameEnd.acceptDraw)
  const sendMessage = useMutation(api.chat.sendMessage)
  const checkDraftTimeout = useMutation(api.timers.checkDraftTimeout)
  const checkTurnTimeout = useMutation(api.timers.checkTurnTimeout)

  // Timer polling
  useEffect(() => {
    if (!gameState) return
    const interval = setInterval(() => {
      if (gameState.status === 'drafting') {
        checkDraftTimeout({ gameId: gameState._id })
      } else if (gameState.status === 'playing') {
        checkTurnTimeout({ gameId: gameState._id })
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [gameState, checkDraftTimeout, checkTurnTimeout])

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

      if (!gameState) return

      // Reset typing status when command is sent
      await setTyping({ gameId: gameState._id, playerId, isTyping: false })

      let result = `EXECUTING: ${cmd.type.toUpperCase()}`

      // Helper for coordinate parsing
      const parseCoord = (coord: string) => {
        if (!coord) return null
        const xChar = coord.charAt(0).toUpperCase()
        const yNum = parseInt(coord.slice(1))
        if (isNaN(yNum) || xChar < 'A' || xChar > 'L' || yNum < 1 || yNum > 12)
          return null
        return {
          x: xChar.charCodeAt(0) - 65,
          y: 12 - yNum,
          label: coord.toUpperCase(),
        }
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
              const res = await moveUnit({
                gameId: gameState._id,
                playerId,
                unitId: unitAtSource._id,
                targetX: to.x,
                targetY: to.y,
              })
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
              const res = await attackUnit({
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
              const res = await healUnit({
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
            const res = await scanArea({
              gameId: gameState._id,
              playerId,
              x: target.x,
              y: target.y,
            })
            result = `SCAN_COMPLETE: Area centered at ${target.label} revealed. ${res.hostilesCount} hostiles detected.`
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
              await setOverwatch({
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
          await endTurn({ gameId: gameState._id, playerId })
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
              await sudoMove({
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
          await sudoScan({ gameId: gameState._id, playerId })
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
              const res = await sudoAttack({
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
        await forfeit({ gameId: gameState._id, playerId })
        result = 'FORFEIT_ACCEPTED. INITIATING_SHUTDOWN.'
        playSuccess()
      } else if (cmd.type === 'offer draw') {
        await offerDraw({ gameId: gameState._id, playerId })
        result = 'DRAW_OFFER_TRANSMITTED'
        playSuccess()
      } else if (cmd.type === 'accept draw') {
        try {
          await acceptDraw({ gameId: gameState._id, playerId })
          result = 'DRAW_ACCEPTED. CONNECTION_TERMINATED.'
          playSuccess()
        } catch (err: any) {
          result = `ERROR: ${cleanErrorMessage(err.message)}`
          playError()
        }
      } else if (cmd.type === 'say') {
        const message = cmd.args.join(' ')
        if (message) {
          await sendMessage({ gameId: gameState._id, playerId, message })
          result = 'MSG_SENT'
          playSuccess()
        }
      } else {
        result = `ERROR: UNKNOWN_COMMAND "${cmd.raw}"`
        playError()
      }

      await logCommand({
        gameId: gameState._id,
        playerId: playerId,
        command: raw,
        result,
      })
    },
    [
      gameState,
      logCommand,
      playerId,
      setTyping,
      endTurn,
      moveUnit,
      submitDraft,
    ],
  )

  const formattedLogs = useMemo(() => {
    const result: Array<LogEntry> = []
    if (!logs) return result

    for (const l of logs) {
      result.push({
        timestamp: l.timestamp,
        content: l.commandString,
        type: 'input',
      })
      result.push({
        timestamp: l.timestamp,
        content: l.result,
        type: l.result.startsWith('ERROR') ? 'error' : 'output',
      })
    }
    return result
  }, [logs])

  // Sync activeGameId to localStorage
  useEffect(() => {
    if (activeGameId) {
      localStorage.setItem('terminal_tactics_game_id', activeGameId)
    } else {
      localStorage.removeItem('terminal_tactics_game_id')
    }
  }, [activeGameId])

  // Reset local state if game finished or not found
  useEffect(() => {
    if (activeGameId && gameState === null) {
      // Only clear if we actually had an ID but the server returned null (e.g. game deleted)
      // However, initially gameState is undefined (loading), so we must check for strictly null
      setActiveGameId(null)
    }
  }, [activeGameId, gameState])

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

  if (
    !gameState ||
    gameState.status === 'lobby' ||
    gameState.status === 'drafting' ||
    gameState.status === 'finished'
  ) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        {gameState?.status === 'lobby' ? (
          <div className="space-y-4 text-center">
            <div className="text-matrix-primary text-2xl font-mono animate-pulse uppercase glow">
              &gt; Waiting_for_Opponent...
            </div>
            <div className="text-matrix-primary/60 font-mono text-sm">
              LOBBY_CODE:{' '}
              <span className="text-matrix-primary font-bold">
                {gameState.code}
              </span>
            </div>
            <button
              onClick={() => setActiveGameId(null)}
              className="px-4 py-2 border border-matrix-primary/30 text-matrix-primary/50 hover:text-matrix-primary hover:border-matrix-primary transition-all font-mono text-xs"
            >
              QUIT_SESSION
            </button>
          </div>
        ) : gameState?.status === 'drafting' ? (
          <SquadBuilder
            isP1={gameState.p1 === playerId}
            draftStartTime={gameState.draftStartTime}
            onTimeout={() => checkDraftTimeout({ gameId: gameState._id })}
            onDeploy={(squad) =>
              submitDraft({ gameId: gameState._id, playerId, squad })
            }
          />
        ) : gameState?.status === 'finished' ? (
          <div className="space-y-6 text-center max-w-md w-full border border-matrix-primary p-8 bg-black/90 shadow-[0_0_20px_rgba(0,255,0,0.2)]">
            <h1 className="text-4xl font-mono font-bold uppercase tracking-widest animate-pulse">
              {gameState.winner === playerId
                ? 'MISSION_COMPLETE'
                : 'MISSION_FAILED'}
            </h1>
            <div
              className={`text-xl font-mono ${
                gameState.winner === playerId
                  ? 'text-matrix-primary'
                  : 'text-red-500'
              }`}
            >
              {gameState.winner === playerId
                ? 'TARGET_NEUTRALIZED. SYSTEM SECURE.'
                : 'CRITICAL FAILURE. SYSTEM COMPROMISED.'}
            </div>
            <div className="text-xs text-matrix-primary/50 font-mono">
              OPERATION_LOG_SAVED &gt;&gt; /var/logs/{gameState._id}
            </div>
            <button
              onClick={() => setActiveGameId(null)}
              className="mt-8 px-6 py-3 border border-matrix-primary text-matrix-primary hover:bg-matrix-primary hover:text-black transition-all font-mono uppercase tracking-widest text-sm"
            >
              RETURN_TO_BASE
            </button>
          </div>
        ) : (
          <LobbyScreen
            playerId={playerId}
            onGameJoined={(id) => setActiveGameId(id)}
          />
        )}
      </div>
    )
  }

  const isMyTurn =
    (gameState.currentPlayer === 'p1' && gameState.p1 === playerId) ||
    (gameState.currentPlayer === 'p2' && gameState.p2 === playerId)

  const otherPlayerTyping =
    playerId === gameState.p1 ? gameState.p2Typing : gameState.p1Typing

  const revealedTiles =
    playerId === gameState.p1
      ? gameState.p1RevealedTiles
      : gameState.p2RevealedTiles

  return (
    <GameLayout
      cli={
        <CLIInput
          onCommand={handleCommand}
          onTyping={(isTyping) =>
            setTyping({ gameId: gameState._id, playerId, isTyping })
          }
          units={visibleUnits}
          playerId={gameState.p1 === playerId ? 'p1' : 'p2'}
        />
      }
      sidebar={
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-4 space-y-4 border-b border-matrix-primary/30 text-xs">
            <div className="border border-matrix-primary/30 p-2">
              <div className="text-[10px] text-matrix-primary/50 uppercase">
                Operative_ID
              </div>
              <div className="text-matrix-primary italic font-bold truncate">
                {playerId}
              </div>
            </div>

            <TurnIndicator
              turnNum={gameState.turnNum}
              isMyTurn={isMyTurn}
              enemyTyping={otherPlayerTyping}
            />

            <div className="flex gap-2">
              <div className="flex-1 border border-matrix-primary/30 p-2">
                <div className="text-[10px] text-matrix-primary/50 uppercase">
                  RAP
                </div>
                <div className="text-matrix-primary font-bold text-center">
                  {(gameState.p1 === playerId
                    ? gameState.p1Rap
                    : gameState.p2Rap) || 0}
                  /3
                </div>
              </div>
              <div className="flex-1">
                <TimerDisplay
                  startTime={gameState.turnStartTime || Date.now()}
                  durationMs={90000}
                  label="Turn"
                  onTimeout={() =>
                    isMyTurn && checkTurnTimeout({ gameId: gameState._id })
                  }
                />
              </div>
            </div>

            <div className="text-[10px] text-matrix-primary/50 uppercase px-1">
              Code: {gameState.code}
            </div>
          </div>
          <ConsoleHistory logs={formattedLogs} />
        </div>
      }
    >
      <div
        className={`flex-1 flex items-center justify-center p-4 h-full relative ${
          gameState.kernelPanicActive ? 'glitch' : ''
        }`}
      >
        {gameState.kernelPanicActive && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900/80 text-white px-8 py-2 border-2 border-red-500 animate-bounce font-bold tracking-[0.2em]">
            KERNEL_PANIC: {gameState.kernelPanicActive}
          </div>
        )}
        <GridBoard
          mapData={gameState.mapData}
          revealedTiles={revealedTiles || []}
          currentlyVisibleTiles={Array.from(currentlyVisibleTiles)}
        >
          {visibleUnits.map((u: any) => (
            <UnitModel
              key={u._id}
              type={u.type}
              x={u.x}
              y={u.y}
              ownerId={u.ownerId}
              direction={u.direction}
              ap={u.ap}
              maxAp={u.maxAp}
              isStealthed={u.isStealthed}
              isOverwatching={u.isOverwatching}
            />
          ))}
        </GridBoard>
      </div>
    </GameLayout>
  )
}

export default App

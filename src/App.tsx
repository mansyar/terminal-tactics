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
import type { LogEntry } from './components/Terminal/ConsoleHistory'

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
      if (cmd.type === 'help') {
        result =
          'AVAILABLE_COMMANDS: mv, atk, scan, inspect, ovw, end, help, clear'
      } else if (cmd.type === 'mv') {
        // Syntax: mv [fromCoord] [toCoord] -> mv C2 C5
        const [fromCoord, toCoord] = cmd.args
        if (!fromCoord || !toCoord) {
          result =
            'ERROR: INVALID_ARGUMENTS. USAGE: mv [from] [to] (e.g., mv C2 C5)'
        } else {
          // Parse source coordinate
          const fromXChar = fromCoord.charAt(0).toUpperCase()
          const fromYNum = parseInt(fromCoord.slice(1))

          // Parse target coordinate
          const toXChar = toCoord.charAt(0).toUpperCase()
          const toYNum = parseInt(toCoord.slice(1))

          const isValidCoord = (xChar: string, yNum: number) =>
            !isNaN(yNum) &&
            xChar >= 'A' &&
            xChar <= 'L' &&
            yNum >= 1 &&
            yNum <= 12

          if (!isValidCoord(fromXChar, fromYNum)) {
            result = `ERROR: INVALID_SOURCE_COORD "${fromCoord}"`
          } else if (!isValidCoord(toXChar, toYNum)) {
            result = `ERROR: INVALID_TARGET_COORD "${toCoord}"`
          } else {
            const fromX = fromXChar.charCodeAt(0) - 65
            const fromY = 12 - fromYNum
            const toX = toXChar.charCodeAt(0) - 65
            const toY = 12 - toYNum

            // Find unit at source position
            const myPlayerId = gameState.p1 === playerId ? 'p1' : 'p2'
            const unitAtSource = gameState.units.find(
              (u: any) => u.x === fromX && u.y === fromY,
            )

            if (!unitAtSource) {
              result = `ERROR: NO_UNIT_AT "${fromCoord}"`
            } else if (unitAtSource.ownerId !== myPlayerId) {
              result = `ERROR: NOT_YOUR_UNIT_AT "${fromCoord}"`
            } else {
              try {
                await moveUnit({
                  gameId: gameState._id,
                  playerId,
                  unitId: unitAtSource._id,
                  targetX: toX,
                  targetY: toY,
                })
                result = `MOVE_SUCCESS: [${unitAtSource.type}] ${fromCoord.toUpperCase()} -> ${toCoord.toUpperCase()}`
              } catch (err: any) {
                let errorMessage = err.message

                if (errorMessage.includes('Uncaught Error: ')) {
                  errorMessage = errorMessage.split('Uncaught Error: ')[1]
                }

                if (errorMessage.includes(' at handler')) {
                  errorMessage = errorMessage.split(' at handler')[0]
                }

                result = `ERROR: ${errorMessage.trim()}`
              }
            }
          }
        }
      } else if (cmd.type === 'inspect') {
        const [coord] = cmd.args
        if (!coord) {
          result = 'ERROR: MISSING_COORD. USAGE: inspect [coord]'
        } else {
          const xChar = coord.charAt(0).toUpperCase()
          const yNum = parseInt(coord.slice(1))
          const x = xChar.charCodeAt(0) - 65
          const y = 12 - yNum

          if (isNaN(yNum) || xChar < 'A' || xChar > 'L') {
            result = `ERROR: INVALID_COORD "${coord}"`
          } else {
            const unit = gameState.units.find(
              (u: any) => u.x === x && u.y === y,
            )
            if (!unit) {
              result = `NOTICE: NO_UNIT_DETECTED_AT ${coord.toUpperCase()}`
            } else {
              result = `UNIT_ID: [${unit.type}] | OWNER: ${unit.ownerId.toUpperCase()} | HP: ${unit.hp}/${unit.maxHp} | AP: ${unit.ap}/${unit.maxAp} | POS: ${coord.toUpperCase()}`
            }
          }
        }
      } else if (cmd.type === 'end') {
        const isTurn =
          (gameState.currentPlayer === 'p1' && gameState.p1 === playerId) ||
          (gameState.currentPlayer === 'p2' && gameState.p2 === playerId)

        if (!isTurn) {
          result = 'ERROR: NOT_YOUR_TURN'
        } else {
          await endTurn({ gameId: gameState._id, playerId })
          result = 'TURN_ENDED'
        }
      } else if (cmd.type === 'unknown') {
        result = `ERROR: UNKNOWN_COMMAND "${cmd.raw}"`
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

  if (
    !gameState ||
    gameState.status === 'lobby' ||
    gameState.status === 'drafting'
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
            onDeploy={(squad) =>
              submitDraft({ gameId: gameState._id, playerId, squad })
            }
          />
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

  return (
    <GameLayout
      cli={
        <CLIInput
          onCommand={handleCommand}
          onTyping={(isTyping) =>
            setTyping({ gameId: gameState._id, playerId, isTyping })
          }
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

            <div className="text-[10px] text-matrix-primary/50 uppercase px-1">
              Code: {gameState.code}
            </div>
          </div>
          <ConsoleHistory logs={formattedLogs} />
        </div>
      }
    >
      <div className="flex-1 flex items-center justify-center p-4 h-full">
        <GridBoard mapData={gameState.mapData}>
          {gameState.units.map((u: any) => (
            <UnitModel
              key={u._id}
              type={u.type}
              x={u.x}
              y={u.y}
              ownerId={u.ownerId}
              direction={u.direction}
              ap={u.ap}
              maxAp={u.maxAp}
            />
          ))}
        </GridBoard>
      </div>
    </GameLayout>
  )
}

export default App

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
    [gameState, logCommand, playerId, setTyping, endTurn],
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

  if (!gameState || gameState.status === 'lobby') {
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
      <div className="flex-1 flex items-center justify-center p-4">
        <GridBoard>
          {gameState.units.map((u: any) => (
            <UnitModel
              key={u._id}
              type={u.type}
              x={u.x}
              y={u.y}
              ownerId={u.ownerId}
            />
          ))}
        </GridBoard>
      </div>
    </GameLayout>
  )
}

export default App

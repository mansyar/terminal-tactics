import { useCallback, useMemo } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import './styles.css'
import { GameLayout } from './components/GameLayout'
import { CLIInput } from './components/Terminal/CLIInput'
import { ConsoleHistory } from './components/Terminal/ConsoleHistory'
import { GridBoard } from './components/Grid/GridBoard'
import { UnitModel } from './components/Grid/UnitModel'
import { parseCommand } from './lib/commandParser'
import type { LogEntry } from './components/Terminal/ConsoleHistory'

function App() {
  const gameState = useQuery(api.game.getGameState, {})
  const logs = useQuery(
    api.game.getLogs,
    gameState ? { gameId: gameState._id } : 'skip',
  )
  const logCommand = useMutation(api.game.logCommand)
  const seedGame = useMutation(api.game.seedGame)

  const handleCommand = useCallback(
    async (raw: string) => {
      const cmd = parseCommand(raw)

      if (cmd.type === 'clear') {
        // Clear is local to the terminal session usually,
        // but since we sync logs, we might just filter them locally or clear DB.
        // For Phase 2, we'll leave DB logs and maybe add a clear mutation later.
        return
      }

      if (!gameState) return

      let result = `EXECUTING: ${cmd.type.toUpperCase()}`
      if (cmd.type === 'help') {
        result = 'AVAILABLE_COMMANDS: mv, atk, scan, inspect, ovw, help, clear'
      } else if (cmd.type === 'unknown') {
        result = `ERROR: UNKNOWN_COMMAND "${cmd.raw}"`
      }

      await logCommand({
        gameId: gameState._id,
        playerId: 'p1',
        command: raw,
        result,
      })
    },
    [gameState, logCommand],
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

  return (
    <GameLayout
      cli={<CLIInput onCommand={handleCommand} />}
      sidebar={
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-4 space-y-4 border-b border-matrix-primary/30 text-xs">
            <div className="border border-matrix-primary/30 p-2">
              <div className="text-[10px] text-matrix-primary/50 uppercase">
                User_Identity
              </div>
              <div className="text-matrix-primary italic font-bold">
                ANONYMOUS_R00T
              </div>
            </div>
            <div className="border border-matrix-primary/30 p-2">
              <div className="text-[10px] text-matrix-primary/50 uppercase">
                Session_Status
              </div>
              <div className="text-matrix-primary font-bold">
                {gameState ? 'SIMULATION_ACTIVE' : 'NO_ACTIVE_SESSION'}
              </div>
            </div>
            {!gameState && (
              <button
                onClick={() => seedGame({})}
                className="w-full py-2 border border-matrix-primary text-matrix-primary hover:bg-matrix-primary hover:text-black transition-colors font-mono uppercase font-bold cursor-pointer"
              >
                Initialize_Simulation
              </button>
            )}
          </div>
          <ConsoleHistory logs={formattedLogs} />
        </div>
      }
    >
      <div className="flex-1 flex items-center justify-center p-4">
        {gameState ? (
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
        ) : (
          <div className="text-matrix-primary animate-pulse font-mono uppercase tracking-widest text-xl glow">
            &gt; Waiting_for_uplink...
          </div>
        )}
      </div>
    </GameLayout>
  )
}

export default App

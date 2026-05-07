import { useEffect, useState } from 'react'
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
import { getOrSetUserId } from './lib/utils'
import { SquadBuilder } from './components/SquadBuilder'
import { TimerDisplay } from './components/TimerDisplay'
import { useGameCommands } from './hooks/useGameCommands'

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
    api.game.getFilteredLogs,
    gameState ? { gameId: gameState._id, playerId } : 'skip',
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

  const gameCommands = useGameCommands({
    playerId,
    gameState,
    logs,
    mutations: {
      logCommand,
      setTyping,
      endTurn,
      moveUnit,
      attackUnit,
      healUnit,
      scanArea,
      setOverwatch,
      sudoMove,
      sudoScan,
      sudoAttack,
      forfeit,
      offerDraw,
      acceptDraw,
      sendMessage,
      checkDraftTimeout,
      checkTurnTimeout,
    },
  })

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
      setActiveGameId(null)
    }
  }, [activeGameId, gameState])

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

  const myPlayerKey = gameState.p1 === playerId ? 'p1' : 'p2'

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
          onCommand={gameCommands.handleCommand}
          onTyping={(isTyping) =>
            setTyping({ gameId: gameState._id, playerId, isTyping })
          }
          units={gameCommands.visibleUnits}
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
          <ConsoleHistory logs={gameCommands.formattedLogs} />
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
          currentlyVisibleTiles={Array.from(gameCommands.currentlyVisibleTiles)}
          showCoordinates={gameCommands.showCoordinates}
          lastMoveOrigin={gameCommands.lastMoveOrigin ?? undefined}
          lastMoveDestination={gameCommands.lastMoveDestination ?? undefined}
          attackRangeTiles={gameCommands.attackRangeTiles}
          tooltipData={gameCommands.hoverTooltipData ?? undefined}
          tooltipPosition={gameCommands.hoverTooltipPosition ?? undefined}
          onUnitClick={gameCommands.handleUnitClick}
          onUnitHover={gameCommands.handleUnitHover}
          onUnitLeave={gameCommands.handleUnitLeave}
        >
          {gameCommands.visibleUnits.map((u: any) => (
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
              hp={u.hp}
              maxHp={u.maxHp}
              onClick={() => gameCommands.handleUnitClick(u._id)}
              onMouseEnter={() => gameCommands.handleUnitHover(u._id)}
              onMouseLeave={gameCommands.handleUnitLeave}
              currentPlayerId={myPlayerKey}
            />
          ))}
        </GridBoard>
      </div>
    </GameLayout>
  )
}

export default App

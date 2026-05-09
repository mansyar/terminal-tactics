import { useCallback, useEffect, useRef, useState } from 'react'
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
import { DisconnectBanner } from './components/DisconnectBanner'
import { useGameCommands } from './hooks/useGameCommands'
import { useHeartbeat } from './hooks/useHeartbeat'
import { TabCoordinator } from './lib/tabCoordinator'
import type { CLIInputHandle } from './components/Terminal/CLIInput'

function App() {
  const cliRef = useRef<CLIInputHandle>(null)
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
  const connectionStatus = useQuery(
    api.presence.getConnectionStatus,
    gameState?._id ? { gameId: gameState._id } : 'skip',
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
  const checkDisconnect = useMutation(api.presence.checkDisconnect)
  const checkDisconnectGracePeriod = useMutation(
    api.timers.checkDisconnectGracePeriod,
  )
  const heartbeat = useMutation(api.presence.heartbeat)

  // Phase 11: Engineer abilities
  const buildWall = useMutation(api.engineer.buildWall)
  const demolishWall = useMutation(api.engineer.demolishWall)

  // Phase 10: Player identity
  const getOrCreatePlayer = useMutation(api.players.getOrCreatePlayer)
  const setHandle = useMutation(api.players.setHandle)
  const getMatchHistory = useQuery(
    api.players.getMatchHistory,
    playerId ? { userId: playerId } : 'skip',
  )
  const playerData = useQuery(
    api.players.getPlayerByUserId,
    playerId ? { userId: playerId } : 'skip',
  )
  const playerHandle = playerData?.handle ?? playerId

  // Phase 10: Opponent handle & stats
  const opponentUserKey = gameState?.p1 === playerId ? 'p2' : 'p1'
  const opponentId = gameState ? gameState[opponentUserKey] : null
  const playersData = useQuery(
    api.players.getPlayersByUserIds,
    gameState &&
      (gameState.status === 'playing' || gameState.status === 'finished')
      ? {
          userIds: [gameState.p1, gameState.p2].filter(
            (id): id is string => !!id,
          ),
        }
      : 'skip',
  )
  const enemyHandle = opponentId
    ? (playersData?.[opponentId]?.handle ?? opponentId)
    : undefined

  const playerStats = useQuery(
    api.players.getPlayerStats,
    playerId ? { userId: playerId } : 'skip',
  )
  const opponentStats = useQuery(
    api.players.getPlayerStats,
    opponentId ? { userId: opponentId } : 'skip',
  )

  // Phase 10: Rematch
  const initiateRematchMutation = useMutation(api.rematch.initiateRematch)
  const clearRematchMutation = useMutation(api.rematch.clearRematch)
  const rematchInfo = useQuery(
    api.rematch.getRematchInfo,
    activeGameId ? { gameId: activeGameId } : 'skip',
  )

  // Suppress TS warnings — used in CLI commands and UI (Phase D/E)
  void setHandle
  void getMatchHistory
  void playerHandle
  void initiateRematchMutation
  void clearRematchMutation

  // Ensure player doc exists on mount
  useEffect(() => {
    getOrCreatePlayer({ userId: playerId }).catch(() => {
      // Silently handle — will retry on next mount
    })
  }, [getOrCreatePlayer, playerId])

  const gameCommands = useGameCommands({
    playerId,
    gameState,
    logs,
    matchHistory: getMatchHistory,
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
      checkDisconnect,
      checkDisconnectGracePeriod,
      heartbeat,
      setHandle,
      buildWall,
      demolishWall,
    },
  })

  // Heartbeat: only active during "playing" phase
  useHeartbeat({
    gameId: activeGameId,
    playerId,
    heartbeatMutation: heartbeat,
    enabled: gameState?.status === 'playing',
  })

  // Multi-tab prevention: start TabCoordinator when game is active
  const [multiTabDetected, setMultiTabDetected] = useState(false)
  void multiTabDetected // Suppress TS warning — used in Phase 5 UI
  useEffect(() => {
    if (!activeGameId) return

    const coordinator = new TabCoordinator(activeGameId, {
      onSecondaryTabDetected: () => {
        setMultiTabDetected(true)
      },
      onPrimaryAbsent: () => {
        setMultiTabDetected(false)
      },
    })

    coordinator.start()
    return () => coordinator.stop()
  }, [activeGameId])

  // Global Escape key handler — return focus to CLI
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      cliRef.current?.focusInput()
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

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
      <div
        id="game-content"
        className="min-h-screen bg-black flex items-center justify-center p-4"
      >
        {gameState?.status === 'lobby' ? (
          <div className="space-y-4 text-center">
            <div className="text-matrix-primary text-2xl font-mono animate-pulse uppercase glow">
              &gt; Waiting_for_Opponent...
            </div>
            <div className="text-matrix-primary font-mono text-sm">
              OPERATOR: <span className="font-bold">{playerHandle}</span>
            </div>
            <div className="text-matrix-primary/60 font-mono text-sm">
              LOBBY_CODE:{' '}
              <span className="text-matrix-primary font-bold">
                {gameState.code}
              </span>
            </div>
            {gameState.p2 && (
              <div className="text-matrix-primary/70 font-mono text-sm">
                OPPONENT_JOINED:{' '}
                <span className="text-matrix-primary">
                  {playersData?.[gameState.p2]?.handle ?? gameState.p2}
                </span>
              </div>
            )}
            <button
              onClick={() => setActiveGameId(null)}
              tabIndex={0}
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
                : gameState.winner
                  ? 'MISSION_FAILED'
                  : 'DRAW'}
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
                : gameState.winner
                  ? 'CRITICAL FAILURE. SYSTEM COMPROMISED.'
                  : 'MUTUAL_DESTRUCTION. CONNECTION_TERMINATED.'}
            </div>

            {/* Player stats */}
            <div className="grid grid-cols-2 gap-4 border border-matrix-primary/20 p-3 text-xs font-mono">
              <div>
                <div className="text-matrix-primary/50 uppercase text-[10px]">
                  {playerHandle}
                </div>
                <div className="text-matrix-primary">
                  {playerStats
                    ? `${playerStats.wins}W / ${playerStats.losses}L / ${playerStats.draws}D`
                    : '--'}
                </div>
              </div>
              <div>
                <div className="text-matrix-primary/50 uppercase text-[10px]">
                  {enemyHandle ?? 'ENEMY'}
                </div>
                <div className="text-red-400">
                  {opponentStats
                    ? `${opponentStats.wins}W / ${opponentStats.losses}L / ${opponentStats.draws}D`
                    : '--'}
                </div>
              </div>
            </div>

            {/* Game details */}
            <div className="text-xs text-matrix-primary/70 font-mono space-y-1">
              <div>
                TURNS_PLAYED:{' '}
                <span className="text-matrix-primary">{gameState.turnNum}</span>
              </div>
              <div>
                DURATION:{' '}
                <span className="text-matrix-primary">
                  {(gameState as any).gameStartTime &&
                  (gameState as any).finishedAt
                    ? (() => {
                        const ms =
                          (gameState as any).finishedAt -
                          (gameState as any).gameStartTime
                        const m = Math.floor(ms / 60000)
                        const s = Math.round((ms % 60000) / 1000)
                        return `${m}m ${s}s`
                      })()
                    : '--'}
                </span>
              </div>
              <div>
                RESULT:{' '}
                <span className="text-matrix-primary">
                  {gameState.winner === playerId
                    ? 'VICTORY'
                    : gameState.winner
                      ? 'DEFEAT'
                      : 'DRAW'}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-matrix-primary/50 font-mono">
              OPERATION_LOG_SAVED &gt;&gt; /var/logs/{gameState._id}
            </div>

            <div className="flex gap-3 justify-center mt-4">
              {rematchInfo?.rematchCode ? (
                <button
                  onClick={() => {
                    setActiveGameId(rematchInfo.rematchLobbyId)
                  }}
                  tabIndex={0}
                  className="px-4 py-2 border border-matrix-primary text-matrix-primary hover:bg-matrix-primary hover:text-black transition-all font-mono uppercase tracking-widest text-xs"
                >
                  REMATCH_AVAILABLE &gt; {rematchInfo.rematchCode}
                </button>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      await initiateRematchMutation({
                        gameId: gameState._id,
                        playerId,
                      })
                    } catch {
                      // Rematch initiation failed
                    }
                  }}
                  tabIndex={0}
                  className="px-4 py-2 border border-matrix-primary text-matrix-primary hover:bg-matrix-primary hover:text-black transition-all font-mono uppercase tracking-widest text-xs"
                >
                  REMATCH
                </button>
              )}
              <button
                onClick={() => setActiveGameId(null)}
                tabIndex={0}
                className="px-4 py-2 border border-matrix-primary/50 text-matrix-primary/50 hover:text-matrix-primary hover:border-matrix-primary transition-all font-mono uppercase tracking-widest text-xs"
              >
                RETURN_TO_BASE
              </button>
            </div>
          </div>
        ) : (
          <LobbyScreen
            playerId={playerId}
            handle={playerHandle}
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
  const opponentPlayerKey = myPlayerKey === 'p1' ? 'p2' : 'p1'

  const myStatus = connectionStatus
    ? myPlayerKey === 'p1'
      ? connectionStatus.p1Status
      : connectionStatus.p2Status
    : 'connected'
  const opponentStatus = connectionStatus
    ? opponentPlayerKey === 'p1'
      ? connectionStatus.p1Status
      : connectionStatus.p2Status
    : 'connected'
  const disconnectStartTime = connectionStatus?.disconnectStartTime ?? null

  const isTimerPaused = isMyTurn && myStatus === 'disconnected'

  const otherPlayerTyping =
    playerId === gameState.p1 ? gameState.p2Typing : gameState.p1Typing

  const revealedTiles =
    playerId === gameState.p1
      ? gameState.p1RevealedTiles
      : gameState.p2RevealedTiles

  return (
    <>
      <a
        href="#game-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-black focus:text-matrix-primary focus:border focus:border-matrix-primary focus:font-mono focus:text-sm"
      >
        Skip to game content
      </a>
      <div id="game-content">
        <GameLayout
          cli={
            <CLIInput
              ref={cliRef}
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
                    {playerHandle}
                  </div>
                </div>

                <DisconnectBanner
                  opponentStatus={opponentStatus}
                  myStatus={myStatus}
                  remainingGraceMs={
                    disconnectStartTime
                      ? Math.max(
                          0,
                          120_000 - (Date.now() - disconnectStartTime),
                        )
                      : null
                  }
                />

                <TurnIndicator
                  turnNum={gameState.turnNum}
                  isMyTurn={isMyTurn}
                  enemyTyping={otherPlayerTyping}
                  enemyDisconnected={opponentStatus === 'disconnected'}
                  enemyHandle={enemyHandle}
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
                      paused={isTimerPaused}
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
              currentlyVisibleTiles={Array.from(
                gameCommands.currentlyVisibleTiles,
              )}
              showCoordinates={gameCommands.showCoordinates}
              lastMoveOrigin={gameCommands.lastMoveOrigin ?? undefined}
              lastMoveDestination={
                gameCommands.lastMoveDestination ?? undefined
              }
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
      </div>
    </>
  )
}

export default App

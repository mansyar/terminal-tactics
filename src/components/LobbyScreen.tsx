import React, { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

interface LobbyScreenProps {
  playerId: string
  onGameJoined: (gameId: string) => void
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  playerId,
  onGameJoined,
}) => {
  const [code, setCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createLobby = useMutation(api.lobby.createLobby)
  const joinLobby = useMutation(api.lobby.joinLobby)
  const joinQuickPlay = useMutation(api.lobby.joinQuickPlay)

  const handleCreate = async (isPublic: boolean) => {
    setIsCreating(true)
    setError(null)
    try {
      const result = await createLobby({ isPublic, p1: playerId })
      onGameJoined(result.gameId)
    } catch (e: any) {
      setError(e.message)
      setIsCreating(false)
    }
  }

  const handleJoin = async () => {
    setError(null)
    if (!code) {
      setError('ENTER_UPLINK_CODE')
      return
    }
    try {
      const gameId = await joinLobby({ code, p2: playerId })
      onGameJoined(gameId)
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleQuickPlay = async () => {
    setError(null)
    try {
      const gameId = await joinQuickPlay({ playerId })
      onGameJoined(gameId)
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] border border-matrix-primary/30 p-8 space-y-8 bg-black/50 backdrop-blur-sm shadow-[0_0_20px_rgba(0,255,0,0.1)]">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-mono font-bold text-matrix-primary glow tracking-[0.2em]">
          TERMINAL_TACTICS
        </h1>
        <p className="text-matrix-primary/60 font-mono text-sm uppercase tracking-widest">
          Establish_Uplink_to_Continue
        </p>
      </div>

      {error && (
        <div className="border border-red-500/50 bg-red-500/10 p-3 text-red-500 font-mono text-xs uppercase animate-pulse">
          ERROR: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
        {/* Private Lobby Section */}
        <div className="border border-matrix-primary/30 p-6 space-y-4">
          <h2 className="text-matrix-primary font-mono text-lg font-bold border-b border-matrix-primary/20 pb-2">
            PRIVATE_SESSION
          </h2>

          <div className="space-y-4">
            <button
              onClick={() => handleCreate(false)}
              disabled={isCreating}
              className="w-full py-3 border border-matrix-primary text-matrix-primary hover:bg-matrix-primary hover:text-black transition-all font-mono uppercase font-bold text-sm tracking-tighter"
            >
              {isCreating ? 'INITIALIZING...' : 'CREATE_NEW_SESSION'}
            </button>

            <div className="relative pt-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-matrix-primary/20"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0A0A0A] px-2 text-matrix-primary/40 font-mono">
                  OR
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ENTER_UPLINK_CODE"
                maxLength={4}
                className="w-full bg-black border border-matrix-primary/50 p-3 text-matrix-primary font-mono text-center focus:border-matrix-primary outline-none focus:ring-1 focus:ring-matrix-primary transition-all placeholder:text-matrix-primary/20"
              />
              <button
                onClick={handleJoin}
                className="w-full py-3 border border-matrix-primary/50 text-matrix-primary/80 hover:border-matrix-primary hover:text-matrix-primary transition-all font-mono uppercase text-sm"
              >
                JOIN_EXISTING
              </button>
            </div>
          </div>
        </div>

        {/* Quick Play Section */}
        <div className="border border-matrix-primary/30 p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-matrix-primary font-mono text-lg font-bold border-b border-matrix-primary/20 pb-2">
              PUBLIC_UPLINK
            </h2>
            <p className="text-xs text-matrix-primary/60 font-mono leading-relaxed italic">
              Join the general queue to match with another available operative.
              Procedural maps will be generated upon connection.
            </p>
          </div>

          <button
            onClick={handleQuickPlay}
            className="w-full py-5 border-2 border-matrix-primary text-matrix-primary hover:bg-matrix-primary/10 transition-all font-mono uppercase font-black text-xl tracking-[0.2em] group relative overflow-hidden"
          >
            <span className="relative z-10">QUICK_PLAY</span>
            <div className="absolute inset-0 bg-matrix-primary opacity-0 group-hover:opacity-5 transition-opacity"></div>
          </button>
        </div>
      </div>

      <div className="text-[10px] text-matrix-primary/30 font-mono uppercase">
        Operative_ID: <span className="text-matrix-primary/50">{playerId}</span>
      </div>
    </div>
  )
}

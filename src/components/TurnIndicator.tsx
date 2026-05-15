import React from 'react'

interface TurnIndicatorProps {
  turnNum: number
  isMyTurn: boolean
  enemyTyping?: boolean
  enemyDisconnected?: boolean
  enemyHandle?: string
  isAI?: boolean
  aiThinking?: boolean
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  turnNum,
  isMyTurn,
  enemyTyping,
  enemyDisconnected,
  enemyHandle,
  isAI,
  aiThinking,
}) => {
  return (
    <div
      className="border border-matrix-primary/30 p-2 space-y-2"
      role="status"
    >
      <div className="text-[10px] text-matrix-primary/50 uppercase">
        Session_Status
      </div>
      <div className="text-matrix-primary font-bold">
        {aiThinking ? (
          <span className="animate-pulse">AI_THINKING...</span>
        ) : isMyTurn ? (
          'MY_TURN'
        ) : enemyHandle ? (
          `WAITING_FOR ${enemyHandle.toUpperCase()}`
        ) : (
          'WAITING_FOR_ENEMY'
        )}
      </div>
      {isAI && aiThinking && (
        <div className="text-[9px] text-matrix-primary/40 animate-pulse mt-1">
          &gt; AI_processing_actions...
        </div>
      )}
      {enemyDisconnected && !aiThinking && (
        <div className="text-[9px] text-red-400/80 animate-pulse mt-1">
          &gt; ENEMY_DISCONNECTED
        </div>
      )}
      {enemyTyping && !enemyDisconnected && !aiThinking && (
        <div className="text-[9px] text-matrix-primary/40 animate-pulse mt-1">
          &gt; Enemy_is_typing...
        </div>
      )}
      <div className="text-[10px] text-matrix-primary/50 uppercase pt-1 border-t border-matrix-primary/10">
        Turn_Num: {turnNum}
      </div>
    </div>
  )
}

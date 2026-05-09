import React from 'react'

interface TurnIndicatorProps {
  turnNum: number
  isMyTurn: boolean
  enemyTyping?: boolean
  enemyDisconnected?: boolean
  enemyHandle?: string
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  turnNum,
  isMyTurn,
  enemyTyping,
  enemyDisconnected,
  enemyHandle,
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
        {isMyTurn
          ? 'MY_TURN'
          : enemyHandle
            ? `WAITING_FOR ${enemyHandle.toUpperCase()}`
            : 'WAITING_FOR_ENEMY'}
      </div>
      {enemyDisconnected && (
        <div className="text-[9px] text-red-400/80 animate-pulse mt-1">
          &gt; ENEMY_DISCONNECTED
        </div>
      )}
      {enemyTyping && !enemyDisconnected && (
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

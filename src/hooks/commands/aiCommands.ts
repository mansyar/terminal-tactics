import { getBotDifficulty, isBot } from '../../lib/botDetection'

export async function handleAITurnTrigger(
  gameState: any,
  mutations: any,
  aiThinkingRef: { current: boolean },
  setAiThinking: (v: boolean) => void,
) {
  const opponentId =
    gameState.currentPlayer === 'p1' ? gameState.p2 : gameState.p1
  if (!opponentId || !isBot(opponentId) || aiThinkingRef.current) return

  aiThinkingRef.current = true
  setAiThinking(true)

  // 1.5s "thinking" delay for human readability
  await new Promise((resolve) => setTimeout(resolve, 1500))

  try {
    const difficulty = getBotDifficulty(opponentId) ?? 'medium'
    await mutations.aiTurn({ gameId: gameState._id, difficulty })
  } catch (err) {
    console.error('[AI] Turn mutation failed:', err)
    // Fallback: manually advance turn via endTurn for the AI
    try {
      await mutations.endTurn({
        gameId: gameState._id,
        playerId: opponentId,
      })
    } catch {
      // If endTurn also fails, the timer mechanism will handle it
    }
  } finally {
    aiThinkingRef.current = false
    setAiThinking(false)
  }
}

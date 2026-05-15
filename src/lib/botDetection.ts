// Bot identification constants and helper
export const BOT_IDS = {
  EASY: '__ai_easy__',
  MEDIUM: '__ai_medium__',
  HARD: '__ai_hard__',
} as const

export type BotDifficulty = 'easy' | 'medium' | 'hard'

export const BOT_HANDLE_MAP: Record<string, string> = {
  [BOT_IDS.EASY]: 'AI_EASY',
  [BOT_IDS.MEDIUM]: 'AI_MEDIUM',
  [BOT_IDS.HARD]: 'AI_HARD',
}

export const BOT_DIFFICULTIES: Array<{ key: BotDifficulty; label: string }> = [
  { key: 'easy', label: 'EASY' },
  { key: 'medium', label: 'MEDIUM' },
  { key: 'hard', label: 'HARD' },
]

export function isBot(id: string | undefined | null): boolean {
  if (!id) return false
  return id.startsWith('__ai_')
}

export function getBotHandle(id: string | undefined | null): string | null {
  if (!id || !isBot(id)) return null
  return BOT_HANDLE_MAP[id] ?? id.toUpperCase()
}

export function getBotDifficulty(
  id: string | undefined | null,
): BotDifficulty | null {
  if (!id || !isBot(id)) return null
  if (id === BOT_IDS.EASY) return 'easy'
  if (id === BOT_IDS.MEDIUM) return 'medium'
  if (id === BOT_IDS.HARD) return 'hard'
  return 'medium' // fallback
}

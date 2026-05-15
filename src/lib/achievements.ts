// Achievement definitions and checking logic — pure functions, no Convex deps

export const ACHIEVEMENT_DEFINITIONS: Record<
  string,
  { id: string; name: string; description: string }
> = {
  first_blood: {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Win your first-ever game',
  },
  tactician: {
    id: 'tactician',
    name: 'Tactician',
    description: 'Win without losing any of your units',
  },
  comeback_kid: {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Win after losing 3+ of your own units',
  },
  sudo_master: {
    id: 'sudo_master',
    name: 'Sudo Master',
    description: 'Win a game where you used sudo commands',
  },
  patience: {
    id: 'patience',
    name: 'Patience',
    description: 'Win a game lasting 20+ turns',
  },
  speed_demon: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Win a game in under 5 turns',
  },
}

export const ACHIEVEMENT_IDS = Object.keys(ACHIEVEMENT_DEFINITIONS)

export interface AchievementCheckInput {
  playerWon: boolean
  playerRole: 'p1' | 'p2'
  unitsLostP1: number
  unitsLostP2: number
  turnNum: number
  sudoUsedThisGame: boolean
  preGameGamesPlayed: number
  existingAchievements: Array<string>
}

export function evaluateNewAchievements(
  input: AchievementCheckInput,
): Array<string> {
  const newlyUnlocked: Array<string> = []
  const alreadyHave = new Set(input.existingAchievements)

  for (const id of ACHIEVEMENT_IDS) {
    if (alreadyHave.has(id)) continue // Already unlocked

    const unlocked = checkAchievement(id, input)
    if (unlocked) {
      newlyUnlocked.push(id)
    }
  }

  return newlyUnlocked
}

function checkAchievement(id: string, input: AchievementCheckInput): boolean {
  if (!input.playerWon) return false // All achievements require a win

  const playerUnitsLost =
    input.playerRole === 'p1' ? input.unitsLostP1 : input.unitsLostP2

  switch (id) {
    case 'first_blood':
      return input.preGameGamesPlayed === 0

    case 'tactician':
      return playerUnitsLost === 0

    case 'comeback_kid':
      return playerUnitsLost >= 3

    case 'sudo_master':
      return input.sudoUsedThisGame

    case 'patience':
      return input.turnNum >= 20

    case 'speed_demon':
      return input.turnNum <= 5

    default:
      return false
  }
}

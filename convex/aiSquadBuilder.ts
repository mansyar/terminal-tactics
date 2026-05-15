import { UNIT_TEMPLATES } from '../src/lib/unitTemplates'

const BUDGET = 1000

// Difficulty-based squad compositions (max 5 units, within budget)
const AI_SQUADS: { [key: string]: Array<string> | undefined } = {
  easy: ['K', 'A', 'S'], // Knight + Archer + Scout (300+200+150 = 650cr)
  medium: ['K', 'A', 'M', 'S'], // Knight + Archer + Medic + Scout (300+200+250+150 = 900cr)
  hard: ['C', 'R', 'M'], // Commander(400) + Sniper(350) + Medic(250) = 1000cr
}

export function getAISquad(difficulty: string): Array<string> {
  const squad = AI_SQUADS[difficulty]

  if (!squad) {
    // Fallback for unknown difficulty — random valid squad
    return generateRandomSquad()
  }

  // Validate budget
  const cost = squad.reduce((sum, type) => sum + UNIT_TEMPLATES[type].cost, 0)

  if (cost > BUDGET) {
    return generateRandomSquad() // Fallback if composition exceeds budget
  }

  return [...squad]
}

function generateRandomSquad(): Array<string> {
  const types = Object.keys(UNIT_TEMPLATES)
  const squad: Array<string> = []

  // Pick up to 3 random units within budget
  let remaining = BUDGET
  while (squad.length < 3 && squad.length < 5) {
    const available = types.filter((t) => UNIT_TEMPLATES[t].cost <= remaining)
    if (available.length === 0) break

    const pick = available[Math.floor(Math.random() * available.length)]
    squad.push(pick)
    remaining -= UNIT_TEMPLATES[pick].cost
  }

  return squad
}

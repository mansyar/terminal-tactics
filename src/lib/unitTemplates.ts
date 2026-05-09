export interface UnitTemplate {
  cost: number
  hp: number
  ap: number
  atk: number
  rng: number
  vis: number
  label: string
}

export const UNIT_TEMPLATES: Record<string, UnitTemplate> = {
  K: { cost: 300, hp: 100, ap: 2, atk: 30, rng: 1, vis: 3, label: 'Knight' },
  A: { cost: 200, hp: 60, ap: 2, atk: 20, rng: 5, vis: 5, label: 'Archer' },
  S: { cost: 150, hp: 50, ap: 4, atk: 15, rng: 2, vis: 4, label: 'Scout' },
  M: { cost: 250, hp: 70, ap: 3, atk: 0, rng: 2, vis: 3, label: 'Medic' },
  E: { cost: 200, hp: 60, ap: 3, atk: 10, rng: 1, vis: 3, label: 'Engineer' },
  R: { cost: 350, hp: 40, ap: 2, atk: 40, rng: 8, vis: 6, label: 'Sniper' },
  C: { cost: 400, hp: 80, ap: 2, atk: 20, rng: 2, vis: 4, label: 'Commander' },
}

/**
 * Preset map definitions for Phase 11 Content Expansion.
 *
 * Each preset is a 12x12 grid of tiles.
 * Tile types: 'floor', 'wall', 'highground'
 */

export type TileType = 'floor' | 'wall' | 'highground'

export interface PresetMap {
  name: string
  description: string
  tiles: Array<Array<TileType>>
}

// Helper: create an empty 12x12 floor grid
function emptyGrid(): Array<Array<TileType>> {
  return Array.from({ length: 12 }, () =>
    Array.from({ length: 12 }, () => 'floor' as TileType),
  )
}

/**
 * The Grid — Symmetrical, open sightlines.
 * Central open area with walls along the edges and scattered high ground.
 * Minimal chokepoints; encourages direct engagement.
 */
function buildTheGrid(): Array<Array<TileType>> {
  const g = emptyGrid()

  // Border walls along edges (rows 0-1 and 10-11 are spawn zones — keep clear)
  // Walls along columns 0 and 11, rows 2-9
  for (let y = 2; y <= 9; y++) {
    g[y][0] = 'wall'
    g[y][11] = 'wall'
  }
  // Walls along rows 2 and 9, columns 1-10
  for (let x = 1; x <= 10; x++) {
    g[2][x] = 'wall'
    g[9][x] = 'wall'
  }

  // Scattered high ground platforms in the center
  g[5][5] = 'highground'
  g[5][6] = 'highground'
  g[6][5] = 'highground'
  g[6][6] = 'highground'

  // Additional high ground on flanks
  g[4][3] = 'highground'
  g[4][8] = 'highground'
  g[7][3] = 'highground'
  g[7][8] = 'highground'

  return g
}

/**
 * The Maze — Tight corridors, heavy cover.
 * Winding corridors with frequent wall cover.
 * Multiple flanking routes; rewards positioning and unit abilities.
 */
function buildTheMaze(): Array<Array<TileType>> {
  const g = emptyGrid()

  // Outer border walls (keep spawn rows clear)
  for (let y = 2; y <= 9; y++) {
    g[y][0] = 'wall'
    g[y][11] = 'wall'
  }

  // Horizontal wall segments creating corridors
  // Row 3: wall except for gaps
  for (let x = 1; x <= 10; x++) {
    if (x !== 3 && x !== 8) g[3][x] = 'wall'
  }

  // Row 6: wall except for center gap
  for (let x = 1; x <= 10; x++) {
    if (x !== 5 && x !== 6) g[6][x] = 'wall'
  }

  // Row 8: wall except for gaps
  for (let x = 1; x <= 10; x++) {
    if (x !== 3 && x !== 8) g[8][x] = 'wall'
  }

  // Vertical wall columns creating maze-like passages
  // Column 2: wall except gaps
  for (let y = 2; y <= 9; y++) {
    if (y !== 4 && y !== 7) g[y][2] = 'wall'
  }

  // Column 5: wall except gap
  for (let y = 2; y <= 9; y++) {
    if (y !== 5) g[y][5] = 'wall'
  }

  // Column 9: wall except gap
  for (let y = 2; y <= 9; y++) {
    if (y !== 6) g[y][9] = 'wall'
  }

  return g
}

/**
 * The Ridge — High ground focus.
 * Elevated center ridge with high ground tiles.
 * Spawn zones at low elevation; promotes ranged unit strategy.
 */
function buildTheRidge(): Array<Array<TileType>> {
  const g = emptyGrid()

  // Border walls along edges (keep spawn zones clear)
  for (let y = 2; y <= 9; y++) {
    g[y][0] = 'wall'
    g[y][11] = 'wall'
  }
  // Horizontal border walls
  for (let x = 1; x <= 10; x++) {
    g[2][x] = 'wall'
    g[9][x] = 'wall'
  }

  // Central ridge (row 5-6): continuous high ground
  for (let x = 3; x <= 8; x++) {
    g[5][x] = 'highground'
    g[6][x] = 'highground'
  }

  // Flanking high ground approach points
  g[4][3] = 'highground'
  g[4][8] = 'highground'
  g[7][3] = 'highground'
  g[7][8] = 'highground'

  // Small high ground outcrops on ridge edges
  g[5][2] = 'highground'
  g[6][2] = 'highground'
  g[5][9] = 'highground'
  g[6][9] = 'highground'

  return g
}

export const PRESET_MAPS: Record<string, PresetMap> = {
  grid: {
    name: 'The Grid',
    description: 'Symmetrical, open sightlines. Showcases core tactics.',
    tiles: buildTheGrid(),
  },
  maze: {
    name: 'The Maze',
    description: 'Tight corridors, heavy cover. Showcases Engineer wall plays.',
    tiles: buildTheMaze(),
  },
  ridge: {
    name: 'The Ridge',
    description: 'High ground focus. Showcases Sniper elevation advantage.',
    tiles: buildTheRidge(),
  },
}

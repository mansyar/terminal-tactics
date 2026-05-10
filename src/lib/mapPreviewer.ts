/**
 * ASCII map previewer for Phase 11 Content Expansion.
 * Renders a preset map as an ASCII grid string.
 */

import type { PresetMap, TileType } from './mapPresets'

function tileToChar(tile: TileType): string {
  switch (tile) {
    case 'floor':
      return '.'
    case 'wall':
      return '#'
    case 'highground':
      return '^'
  }
}

/**
 * Renders a preset map as an ASCII string where:
 * - `.` = floor
 * - `#` = wall
 * - `^` = high ground
 *
 * Returns 12 rows separated by newlines, each 12 characters wide.
 */
export function renderMapAscii(map: PresetMap): string {
  return map.tiles.map((row) => row.map(tileToChar).join('')).join('\n')
}

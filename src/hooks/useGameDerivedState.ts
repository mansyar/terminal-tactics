import { useMemo } from 'react'
import { hasLineOfSight } from '../lib/combatSystem'
import type { LogEntry } from '../components/Terminal/ConsoleHistory'

export function useGameDerivedState(
  gameState: any,
  playerId: string,
  logs: any,
  selectedUnit: string | null,
  hoveredUnit: string | null,
) {
  const formattedLogs = useMemo(() => {
    const result: Array<LogEntry> = []
    if (!logs) return result

    for (const l of logs) {
      const isPrivate = l.visibility === 'private'
      result.push({
        timestamp: l.timestamp,
        content: l.commandString,
        type: 'input',
        isPrivate,
      })
      result.push({
        timestamp: l.timestamp,
        content: l.result,
        type: l.result.startsWith('ERROR') ? 'error' : 'output',
        isPrivate,
      })
    }
    return result
  }, [logs])

  const currentlyVisibleTiles = useMemo(() => {
    if (!gameState || !playerId) return new Set<string>()
    const myPlayerKey = gameState.p1 === playerId ? 'p1' : 'p2'
    const myUnits = gameState.units.filter(
      (u: any) => u.ownerId === myPlayerKey,
    )

    const set = new Set<string>()
    myUnits.forEach((u: any) => {
      const vis = u.vis || 3
      for (let dy = -vis; dy <= vis; dy++) {
        for (let dx = -vis; dx <= vis; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) <= vis) {
            const tx = u.x + dx
            const ty = u.y + dy
            if (tx >= 0 && tx < 12 && ty >= 0 && ty < 12) {
              if (
                hasLineOfSight(
                  { x: u.x, y: u.y },
                  { x: tx, y: ty },
                  gameState.mapData,
                )
              ) {
                set.add(`${tx},${ty}`)
              }
            }
          }
        }
      }
    })
    return set
  }, [gameState, playerId])

  const visibleUnits = useMemo(() => {
    if (!gameState) return []
    const myPlayerKey = gameState.p1 === playerId ? 'p1' : 'p2'

    return gameState.units.filter((u: any) => {
      if (u.ownerId === myPlayerKey) return true

      // Enemy visibility
      const isVisible = currentlyVisibleTiles.has(`${u.x},${u.y}`)

      // Scout stealth check: invisible unless adjacent
      if (u.type === 'S' && u.isStealthed) {
        const myUnits = gameState.units.filter(
          (my: any) => my.ownerId === myPlayerKey,
        )
        const isAdjacent = myUnits.some(
          (my: any) => Math.abs(my.x - u.x) + Math.abs(my.y - u.y) <= 1,
        )
        if (!isAdjacent) return false
      }

      return isVisible
    })
  }, [gameState, currentlyVisibleTiles, playerId])

  // Attack range preview from selected/hovered unit
  const attackRangeTiles = useMemo(() => {
    if (!gameState || (!selectedUnit && !hoveredUnit)) return []
    const targetId = selectedUnit || hoveredUnit
    const unit = gameState.units.find((u: any) => u._id === targetId)
    if (!unit) return []
    const rng = unit.rng || 1
    const tiles: Array<string> = []
    for (let dy = -rng; dy <= rng; dy++) {
      for (let dx = -rng; dx <= rng; dx++) {
        if (Math.abs(dx) + Math.abs(dy) <= rng) {
          const tx = unit.x + dx
          const ty = unit.y + dy
          if (tx >= 0 && tx < 12 && ty >= 0 && ty < 12) {
            tiles.push(`${tx},${ty}`)
          }
        }
      }
    }
    return tiles
  }, [gameState, selectedUnit, hoveredUnit])

  // Hover tooltip — single pass lookup for data + position
  const hoverTooltipInfo = useMemo(() => {
    if (!gameState || !hoveredUnit) return null
    const unit = gameState.units.find((u: any) => u._id === hoveredUnit)
    if (!unit) return null
    return {
      data: {
        type: unit.type,
        hp: unit.hp,
        maxHp: unit.maxHp,
        ap: unit.ap,
        maxAp: unit.maxAp,
        atk: unit.atk ?? 0,
        rng: unit.rng ?? 1,
      },
      position: { x: unit.x * 100, y: unit.y * 100 },
    }
  }, [gameState, hoveredUnit])

  const hoverTooltipData = hoverTooltipInfo?.data
  const hoverTooltipPosition = hoverTooltipInfo?.position

  return {
    formattedLogs,
    currentlyVisibleTiles,
    visibleUnits,
    attackRangeTiles,
    hoverTooltipData,
    hoverTooltipPosition,
  }
}

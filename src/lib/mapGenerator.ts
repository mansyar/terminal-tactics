export type TileType = 'floor' | 'wall' | 'highground'

export interface MapData {
  tiles: Array<Array<TileType>>
  width: number
  height: number
}

export function generateMap(width: number, height: number): MapData {
  // 1. Initialize with random walls (~35% chance)
  let grid: Array<Array<TileType>> = Array.from({ length: height }, () =>
    Array.from({ length: width }, () =>
      Math.random() < 0.35 ? 'wall' : 'floor',
    ),
  )

  // 2. Cellular Automata (4 iterations)
  for (let i = 0; i < 4; i++) {
    grid = runIteration(grid)
  }

  // 3. Clear spawn zones (bottom 2 rows for p1, top 2 rows for p2)
  for (let x = 0; x < width; x++) {
    grid[0][x] = 'floor'
    grid[1][x] = 'floor'
    grid[height - 1][x] = 'floor'
    grid[height - 2][x] = 'floor'
  }

  // 4. Add high ground (clusters of ^)
  for (let y = 2; y < height - 2; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === 'floor' && Math.random() < 0.1) {
        grid[y][x] = 'highground'
      }
    }
  }

  return {
    tiles: grid,
    width,
    height,
  }
}

function runIteration(grid: Array<Array<TileType>>): Array<Array<TileType>> {
  const height = grid.length
  const width = grid[0].length
  const newGrid: Array<Array<TileType>> = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => 'floor'),
  )

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const walls = countWallNeighbors(grid, x, y)
      if (grid[y][x] === 'wall') {
        newGrid[y][x] = walls >= 4 ? 'wall' : 'floor'
      } else {
        newGrid[y][x] = walls >= 5 ? 'wall' : 'floor'
      }
    }
  }

  return newGrid
}

function countWallNeighbors(grid: Array<Array<TileType>>, x: number, y: number): number {
  let count = 0
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue
      const nx = x + i
      const ny = y + j
      if (nx < 0 || ny < 0 || nx >= grid[0].length || ny >= grid.length) {
        count++ // Boundary counts as wall to keep edges mostly walled
      } else if (grid[ny][nx] === 'wall') {
        count++
      }
    }
  }
  return count
}

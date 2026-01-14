import React from 'react'

export function GridBoard({
  children,
  mapData,
  revealedTiles = [],
  currentlyVisibleTiles = [],
}: {
  children?: React.ReactNode
  mapData?: { tiles: Array<Array<string>>; width: number; height: number }
  revealedTiles?: Array<string>
  currentlyVisibleTiles?: Array<string>
}) {
  const size = 12
  const tileSize = 100
  const boardSize = size * tileSize

  const revealedSet = new Set(revealedTiles)
  const visibleSet = new Set(currentlyVisibleTiles)

  const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

  return (
    <div className="relative h-full w-auto aspect-square mx-auto bg-black overflow-hidden">
      <svg
        viewBox={`-50 -50 ${boardSize + 100} ${boardSize + 100}`}
        className="w-full h-full"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Tiles / Terrain */}
        {mapData &&
          mapData.tiles.map((row, y) =>
            row.map((type, x) => {
              const coord = `${x},${y}`
              const isRevealed = revealedSet.has(coord)
              const isVisible = visibleSet.has(coord)

              if (!isRevealed && !isVisible) {
                return (
                  <g
                    key={`${x}-${y}`}
                    transform={`translate(${x * tileSize}, ${y * tileSize})`}
                  >
                    <rect
                      width={tileSize}
                      height={tileSize}
                      className="fill-[#050505] stroke-matrix-primary/2"
                    />
                    <text
                      x={tileSize / 2}
                      y={tileSize / 2 + 10}
                      textAnchor="middle"
                      className="fill-matrix-primary/10 font-mono text-xl select-none"
                    >
                      ?
                    </text>
                  </g>
                )
              }

              return (
                <g
                  key={`${x}-${y}`}
                  transform={`translate(${x * tileSize}, ${y * tileSize})`}
                >
                  <rect
                    width={tileSize}
                    height={tileSize}
                    className={`fill-black stroke-matrix-primary/5 stroke-1 ${
                      type === 'highground' ? 'fill-matrix-primary/3' : ''
                    } ${!isVisible ? 'opacity-40' : ''}`}
                  />
                  {type === 'wall' && (
                    <text
                      x={tileSize / 2}
                      y={tileSize / 2 + 15}
                      textAnchor="middle"
                      className={`fill-matrix-primary/40 font-mono text-4xl select-none ${!isVisible ? 'opacity-30' : ''}`}
                    >
                      #
                    </text>
                  )}
                  {type === 'highground' && (
                    <text
                      x={tileSize / 2}
                      y={tileSize / 2 + 15}
                      textAnchor="middle"
                      className={`fill-matrix-primary/40 font-mono text-4xl select-none ${!isVisible ? 'opacity-30' : ''}`}
                    >
                      ^
                    </text>
                  )}
                </g>
              )
            }),
          )}

        {/* Labels - Rows */}
        {Array.from({ length: size }).map((_, i) => (
          <text
            key={`row-${i}`}
            x="-25"
            y={i * tileSize + 60}
            fill="#00FF00"
            className="text-2xl font-mono opacity-60"
            textAnchor="middle"
          >
            {size - i}
          </text>
        ))}

        {/* Labels - Columns */}
        {cols.map((col, i) => (
          <text
            key={`col-${i}`}
            x={i * tileSize + 50}
            y={boardSize + 30}
            fill="#00FF00"
            className="text-2xl font-mono opacity-60"
            textAnchor="middle"
          >
            {col}
          </text>
        ))}

        {/* Grid Lines */}
        {Array.from({ length: size + 1 }).map((_, i) => (
          <React.Fragment key={i}>
            {/* Horizontal */}
            <line
              x1="0"
              y1={i * tileSize}
              x2={boardSize}
              y2={i * tileSize}
              stroke="#00FF00"
              strokeWidth="0.5"
              className="opacity-20"
            />
            {/* Vertical */}
            <line
              x1={i * tileSize}
              y1="0"
              x2={i * tileSize}
              y2={boardSize}
              stroke="#00FF00"
              strokeWidth="0.5"
              className="opacity-20"
            />
          </React.Fragment>
        ))}

        {/* Playable Area Border */}
        <rect
          x="0"
          y="0"
          width={boardSize}
          height={boardSize}
          fill="none"
          stroke="#00FF00"
          strokeWidth="3"
          className="opacity-30"
        />

        {/* Content (Units/Terrain) */}
        <g>{children}</g>
      </svg>
    </div>
  )
}

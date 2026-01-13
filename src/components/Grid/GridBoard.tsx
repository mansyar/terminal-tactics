import React from 'react'

export function GridBoard({ children }: { children?: React.ReactNode }) {
  const size = 12
  const tileSize = 100
  const boardSize = size * tileSize

  const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

  return (
    <div className="relative w-full aspect-square max-w-[800px] mx-auto border border-matrix-primary/30 bg-black overflow-hidden">
      <svg
        viewBox={`-50 -50 ${boardSize + 100} ${boardSize + 100}`}
        className="w-full h-full"
      >
        {/* Definitions for filters/glows */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Labels - Rows */}
        {Array.from({ length: size }).map((_, i) => (
          <text
            key={`row-${i}`}
            x="-25"
            y={i * tileSize + 60}
            fill="#00FF00"
            className="text-xs font-mono opacity-50"
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
            className="text-xs font-mono opacity-50"
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

        {/* Content (Units/Terrain) */}
        <g>{children}</g>
      </svg>
    </div>
  )
}

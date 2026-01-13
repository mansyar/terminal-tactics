interface UnitModelProps {
  type: string
  x: number
  y: number
  ownerId: string
}

export function UnitModel({ type, x, y, ownerId }: UnitModelProps) {
  // x, y are tile coordinates (0-11)
  // Grid tiles are 100x100
  const color = ownerId === 'p1' ? '#00FF00' : '#00CC00'

  return (
    <g
      transform={`translate(${x * 100}, ${y * 100})`}
      className="transition-all duration-300 ease-in-out"
    >
      {/* Glow effect */}
      <rect
        x="10"
        y="10"
        width="80"
        height="80"
        fill="none"
        stroke={color}
        strokeWidth="1"
        className="opacity-20 glow"
      />
      <text
        x="50"
        y="60"
        textAnchor="middle"
        fill={color}
        className="font-mono text-4xl font-bold glow"
        style={{ pointerEvents: 'none' }}
      >
        [{type}]
      </text>
    </g>
  )
}

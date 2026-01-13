import { motion } from 'framer-motion'

interface UnitModelProps {
  type: string
  x: number
  y: number
  ownerId: string
  direction?: string
  ap: number
  maxAp: number
}

export function UnitModel({
  type,
  x,
  y,
  ownerId,
  direction = 'N',
  ap,
  maxAp,
}: UnitModelProps) {
  // x, y are tile coordinates (0-11)
  // Grid tiles are 100x100
  const color = ownerId === 'p1' ? '#00FF00' : '#00CC00'

  const getLineProps = (dir: string) => {
    switch (dir) {
      case 'N':
        return { x1: 20, y1: 12, x2: 80, y2: 12 } // Top line
      case 'S':
        return { x1: 20, y1: 88, x2: 80, y2: 88 } // Bottom line
      case 'E':
        return { x1: 88, y1: 20, x2: 88, y2: 80 } // Right line
      case 'W':
        return { x1: 12, y1: 20, x2: 12, y2: 80 } // Left line
      default:
        return { x1: 20, y1: 12, x2: 80, y2: 12 }
    }
  }

  const lineProps = getLineProps(direction)

  return (
    <motion.g
      initial={false}
      animate={{ x: x * 100, y: y * 100 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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

      {/* Direction Indicator - Line on facing side */}
      <motion.line
        key={direction}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        x1={lineProps.x1}
        y1={lineProps.y1}
        x2={lineProps.x2}
        y2={lineProps.y2}
        stroke={color}
        strokeWidth="3"
      />

      {/* AP Dots */}
      <g className="opacity-60">
        {Array.from({ length: maxAp }).map((_, i) => (
          <circle
            key={i}
            cx={50 - (maxAp - 1) * 8 + i * 16}
            cy="80"
            r="3"
            fill={i < ap ? color : 'none'}
            stroke={color}
            strokeWidth="1"
          />
        ))}
      </g>
    </motion.g>
  )
}

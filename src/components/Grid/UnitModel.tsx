import { motion } from 'framer-motion'

interface UnitModelProps {
  type: string
  x: number
  y: number
  ownerId: string
  direction?: string
  hp: number
  maxHp: number
  ap: number
  maxAp: number
  isStealthed?: boolean
  isOverwatching?: boolean
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  currentPlayerId?: string
}

export function UnitModel({
  type,
  x,
  y,
  ownerId,
  direction = 'N',
  hp,
  maxHp,
  ap,
  maxAp,
  isStealthed = false,
  isOverwatching = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  currentPlayerId,
}: UnitModelProps) {
  // x, y are tile coordinates (0-11)
  // Grid tiles are 100x100
  const color =
    currentPlayerId !== undefined
      ? ownerId === currentPlayerId
        ? '#00FF00'
        : '#FF4444'
      : ownerId === 'p1'
        ? '#00FF00'
        : '#00CC00'

  const getArrowPoints = (dir: string) => {
    switch (dir) {
      case 'N':
        return '50,5 30,25 70,25' // Triangle pointing up
      case 'S':
        return '50,95 30,75 70,75' // Triangle pointing down
      case 'E':
        return '95,50 75,30 75,70' // Triangle pointing right
      case 'W':
        return '5,50 25,30 25,70' // Triangle pointing left
      default:
        return '50,5 30,25 70,25'
    }
  }

  const arrowPoints = getArrowPoints(direction)

  return (
    <motion.g
      initial={false}
      animate={{
        x: x * 100,
        y: y * 100,
        opacity: 1,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: onClick ? 'pointer' : undefined }}
      className={isStealthed ? 'stealth-shimmer' : ''}
    >
      {/* Overwatch Effect */}
      {isOverwatching && (
        <motion.rect
          x="10"
          y="10"
          width="80"
          height="80"
          fill="none"
          stroke={color}
          strokeWidth="2"
          initial={{ opacity: 0.1 }}
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="glow"
        />
      )}

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
        className={`font-mono text-4xl font-bold glow`}
        style={{ pointerEvents: 'none' }}
      >
        [{type}]
      </text>

      {/* Direction Indicator - Arrow on facing side */}
      <motion.polygon
        key={direction}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        points={arrowPoints}
        fill={color}
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

      {/* Health Bar */}
      <rect
        x="20"
        y="92"
        width="60"
        height="6"
        fill="#003300"
        rx="2"
        data-testid="health-bar-bg"
      />
      <rect
        x="20"
        y="92"
        width={Math.max(0, Math.min(60, (hp / Math.max(1, maxHp)) * 60))}
        height="6"
        fill={
          hp / Math.max(1, maxHp) > 0.5
            ? '#00FF00'
            : hp / Math.max(1, maxHp) > 0.25
              ? '#FFFF00'
              : '#FF4444'
        }
        rx="2"
        data-testid="health-bar-fill"
      />

      {/* Stealth shimmer indicator */}
      {isStealthed && (
        <rect
          x="5"
          y="5"
          width="90"
          height="90"
          fill="none"
          stroke="#00FFFF"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="opacity-60"
          rx="2"
        />
      )}
    </motion.g>
  )
}

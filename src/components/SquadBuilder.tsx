import { useState } from 'react'
import { UNIT_TEMPLATES } from '../../convex/squadBuilder'

interface SquadBuilderProps {
  onDeploy: (squad: Array<string>) => void
  isP1: boolean
}

export function SquadBuilder({ onDeploy }: SquadBuilderProps) {
  const [squad, setSquad] = useState<Array<string>>([])

  const budget = 1000
  const currentCost = squad.reduce(
    (total, type) => total + UNIT_TEMPLATES[type].cost,
    0,
  )
  const remaining = budget - currentCost

  const addUnit = (type: string) => {
    if (remaining >= UNIT_TEMPLATES[type].cost && squad.length < 5) {
      setSquad([...squad, type])
    }
  }

  const removeUnit = (index: number) => {
    const newSquad = [...squad]
    newSquad.splice(index, 1)
    setSquad(newSquad)
  }

  return (
    <div className="max-w-2xl w-full bg-black border border-matrix-primary/30 p-8 space-y-8 font-mono">
      <div className="text-center space-y-2">
        <h2 className="text-2xl text-matrix-primary glow uppercase underline">
          Squad_Initialization
        </h2>
        <div className="text-matrix-primary/60 text-sm">
          ALLOCATE_RESOURCES: 1000_CREDITS_MAX
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Object.entries(UNIT_TEMPLATES).map(([type, stats]) => (
          <button
            key={type}
            onClick={() => addUnit(type)}
            disabled={remaining < stats.cost || squad.length >= 5}
            className="border border-matrix-primary/30 p-4 text-left hover:bg-matrix-primary/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all group"
          >
            <div className="flex justify-between items-start">
              <span className="text-matrix-primary font-bold text-lg group-hover:glow">
                [{type}] {stats.label}
              </span>
              <span className="text-matrix-primary/80">{stats.cost}cr</span>
            </div>
            <div className="text-[10px] text-matrix-primary/50 mt-2">
              HP:{stats.hp} | AP:{stats.ap} | ATK:{stats.atk} | RNG:{stats.rng}
            </div>
          </button>
        ))}
      </div>

      <div className="border border-matrix-primary/30 p-4 space-y-4">
        <div className="flex justify-between text-xs text-matrix-primary/50 border-b border-matrix-primary/10 pb-2">
          <span>SQUAD_MANIFEST ({squad.length}/5)</span>
          <span
            className={remaining < 0 ? 'text-red-500' : 'text-matrix-primary'}
          >
            CREDITS_REMAINING: {remaining}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {squad.map((type, i) => (
            <div
              key={i}
              className="px-3 py-1 border border-matrix-primary text-matrix-primary text-xs flex items-center gap-2 cursor-pointer hover:bg-red-500/20 hover:border-red-500 hover:text-red-500 transition-colors"
              onClick={() => removeUnit(i)}
            >
              [{type}] <span className="text-[8px] opacity-50">X</span>
            </div>
          ))}
          {squad.length === 0 && (
            <div className="text-matrix-primary/20 text-xs italic">
              Awaiting_deployment_orders...
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => onDeploy(squad)}
        disabled={squad.length === 0}
        className="w-full py-3 border-2 border-matrix-primary text-matrix-primary font-bold hover:bg-matrix-primary hover:text-black transition-all disabled:opacity-20 disabled:hover:bg-transparent uppercase glow-sm"
      >
        Initiate_Deployment_Sequence
      </button>
    </div>
  )
}

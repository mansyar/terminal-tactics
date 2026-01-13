import './styles.css'
import { GameLayout } from './components/GameLayout'

function App() {
  return (
    <GameLayout
      cli={
        <div className="flex items-center space-x-2 text-matrix-primary h-full">
          <span className="glow">&gt;</span>
          <input
            type="text"
            className="bg-transparent border-none outline-none flex-1 font-mono text-matrix-primary caret-matrix-primary"
            autoFocus
            placeholder="SYSTEM_IDLE"
          />
        </div>
      }
      sidebar={
        <div className="space-y-4">
          <div className="border border-matrix-primary/30 p-2">
            <div className="text-[10px] text-matrix-primary/50 uppercase">
              User_Identity
            </div>
            <div className="text-matrix-primary italic">ANONYMOUS_R00T</div>
          </div>
          <div className="border border-matrix-primary/30 p-2">
            <div className="text-[10px] text-matrix-primary/50 uppercase">
              Session_Time
            </div>
            <div className="text-matrix-primary">00:05:42</div>
          </div>
          <div className="border border-matrix-primary/30 p-2 bg-matrix-primary/5">
            <div className="text-[10px] text-matrix-primary/50 uppercase">
              Active_Games
            </div>
            <div className="text-matrix-primary">0</div>
          </div>
        </div>
      }
    >
      <div className="text-center space-y-6">
        <div className="text-4xl font-bold tracking-[0.2em] text-matrix-primary glow uppercase">
          Terminal Tactics
        </div>
        <div className="text-matrix-secondary max-w-md mx-auto leading-relaxed">
          Welcome to the minimalist tactical strategy engine. Establish
          connection, draft your squad, and execute commands.
        </div>
        <div className="pt-8 flex justify-center space-x-4">
          <div className="px-4 py-2 border border-matrix-primary text-matrix-primary hover:bg-matrix-primary hover:text-matrix-bg cursor-pointer transition-colors duration-200 uppercase tracking-tighter font-bold">
            Connect
          </div>
          <div className="px-4 py-2 border border-matrix-primary/30 text-matrix-primary/50 cursor-not-allowed uppercase tracking-tighter font-bold">
            Public_Queue
          </div>
        </div>
      </div>
    </GameLayout>
  )
}

export default App

import React from 'react'

interface GameLayoutProps {
  children: React.ReactNode // For the Grid / Main Content
  cli: React.ReactNode // For the CLI input
  sidebar: React.ReactNode // For Stats / Status Panel
}

export const GameLayout: React.FC<GameLayoutProps> = ({
  children,
  cli,
  sidebar,
}) => {
  return (
    <div className="h-screen w-screen bg-matrix-bg flex flex-col md:flex-row p-4 gap-4 overflow-hidden font-mono selection:bg-matrix-primary selection:text-matrix-bg">
      {/* MAIN TERMINAL AREA */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 h-full">
        {/* VIEWPORT / GRID AREA */}
        <div className="flex-1 terminal-border overflow-hidden relative group">
          <div className="absolute top-2 left-2 text-[10px] text-matrix-primary/50 uppercase tracking-widest pointer-events-none">
            [ VIEWPORT_01 ]
          </div>
          <div className="h-full w-full flex items-center justify-center p-4">
            {children}
          </div>

          {/* Subtle decoration corner */}
          <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none opacity-20">
            <div className="absolute bottom-1 right-1 w-2 h-2 bg-matrix-primary" />
            <div className="absolute bottom-1 right-4 w-4 h-px bg-matrix-primary" />
            <div className="absolute bottom-4 right-1 w-px h-4 bg-matrix-primary" />
          </div>
        </div>

        {/* CLI AREA */}
        <div className="h-32 terminal-border p-4 relative">
          <div className="absolute top-2 left-2 text-[10px] text-matrix-primary/50 uppercase tracking-widest pointer-events-none">
            [ COMMAND_BUFFER ]
          </div>
          <div className="h-full w-full mt-2">{cli}</div>
        </div>
      </div>

      {/* SIDEBAR / STATUS AREA */}
      <div className="w-full md:w-80 h-full flex flex-col gap-4">
        <div className="flex-1 terminal-border p-4 relative overflow-hidden flex flex-col">
          <div className="absolute top-2 left-2 text-[10px] text-matrix-primary/50 uppercase tracking-widest pointer-events-none">
            [ SYSTEM_STATUS ]
          </div>
          <div className="mt-6 flex-1 overflow-y-auto custom-scrollbar">
            {sidebar}
          </div>
        </div>

        {/* LOGS / NOTIFICATIONS */}
        <div className="h-48 terminal-border p-4 relative overflow-hidden">
          <div className="absolute top-2 left-2 text-[10px] text-matrix-primary/50 uppercase tracking-widest pointer-events-none">
            [ KERNEL_LOGS ]
          </div>
          <div className="mt-6 text-[12px] space-y-1 opacity-80">
            <div className="text-matrix-secondary">
              <span className="text-matrix-primary">[0.00]</span>{' '}
              INITIALIZING_SYSTEM...
            </div>
            <div className="text-matrix-secondary">
              <span className="text-matrix-primary">[0.02]</span>{' '}
              ESTABLISHING_LINK...
            </div>
            <div className="text-matrix-primary italic animate-pulse">
              [0.05] READY.
            </div>
          </div>
        </div>
      </div>

      {/* GLOBAL CRT OVERLAY (Duplicated here if needed, but styles.css covers it) */}
    </div>
  )
}

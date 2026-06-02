'use client'

import { cn } from '@shared/lib/utils'

interface AuroraProps {
  className?: string
  colorStart?: string
  colorEnd?: string
  speed?: number
}

export function Aurora({
  className,
  colorStart = '#a78bfa',
  colorEnd = '#3b82f6',
  speed = 8,
}: AuroraProps) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden -z-10', className)}>
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 40%, ${colorStart}40, transparent 70%),
            radial-gradient(ellipse 60% 80% at 80% 20%, ${colorEnd}30, transparent 70%),
            radial-gradient(ellipse 70% 50% at 50% 80%, ${colorStart}20, transparent 70%)
          `,
          animation: `aurora ${speed}s ease-in-out infinite alternate`,
        }}
      />
      <style>{`
        @keyframes aurora {
          0% { transform: scale(1) rotate(0deg); opacity: 0.3; }
          50% { transform: scale(1.1) rotate(2deg); opacity: 0.4; }
          100% { transform: scale(1.05) rotate(-1deg); opacity: 0.35; }
        }
      `}</style>
    </div>
  )
}

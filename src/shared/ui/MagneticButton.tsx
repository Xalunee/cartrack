'use client'

import { useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { cn } from '@shared/lib/utils'

interface MagneticButtonProps {
  children: ReactNode
  className?: string
  as?: 'button' | 'a'
  href?: string
  onClick?: () => void
  strength?: number
}

export function MagneticButton({
  children,
  className,
  as = 'button',
  href,
  onClick,
  strength = 0.3,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0 })

  function handleMouseMove(event: MouseEvent) {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const x = (event.clientX - rect.left - rect.width / 2) * strength
    const y = (event.clientY - rect.top - rect.height / 2) * strength

    setTransform({ x, y })
  }

  function handleMouseLeave() {
    setTransform({ x: 0, y: 0 })
  }

  const Tag = as

  return (
    <Tag
      ref={ref as never}
      className={cn('inline-block transition-transform duration-200 ease-out', className)}
      style={{ transform: `translate(${transform.x}px, ${transform.y}px)` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      href={href}
      onClick={onClick}
    >
      {children}
    </Tag>
  )
}

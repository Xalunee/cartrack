'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@shared/lib/utils'
import { useMediaQuery } from '@shared/lib/client-env'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Stagger delay in ms, applied once the element enters the viewport. */
  delay?: number
  as?: 'div' | 'section' | 'li'
}

export function Reveal({ children, className, delay = 0, as = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [revealed, setRevealed] = useState(false)
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  // Reduced motion means "already revealed" — no observer, nothing to animate.
  const visible = revealed || reduceMotion

  useEffect(() => {
    if (reduceMotion) return

    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setRevealed(true)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [reduceMotion])

  const Tag = as

  return (
    <Tag
      ref={ref as never}
      className={cn(
        'transition-all duration-700 ease-out motion-reduce:transition-none',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        className,
      )}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </Tag>
  )
}

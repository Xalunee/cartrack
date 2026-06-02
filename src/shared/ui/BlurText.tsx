'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@shared/lib/utils'

interface BlurTextProps {
  text: string
  className?: string
  delay?: number
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
}

export function BlurText({
  text,
  className,
  delay = 0,
  as: Tag = 'span',
}: BlurTextProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [delay])

  const words = text.split(' ')

  return (
    <Tag ref={ref as never} className={cn('inline-block', className)}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="inline-block transition-all duration-700 mr-[0.25em]"
          style={{
            filter: isVisible ? 'blur(0px)' : 'blur(12px)',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
            transitionDelay: `${index * 80}ms`,
          }}
        >
          {word}
        </span>
      ))}
    </Tag>
  )
}

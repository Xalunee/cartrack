'use client'

import { useState, useEffect } from 'react'

interface RotatingWordProps {
  words: string[]
  className?: string
  interval?: number
}

export function RotatingWord({ words, className, interval = 2200 }: RotatingWordProps) {
  const [index, setIndex] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const timer = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setIndex((i) => (i + 1) % words.length)
        setAnimating(false)
      }, 300)
    }, interval)
    return () => clearInterval(timer)
  }, [words.length, interval])

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        opacity: animating ? 0 : 1,
        transform: animating ? 'translateY(-8px)' : 'translateY(0)',
        color: '#2383E2',
      }}
    >
      {words[index]}
    </span>
  )
}

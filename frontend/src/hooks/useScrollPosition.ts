import { useState, useEffect } from 'react'
import { throttle } from '@/utils'

export function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const update = throttle(() => {
      const y = window.scrollY
      setScrollY(y)
      setScrolled(y > 20)
    }, 100)
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return { scrollY, scrolled }
}

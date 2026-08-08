import { useEffect, useRef, useState, type RefObject } from 'react'

interface UseIntersectionOptions extends IntersectionObserverInit {
  once?: boolean
}

export function useIntersection<T extends Element>(
  options: UseIntersectionOptions = {}
): [RefObject<T | null>, boolean] {
  const { once = false, ...observerOptions } = options
  const ref  = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        if (once) observer.unobserve(el)
      } else if (!once) {
        setIsVisible(false)
      }
    }, { threshold: 0.1, ...observerOptions })
    observer.observe(el)
    return () => observer.disconnect()
  }, [once, observerOptions.threshold])

  return [ref, isVisible]
}

import { useEffect } from 'react'

type KeyHandler = (e: KeyboardEvent) => void

export function useKeyboard(
  key: string,
  handler: KeyHandler,
  options: { ctrl?: boolean; shift?: boolean; meta?: boolean; enabled?: boolean } = {}
) {
  const { ctrl = false, shift = false, meta = false, enabled = true } = options
  useEffect(() => {
    if (!enabled) return
    const listener = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key.toLowerCase()) return
      if (ctrl  && !e.ctrlKey)  return
      if (shift && !e.shiftKey) return
      if (meta  && !e.metaKey)  return
      e.preventDefault()
      handler(e)
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [key, handler, ctrl, shift, meta, enabled])
}

import { useState } from 'react'
import { storage } from '@/utils'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() =>
    storage.get<T>(key) ?? initialValue
  )
  const setValue = (value: T | ((prev: T) => T)) => {
    const next = value instanceof Function ? value(storedValue) : value
    setStoredValue(next)
    storage.set(key, next)
  }
  const removeValue = () => {
    setStoredValue(initialValue)
    storage.remove(key)
  }
  return [storedValue, setValue, removeValue] as const
}

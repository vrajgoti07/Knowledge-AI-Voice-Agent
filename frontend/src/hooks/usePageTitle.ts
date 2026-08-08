import { useEffect } from 'react'
import { APP_NAME } from '@/constants'

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${APP_NAME}` : APP_NAME
    return () => { document.title = APP_NAME }
  }, [title])
}

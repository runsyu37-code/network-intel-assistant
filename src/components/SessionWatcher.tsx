import { useEffect, useRef } from 'react'
import { App } from 'antd'
import { useAuthStore } from '../stores/authStore'

const WARN_BEFORE_MS = 5 * 60 * 1000

function decodeExp(token: string): number | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(json)
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

export function SessionWatcher() {
  const { notification } = App.useApp()
  const token = useAuthStore(s => s.token)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    notification.destroy('session-expiry')

    if (!token) return
    const exp = decodeExp(token)
    if (!exp) return

    const msUntilWarn = exp * 1000 - Date.now() - WARN_BEFORE_MS
    if (msUntilWarn <= 0) return

    timerRef.current = setTimeout(() => {
      notification.warning({
        key: 'session-expiry',
        message: 'Session กำลังจะหมดอายุ',
        description: 'Session จะหมดอายุใน 5 นาที กรุณาบันทึกงานและล็อกอินใหม่',
        duration: 0,
        placement: 'topRight',
      })
    }, msUntilWarn)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [token, notification])

  return null
}

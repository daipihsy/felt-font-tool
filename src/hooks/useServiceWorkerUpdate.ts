import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

/**
 * Registers the service worker and exposes whether a new version is waiting.
 * We use registerType:'prompt' so the app never force-refreshes mid-edit.
 */
export function useServiceWorkerUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const updateFn = useRef<((reload?: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    try {
      updateFn.current = registerSW({
        immediate: true,
        onNeedRefresh() {
          setNeedRefresh(true)
        },
        onOfflineReady() {
          setOfflineReady(true)
        },
        onRegisterError(err) {
          // Service worker registration can fail (e.g. private mode); the app
          // must keep working regardless.
          console.warn('Service worker registration failed', err)
        },
      })
    } catch (e) {
      console.warn('Service worker unsupported', e)
    }
  }, [])

  const updateNow = () => {
    void updateFn.current?.(true)
  }

  return { needRefresh, offlineReady, updateNow, dismissOfflineReady: () => setOfflineReady(false) }
}

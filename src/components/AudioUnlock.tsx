import { useEffect } from 'react'
import { unlockAudio } from '../audio/playerClickSound'

/**
 * Captures the first real user gesture anywhere in the app so Web Audio
 * can play later (idle easter egg, etc.).
 */
export function AudioUnlock() {
  useEffect(() => {
    const opts: AddEventListenerOptions = { capture: true, passive: true }
    const warm = () => {
      void unlockAudio()
    }
    const events = ['pointerdown', 'touchstart', 'keydown'] as const
    for (const ev of events) window.addEventListener(ev, warm, opts)
    return () => {
      for (const ev of events) window.removeEventListener(ev, warm, opts)
    }
  }, [])
  return null
}

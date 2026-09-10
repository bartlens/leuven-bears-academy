import { useEffect, useState } from 'react'
import {
  isSfxMuted,
  setSfxMuted,
  subscribeSfxMute,
} from '../audio/sfxMute'
import { unlockAudio } from '../audio/playerClickSound'

export function MuteButton({ className = '' }: { className?: string }) {
  const [muted, setMuted] = useState(isSfxMuted)

  useEffect(() => subscribeSfxMute(setMuted), [])

  return (
    <button
      type="button"
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-panel text-cream transition hover:border-hoop/40 hover:bg-hoop/10 touch-manipulation ${className}`}
      aria-label={muted ? 'Geluid aanzetten' : 'Geluid dempen'}
      aria-pressed={muted}
      title={muted ? 'SFX aan' : 'SFX uit'}
      onClick={() => {
        void unlockAudio()
        setSfxMuted(!muted)
      }}
    >
      <span className="text-base leading-none" aria-hidden>
        {muted ? '🔇' : '🔊'}
      </span>
    </button>
  )
}

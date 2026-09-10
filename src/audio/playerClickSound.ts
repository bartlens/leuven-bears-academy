/**
 * Minimal audio stubs for hero welcome cheer (unlock + hihi giggle).
 */
import { isSfxMuted } from './sfxMute'

let ctx: AudioContext | null = null
let lastPlayAt = 0
let audioUnlocked = false

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

export async function unlockAudio(): Promise<boolean> {
  const c = getCtx()
  if (!c) return false
  try {
    if (c.state === 'suspended') await c.resume()
    if (c.state === 'running') {
      const g = c.createGain()
      g.gain.value = 0.0001
      g.connect(c.destination)
      const o = c.createOscillator()
      o.connect(g)
      o.start()
      o.stop(c.currentTime + 0.01)
      audioUnlocked = true
      return true
    }
  } catch {
    /* ignore */
  }
  return audioUnlocked
}

function softGain(c: AudioContext): GainNode {
  const g = c.createGain()
  g.gain.value = 0
  g.connect(c.destination)
  return g
}

function envelope(
  g: GainNode,
  peak: number,
  attack: number,
  hold: number,
  release: number,
  start: number,
) {
  g.gain.cancelScheduledValues(start)
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(peak, start + attack)
  g.gain.setValueAtTime(peak, start + attack + hold)
  g.gain.exponentialRampToValueAtTime(0.0001, start + attack + hold + release)
}

function playHihiTone(c: AudioContext, t: number, seed: number) {
  const stops: OscillatorNode[] = []
  const base = 720 + (seed % 5) * 35
  const steps = [
    { f: base, at: 0 },
    { f: base * 1.18, at: 0.07 },
    { f: base * 1.32, at: 0.14 },
  ]
  steps.forEach(({ f, at }, i) => {
    const osc = c.createOscillator()
    const g = softGain(c)
    osc.type = 'triangle'
    const start = t + at
    osc.frequency.setValueAtTime(f, start)
    osc.frequency.linearRampToValueAtTime(f * 1.08, start + 0.045)
    envelope(g, 0.07 - i * 0.008, 0.006, 0.02, 0.055, start)
    osc.connect(g)
    osc.start(start)
    osc.stop(start + 0.11)
    stops.push(osc)
  })
  return () => {
    for (const o of stops) {
      try {
        o.stop()
      } catch {
        /* */
      }
    }
  }
}

/** Occasional short “hihi” giggle for the homepage title easter egg. */
export function playHihiGiggle(seed = 1): void {
  if (typeof document !== 'undefined' && document.hidden) return
  if (isSfxMuted()) return

  const now = performance.now()
  if (now - lastPlayAt < 60) return
  lastPlayAt = now

  const c = getCtx()
  if (!c) return

  void unlockAudio().then(() => {
    if (document.hidden || isSfxMuted()) return
    const audio = getCtx()
    if (!audio) return
    playHihiTone(audio, audio.currentTime + 0.02, seed)
  })
}

/** Soft tap feedback for PlayerCard (reuses hihi stub — full U10 SFX not ported). */
export function playPlayerClickSound(player: { id?: string; number?: number }): void {
  const seed = player.number ?? (player.id ? player.id.length : 1)
  playHihiGiggle(seed)
}

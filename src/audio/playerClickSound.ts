/**
 * Procedural per-player / staff click/tap sounds via Web Audio API.
 * Soft, short, cartoon/sports vibes — no audio assets shipped.
 */

import { isSfxMuted } from './sfxMute'

type SoundKind =
  | 'boing'
  | 'whistle'
  | 'rimClank'
  | 'bounce'
  | 'zap'
  | 'swoosh'
  | 'plink'
  | 'powerup'
  | 'sparkle'
  | 'thud'
  | 'squeak'
  | 'cheer'

const SOUNDS: SoundKind[] = [
  'boing',
  'whistle',
  'rimClank',
  'bounce',
  'zap',
  'swoosh',
  'plink',
  'powerup',
  'sparkle',
  'thud',
  'squeak',
  'cheer',
]

/** Brief labels for docs / commit messages (index = player.number - 1). */
export const PLAYER_SOUND_LABELS: Record<SoundKind, string> = {
  boing: 'springy cartoon boing',
  whistle: 'referee whistle peep',
  rimClank: 'metal rim clank',
  bounce: 'rubber ball bounce',
  zap: 'comic electric zap',
  swoosh: 'net swoosh',
  plink: 'bright arcade plink',
  powerup: 'chiptune power-up blip',
  sparkle: 'twinkly magic sparkle',
  thud: 'soft floor thud',
  squeak: 'sneaker squeak',
  cheer: 'tiny crowd cheer chirp',
}

let ctx: AudioContext | null = null
let lastPlayAt = 0
const DEBOUNCE_MS = 150
let activeStop: (() => void) | null = null
/** True after a user-gesture successfully resumed AudioContext */
let audioUnlocked = false
const unlockListeners = new Set<(ready: boolean) => void>()

export function isAudioUnlocked(): boolean {
  return audioUnlocked
}

export function subscribeAudioUnlock(fn: (ready: boolean) => void): () => void {
  unlockListeners.add(fn)
  return () => {
    unlockListeners.delete(fn)
  }
}

function markAudioUnlocked() {
  if (audioUnlocked) return
  audioUnlocked = true
  for (const fn of unlockListeners) fn(true)
}

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

/** Unlock / resume AudioContext on first user gesture (browser autoplay policy). */
export async function unlockAudio(): Promise<boolean> {
  const c = getCtx()
  if (!c) return false
  try {
    if (c.state === 'suspended') {
      await c.resume()
    }
    // Silent blip proves the graph is live (still within the gesture tick when called from one)
    if (c.state === 'running') {
      const g = c.createGain()
      g.gain.value = 0.0001
      g.connect(c.destination)
      const o = c.createOscillator()
      o.connect(g)
      o.start()
      o.stop(c.currentTime + 0.01)
      markAudioUnlocked()
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

function noiseBuffer(c: AudioContext, duration: number): AudioBuffer {
  const len = Math.max(1, Math.floor(c.sampleRate * duration))
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return buf
}

function playBoing(c: AudioContext, t: number, seed: number) {
  const osc = c.createOscillator()
  const g = softGain(c)
  osc.type = 'triangle'
  const base = 180 + (seed % 5) * 18
  osc.frequency.setValueAtTime(base + 220, t)
  osc.frequency.exponentialRampToValueAtTime(base, t + 0.18)
  envelope(g, 0.11, 0.008, 0.04, 0.16, t)
  osc.connect(g)
  osc.start(t)
  osc.stop(t + 0.28)
  return () => {
    try {
      osc.stop()
    } catch {
      /* */
    }
  }
}

function playWhistle(c: AudioContext, t: number, seed: number) {
  const osc = c.createOscillator()
  const g = softGain(c)
  osc.type = 'sine'
  const f = 1400 + (seed % 7) * 40
  osc.frequency.setValueAtTime(f, t)
  osc.frequency.linearRampToValueAtTime(f + 180, t + 0.06)
  osc.frequency.linearRampToValueAtTime(f - 60, t + 0.14)
  envelope(g, 0.07, 0.01, 0.05, 0.1, t)
  osc.connect(g)
  osc.start(t)
  osc.stop(t + 0.22)
  return () => {
    try {
      osc.stop()
    } catch {
      /* */
    }
  }
}

function playRimClank(c: AudioContext, t: number, seed: number) {
  const osc = c.createOscillator()
  const g = softGain(c)
  osc.type = 'square'
  osc.frequency.setValueAtTime(520 + (seed % 4) * 30, t)
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.08)
  envelope(g, 0.06, 0.002, 0.02, 0.12, t)
  // metallic overtone
  const osc2 = c.createOscillator()
  const g2 = softGain(c)
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(1100 + (seed % 3) * 50, t)
  envelope(g2, 0.04, 0.001, 0.01, 0.08, t)
  osc.connect(g)
  osc2.connect(g2)
  osc.start(t)
  osc2.start(t)
  osc.stop(t + 0.2)
  osc2.stop(t + 0.15)
  return () => {
    try {
      osc.stop()
      osc2.stop()
    } catch {
      /* */
    }
  }
}

function playBounce(c: AudioContext, t: number, seed: number) {
  const osc = c.createOscillator()
  const g = softGain(c)
  osc.type = 'sine'
  const base = 90 + (seed % 5) * 8
  osc.frequency.setValueAtTime(base * 2.2, t)
  osc.frequency.exponentialRampToValueAtTime(base, t + 0.09)
  envelope(g, 0.13, 0.004, 0.02, 0.1, t)
  // noise thump
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, 0.06)
  const ng = softGain(c)
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 400
  envelope(ng, 0.08, 0.001, 0.01, 0.05, t)
  src.connect(filter)
  filter.connect(ng)
  osc.connect(g)
  osc.start(t)
  src.start(t)
  osc.stop(t + 0.18)
  src.stop(t + 0.08)
  return () => {
    try {
      osc.stop()
      src.stop()
    } catch {
      /* */
    }
  }
}

function playZap(c: AudioContext, t: number, seed: number) {
  const osc = c.createOscillator()
  const g = softGain(c)
  osc.type = 'sawtooth'
  const f0 = 700 + (seed % 6) * 55
  osc.frequency.setValueAtTime(f0, t)
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.12)
  envelope(g, 0.06, 0.002, 0.02, 0.1, t)
  osc.connect(g)
  osc.start(t)
  osc.stop(t + 0.18)
  return () => {
    try {
      osc.stop()
    } catch {
      /* */
    }
  }
}

function playSwoosh(c: AudioContext, t: number, seed: number) {
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, 0.22)
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 2.5
  const f = 900 + (seed % 5) * 80
  filter.frequency.setValueAtTime(f * 0.5, t)
  filter.frequency.exponentialRampToValueAtTime(f * 2.2, t + 0.14)
  const g = softGain(c)
  envelope(g, 0.1, 0.02, 0.04, 0.12, t)
  src.connect(filter)
  filter.connect(g)
  src.start(t)
  src.stop(t + 0.24)
  return () => {
    try {
      src.stop()
    } catch {
      /* */
    }
  }
}

function playPlink(c: AudioContext, t: number, seed: number) {
  const osc = c.createOscillator()
  const g = softGain(c)
  osc.type = 'sine'
  const f = 880 + (seed % 8) * 55
  osc.frequency.setValueAtTime(f, t)
  osc.frequency.exponentialRampToValueAtTime(f * 0.85, t + 0.15)
  envelope(g, 0.1, 0.005, 0.03, 0.14, t)
  osc.connect(g)
  osc.start(t)
  osc.stop(t + 0.22)
  return () => {
    try {
      osc.stop()
    } catch {
      /* */
    }
  }
}

function playPowerup(c: AudioContext, t: number, seed: number) {
  const notes = [523.25, 659.25, 783.99, 1046.5]
  const stops: OscillatorNode[] = []
  notes.forEach((freq, i) => {
    const osc = c.createOscillator()
    const g = softGain(c)
    osc.type = 'square'
    const f = freq * (1 + ((seed % 3) - 1) * 0.02)
    osc.frequency.value = f
    const start = t + i * 0.045
    envelope(g, 0.05, 0.005, 0.02, 0.06, start)
    osc.connect(g)
    osc.start(start)
    osc.stop(start + 0.12)
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

function playSparkle(c: AudioContext, t: number, seed: number) {
  const stops: OscillatorNode[] = []
  for (let i = 0; i < 3; i++) {
    const osc = c.createOscillator()
    const g = softGain(c)
    osc.type = 'sine'
    const f = 1600 + i * 320 + (seed % 5) * 40
    osc.frequency.value = f
    const start = t + i * 0.035
    envelope(g, 0.045, 0.004, 0.015, 0.08, start)
    osc.connect(g)
    osc.start(start)
    osc.stop(start + 0.12)
    stops.push(osc)
  }
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

function playThud(
  c: AudioContext,
  t: number,
  seed: number,
  /** 1 = full Bas N click, lower = shorter/quieter bounce tick */
  strength = 1,
) {
  const s = Math.max(0.12, Math.min(1, strength))
  const osc = c.createOscillator()
  const g = softGain(c)
  osc.type = 'triangle'
  const f = 70 + (seed % 4) * 6
  const rise = 0.06 + s * 0.04
  const dur = 0.07 + s * 0.13
  osc.frequency.setValueAtTime(f * (1.35 + s * 0.25), t)
  osc.frequency.exponentialRampToValueAtTime(f, t + rise)
  envelope(g, 0.06 + s * 0.12, 0.004, 0.02 * s, dur * 0.65, t)
  osc.connect(g)
  osc.start(t)
  osc.stop(t + dur + 0.02)
  return () => {
    try {
      osc.stop()
    } catch {
      /* */
    }
  }
}

function playSqueak(c: AudioContext, t: number, seed: number) {
  const osc = c.createOscillator()
  const g = softGain(c)
  osc.type = 'sine'
  const f = 1100 + (seed % 6) * 70
  osc.frequency.setValueAtTime(f, t)
  osc.frequency.linearRampToValueAtTime(f * 1.35, t + 0.05)
  osc.frequency.linearRampToValueAtTime(f * 0.9, t + 0.1)
  envelope(g, 0.07, 0.005, 0.02, 0.08, t)
  osc.connect(g)
  osc.start(t)
  osc.stop(t + 0.16)
  return () => {
    try {
      osc.stop()
    } catch {
      /* */
    }
  }
}

function playCheer(c: AudioContext, t: number, seed: number) {
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, 0.28)
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 1400 + (seed % 5) * 100
  filter.Q.value = 1.2
  const g = softGain(c)
  envelope(g, 0.08, 0.01, 0.08, 0.14, t)
  // two happy chirps on top
  const osc = c.createOscillator()
  const og = softGain(c)
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(660 + (seed % 4) * 40, t)
  osc.frequency.setValueAtTime(880 + (seed % 4) * 40, t + 0.08)
  envelope(og, 0.05, 0.005, 0.04, 0.1, t)
  src.connect(filter)
  filter.connect(g)
  osc.connect(og)
  src.start(t)
  osc.start(t)
  src.stop(t + 0.3)
  osc.stop(t + 0.22)
  return () => {
    try {
      src.stop()
      osc.stop()
    } catch {
      /* */
    }
  }
}

const PLAYERS: Record<SoundKind, (c: AudioContext, t: number, seed: number) => () => void> = {
  boing: playBoing,
  whistle: playWhistle,
  rimClank: playRimClank,
  bounce: playBounce,
  zap: playZap,
  swoosh: playSwoosh,
  plink: playPlink,
  powerup: playPowerup,
  sparkle: playSparkle,
  thud: playThud,
  squeak: playSqueak,
  cheer: playCheer,
}

function kindForPlayer(playerNumber: number): SoundKind {
  const idx = ((playerNumber - 1) % SOUNDS.length + SOUNDS.length) % SOUNDS.length
  return SOUNDS[idx]!
}

/**
 * Play the unique click sound for a player (by jersey number or id suffix).
 * Debounced; skips when document is hidden; unlocks AudioContext on gesture.
 */
export function playPlayerClickSound(player: {
  id?: string
  number: number
}): void {
  if (typeof document !== 'undefined' && document.hidden) return
  if (isSfxMuted()) return

  const now = performance.now()
  if (now - lastPlayAt < DEBOUNCE_MS) return
  lastPlayAt = now

  if (activeStop) {
    activeStop()
    activeStop = null
  }

  const c = getCtx()
  if (!c) return

  void unlockAudio().then(() => {
    if (document.hidden || isSfxMuted()) return
    const audio = getCtx()
    if (!audio) return
    if (audio.state === 'running') markAudioUnlocked()
    const kind = kindForPlayer(player.number)
    const seed =
      player.number * 17 +
      (player.id ? player.id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0) : 0)
    const t = audio.currentTime + 0.01
    activeStop = PLAYERS[kind](audio, t, seed)
  })
}


/* ── Staff click sounds ─────────────────────────────────────────── */

function playLaughBlip(c: AudioContext, t: number, seed: number) {
  const stops: OscillatorNode[] = []
  // Short ha-ha-ish rising blips
  const freqs = [280 + (seed % 4) * 12, 360, 420 + (seed % 3) * 15]
  freqs.forEach((freq, i) => {
    const osc = c.createOscillator()
    const g = softGain(c)
    osc.type = 'triangle'
    const start = t + i * 0.055
    osc.frequency.setValueAtTime(freq, start)
    osc.frequency.linearRampToValueAtTime(freq * 1.25, start + 0.04)
    envelope(g, 0.09, 0.008, 0.025, 0.07, start)
    osc.connect(g)
    osc.start(start)
    osc.stop(start + 0.14)
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

function playSoftCheer(c: AudioContext, t: number, seed: number) {
  /** Els: warm little “woo-hoo / go bears” cheer — clap + crowd-ish + yay peeps */
  const stops: Array<OscillatorNode | AudioBufferSourceNode> = []

  // Soft handclap (noise burst)
  const clap = c.createBufferSource()
  clap.buffer = noiseBuffer(c, 0.08)
  const clapHp = c.createBiquadFilter()
  clapHp.type = 'highpass'
  clapHp.frequency.value = 1800
  const clapG = softGain(c)
  envelope(clapG, 0.11, 0.002, 0.012, 0.055, t)
  clap.connect(clapHp)
  clapHp.connect(clapG)
  clap.start(t)
  clap.stop(t + 0.09)
  stops.push(clap)

  // Tiny crowd bed
  const crowd = c.createBufferSource()
  crowd.buffer = noiseBuffer(c, 0.45)
  const band = c.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 900 + (seed % 5) * 60
  band.Q.value = 0.85
  const crowdG = softGain(c)
  envelope(crowdG, 0.07, 0.04, 0.18, 0.22, t + 0.02)
  crowd.connect(band)
  band.connect(crowdG)
  crowd.start(t + 0.02)
  crowd.stop(t + 0.48)
  stops.push(crowd)

  // “Woo!” rising voice-ish (two harmonics)
  const wooBase = 420 + (seed % 4) * 18
  ;[1, 1.5, 2.01].forEach((mult, i) => {
    const osc = c.createOscillator()
    const g = softGain(c)
    osc.type = i === 0 ? 'sawtooth' : 'triangle'
    const start = t + 0.05
    osc.frequency.setValueAtTime(wooBase * mult, start)
    osc.frequency.linearRampToValueAtTime(wooBase * mult * 1.55, start + 0.16)
    osc.frequency.linearRampToValueAtTime(wooBase * mult * 1.2, start + 0.28)
    envelope(g, i === 0 ? 0.045 : 0.028, 0.02, 0.12, 0.16, start)
    // tame sawtooth harshness
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 2200
    osc.connect(lp)
    lp.connect(g)
    osc.start(start)
    osc.stop(start + 0.36)
    stops.push(osc)
  })

  // Second “hoo / yay” peep
  const yay = c.createOscillator()
  const yg = softGain(c)
  yay.type = 'sine'
  const yt = t + 0.22
  yay.frequency.setValueAtTime(780 + (seed % 3) * 40, yt)
  yay.frequency.linearRampToValueAtTime(1100 + (seed % 3) * 40, yt + 0.1)
  envelope(yg, 0.055, 0.01, 0.06, 0.1, yt)
  yay.connect(yg)
  yay.start(yt)
  yay.stop(yt + 0.22)
  stops.push(yay)

  // Little sparkle on top (bear energy)
  const spark = c.createOscillator()
  const sg = softGain(c)
  spark.type = 'sine'
  spark.frequency.setValueAtTime(1600, t + 0.28)
  spark.frequency.exponentialRampToValueAtTime(2400, t + 0.4)
  envelope(sg, 0.035, 0.008, 0.05, 0.1, t + 0.28)
  spark.connect(sg)
  spark.start(t + 0.28)
  spark.stop(t + 0.45)
  stops.push(spark)

  return () => {
    for (const n of stops) {
      try {
        n.stop()
      } catch {
        /* */
      }
    }
  }
}

type StaffSoundId = 'jonathan' | 'rafa' | 'els'

const STAFF_PLAYERS: Record<
  StaffSoundId,
  (c: AudioContext, t: number, seed: number) => () => void
> = {
  jonathan: playWhistle,
  rafa: playLaughBlip,
  els: playSoftCheer,
}

function staffSoundId(staff: { id: string; move?: string }): StaffSoundId {
  const id = staff.id.toLowerCase()
  if (id.includes('jonathan')) return 'jonathan'
  if (id.includes('rafa')) return 'rafa'
  if (id.includes('els')) return 'els'
  // Fallback by move
  if (staff.move === 'whistle-clap') return 'jonathan'
  if (staff.move === 'laugh') return 'rafa'
  return 'els'
}

/**
 * Play staff click sound (Jonathan whistle, Rafa laugh blip, Els soft cheer).
 * Same mute / debounce / unlock rules as players.
 */
export function playStaffClickSound(staff: {
  id: string
  move?: string
}): void {
  if (typeof document !== 'undefined' && document.hidden) return
  if (isSfxMuted()) return

  const now = performance.now()
  if (now - lastPlayAt < DEBOUNCE_MS) return
  lastPlayAt = now

  if (activeStop) {
    activeStop()
    activeStop = null
  }

  const c = getCtx()
  if (!c) return

  void unlockAudio().then(() => {
    if (document.hidden || isSfxMuted()) return
    const audio = getCtx()
    if (!audio) return
    const kind = staffSoundId(staff)
    const seed = staff.id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0)
    const t = audio.currentTime + 0.01
    activeStop = STAFF_PLAYERS[kind](audio, t, seed)
  })
}

/* ── Hero peek “hihi” giggle ────────────────────────────────────── */

function playHihiTone(c: AudioContext, t: number, seed: number) {
  /** Short cartoon kid “hi-hi!” — two/three rising peeps */
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

/**
 * Occasional short “hihi” giggle for the homepage title easter egg.
 * Respects mute, document visibility, and AudioContext unlock.
 * Soft-debounced separately so it can follow a peek without always winning.
 */
export function playHihiGiggle(seed = 1): void {
  if (typeof document !== 'undefined' && document.hidden) return
  if (isSfxMuted()) return

  const now = performance.now()
  // Soft anti-spam only (allow soon after other SFX)
  if (now - lastPlayAt < 60) return
  lastPlayAt = now

  const c = getCtx()
  if (!c) return

  void unlockAudio().then(() => {
    if (document.hidden || isSfxMuted()) return
    const audio = getCtx()
    if (!audio) return
    const t = audio.currentTime + 0.02
    const stop = playHihiTone(audio, t, seed)
    // Don't clobber a concurrent player click hard — schedule cleanup only
    const prev = activeStop
    activeStop = () => {
      stop()
      if (prev) prev()
    }
    window.setTimeout(() => {
      if (activeStop) {
        activeStop()
        activeStop = null
      }
    }, 400)
  })
}

/* ── Idle easter-egg: bounce + funny scoop ───────────────────────── */

function playFootstepTone(c: AudioContext, t: number, seed: number) {
  /** Soft sneaker / shoe scuff — filtered noise, no beep */
  const n = c.createBufferSource()
  const ng = softGain(c)
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 320 + (seed % 4) * 55
  bp.Q.value = 0.85
  n.buffer = noiseBuffer(c, 0.07)
  envelope(ng, 0.18, 0.001, 0.012, 0.045, t)
  n.connect(bp)
  bp.connect(ng)
  n.start(t)
  n.stop(t + 0.07)

  // Tiny low thud under the scuff
  const osc = c.createOscillator()
  const g = softGain(c)
  osc.type = 'sine'
  const f = 95 + (seed % 3) * 12
  osc.frequency.setValueAtTime(f, t)
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.05)
  envelope(g, 0.1, 0.002, 0.01, 0.04, t)
  osc.connect(g)
  osc.start(t)
  osc.stop(t + 0.07)

  return () => {
    try {
      n.stop()
      osc.stop()
    } catch {
      /* */
    }
  }
}

function playScoopTone(c: AudioContext, t: number, seed: number) {
  /** Cartoon “boing-scoop” — silly pickup */
  const stops: OscillatorNode[] = []
  const base = 280 + (seed % 6) * 18
  ;[
    { f: base, at: 0, dur: 0.1 },
    { f: base * 1.7, at: 0.06, dur: 0.12 },
    { f: base * 2.3, at: 0.14, dur: 0.1 },
  ].forEach(({ f, at, dur }, i) => {
    const osc = c.createOscillator()
    const g = softGain(c)
    osc.type = i === 0 ? 'square' : 'triangle'
    const start = t + at
    osc.frequency.setValueAtTime(f, start)
    osc.frequency.linearRampToValueAtTime(f * 1.25, start + dur * 0.5)
    envelope(g, 0.28 - i * 0.04, 0.005, 0.03, dur * 0.75, start)
    osc.connect(g)
    osc.start(start)
    osc.stop(start + dur + 0.02)
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

async function withRunningAudio(
  play: (c: AudioContext) => void,
): Promise<void> {
  if (typeof document !== 'undefined' && document.hidden) return
  if (isSfxMuted()) return
  const c = getCtx()
  if (!c) return
  try {
    await unlockAudio()
  } catch {
    /* */
  }
  if (document.hidden || isSfxMuted()) return
  const audio = getCtx()
  if (!audio) return
  if (audio.state === 'suspended') {
    try {
      await audio.resume()
    } catch {
      /* still try to play — some browsers allow it after prior unlock */
    }
  }
  play(audio)
}

export function playIdleBallBounce(seed = 1, strength = 1): void {
  void withRunningAudio((audio) => {
    // Bas N’s click voice (jersey 10 → thud)
    playThud(audio, audio.currentTime + 0.01, 10 * 17 + seed, strength)
  })
}

export function playIdleFootstep(seed = 1): void {
  void withRunningAudio((audio) => {
    playFootstepTone(audio, audio.currentTime + 0.005, seed)
  })
}

export function playIdleBallScoop(seed = 1): void {
  void withRunningAudio((audio) => {
    playScoopTone(audio, audio.currentTime + 0.01, seed)
  })
}


/** Staggered kid giggles for roster laugh-along (mute-aware). */
export function playRosterGiggleBurst(): void {
  if (typeof document !== 'undefined' && document.hidden) return
  if (isSfxMuted()) return
  const seeds = [3, 11, 19, 7, 23, 13]
  seeds.forEach((seed, i) => {
    window.setTimeout(() => playHihiGiggle(seed + i * 5), 120 + i * 280)
  })
}

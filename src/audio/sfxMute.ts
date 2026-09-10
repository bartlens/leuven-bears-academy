const STORAGE_KEY = 'lba-sfx-muted'

type Listener = (muted: boolean) => void
const listeners = new Set<Listener>()

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

let muted = typeof window !== 'undefined' ? readStored() : false

export function isSfxMuted(): boolean {
  return muted
}

export function setSfxMuted(next: boolean): void {
  muted = next
  try {
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
  } catch {
    /* private mode */
  }
  for (const fn of listeners) fn(muted)
}

export function toggleSfxMuted(): boolean {
  setSfxMuted(!muted)
  return muted
}

export function subscribeSfxMute(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

'use client'

// Pattern: mmo fx kit / synthesized sounds (adapted to Check-in). Web Audio only: no files.
// Off until the person turns it on in You → Settings; the choice is saved in this browser.
import { useCallback, useSyncExternalStore } from 'react'

const KEY = 'checkin.sound'
let ctx: AudioContext | null = null
let on: boolean | null = null // read lazily, so the server never touches localStorage
const listeners = new Set<() => void>()

function read(): boolean {
  if (on === null) {
    try {
      on = localStorage.getItem(KEY) === '1'
    } catch {
      on = false // blocked storage: sound stays off
    }
  }
  return on
}

const audio = () => ctx ?? (ctx = new AudioContext())

/** One shaped note: frequency, start offset, duration, waveform, volume. */
function tone(f: number, t0: number, d: number, type: OscillatorType = 'triangle', v = 0.07) {
  const a = audio()
  const o = a.createOscillator()
  const g = a.createGain()
  const t = a.currentTime + t0
  o.type = type
  o.frequency.setValueAtTime(f, t)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(v, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + d)
  o.connect(g).connect(a.destination)
  o.start(t)
  o.stop(t + d + 0.02)
}

/** A rising tone while a hold-to-confirm button fills. */
function charge(secs: number) {
  const a = audio()
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(200, a.currentTime)
  o.frequency.exponentialRampToValueAtTime(700, a.currentTime + secs)
  g.gain.setValueAtTime(0.025, a.currentTime)
  g.gain.linearRampToValueAtTime(0, a.currentTime + secs + 0.05)
  o.connect(g).connect(a.destination)
  o.start()
  o.stop(a.currentTime + secs + 0.1)
}

/** The set Check-in uses. Where each plays is in CLAUDE.md ("Sound"). */
const SOUNDS = {
  /** Picking a reaction, copying a code. */
  tap: () => tone(1600, 0, 0.03, 'sine', 0.02),
  /** A check-in went through. */
  success: () => {
    tone(784, 0, 0.12)
    tone(1175, 0.1, 0.25)
  },
  /** A hold-to-confirm completed. */
  confirm: () => {
    tone(523, 0, 0.1)
    tone(659, 0.06, 0.1)
    tone(784, 0.12, 0.16)
  },
  /** While a hold button fills. */
  charge: () => charge(1.1),
  /** A milestone revealed. */
  levelUp: () => [392, 523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.3)),
} as const

export type SoundName = keyof typeof SOUNDS

/** Play a sound if sound is on. Never throws: audio can fail before a user gesture. */
export function sfx(name: SoundName) {
  if (!read()) return
  try {
    SOUNDS[name]()
  } catch {
    // The visual is the feedback that matters.
  }
}

export function setSound(next: boolean) {
  on = next
  try {
    localStorage.setItem(KEY, next ? '1' : '0')
  } catch {
    // Not remembered; still works this visit.
  }
  listeners.forEach((l) => l())
  if (next) sfx('success') // a sample, so turning it on confirms itself
}

/** `const { soundOn, setSoundOn } = useSound()`: the Settings switch. */
export function useSound() {
  const soundOn = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    read,
    () => false,
  )
  const setSoundOn = useCallback((next: boolean) => setSound(next), [])
  return { soundOn, setSoundOn }
}

'use client'

import type { Hue } from '@/lib/colors'
import { tierOf, type TierKey } from '@/lib/mastery'

// Share a tier card as a story-sized image (1080×1350), drawn on a canvas in the browser: no library,
// no server. The look follows TierCard: the material by tier, the medal, the crew's color, plus the
// person's name, the rarity line and the Check-in wordmark.

export interface ShareCardInput {
  tier: TierKey
  crewName: string
  color: Hue
  sessions: number
  personName: string
  rarity?: number
  serial?: number | null
}

const W = 1080
const H = 1350

function cssVar(name: string, fallback: string) {
  const v = getComputedStyle(document.body).getPropertyValue(name).trim()
  return v || fallback
}

/** A color the canvas understands, mixed toward white or black like color-mix does in CSS. */
function mix(color: string, toward: 'white' | 'black', amount: number) {
  const c = document.createElement('canvas').getContext('2d')!
  c.fillStyle = color
  const hex = c.fillStyle as string // normalised to #rrggbb
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  const t = toward === 'white' ? 255 : 0
  const m = (x: number) => Math.round(x + (t - x) * amount)
  return `rgb(${m(r)} ${m(g)} ${m(b)})`
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

export async function drawShareCard(input: ShareCardInput): Promise<Blob> {
  const t = tierOf(input.tier)
  const hue = cssVar(`--${input.color}`, '#5bbcf0')
  const ink = cssVar('--on-color', '#1c1b19')
  const display = cssVar('--font-display', 'system-ui') || 'system-ui'
  const sans = cssVar('--font-sans', 'system-ui') || 'system-ui'
  const wordmark = cssVar('--font-wordmark', display)
  await document.fonts?.ready

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Background: deep night in the crew's hue, a soft glow behind the card.
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, mix(hue, 'black', 0.72))
  bg.addColorStop(1, mix(hue, 'black', 0.88))
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W / 2, 560, 40, W / 2, 560, 620)
  glow.addColorStop(0, mix(hue, 'white', 0.1).replace('rgb(', 'rgba(').replace(')', ' / 0.55)'))
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // The card.
  const cx = 110, cy = 300, cw = W - 220, ch = 520, r = 56
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,.45)'
  ctx.shadowBlur = 80
  ctx.shadowOffsetY = 30
  roundRect(ctx, cx, cy, cw, ch, r)
  if (t.material === 'paper') {
    ctx.fillStyle = mix(hue, 'white', 0.86)
  } else {
    const g = ctx.createLinearGradient(cx, cy, cx + cw * 0.6, cy + ch)
    g.addColorStop(0, mix(hue, 'white', 0.25))
    g.addColorStop(0.5, hue)
    g.addColorStop(1, mix(hue, 'black', 0.26))
    ctx.fillStyle = g
  }
  ctx.fill()
  ctx.restore()

  // Holo film for Seasoned and up.
  if (t.material === 'holo' || t.material === 'aurora' || t.material === 'master') {
    ctx.save()
    roundRect(ctx, cx, cy, cw, ch, r)
    ctx.clip()
    const film = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch)
    ;[['--rose', 0.25], ['--sky', 0.45], ['--lemon', 0.6], ['--grape', 0.78]].forEach(([v, at]) =>
      film.addColorStop(at as number, mix(cssVar(v as string, '#fff'), 'white', 0.4).replace('rgb(', 'rgba(').replace(')', ' / 0.55)')),
    )
    film.addColorStop(0, 'rgba(255,255,255,0)')
    film.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.globalCompositeOperation = 'soft-light'
    ctx.fillStyle = film
    ctx.fillRect(cx, cy, cw, ch)
    ctx.restore()
  }
  // Aurora edge for Expert and Master.
  if (t.material === 'aurora' || t.material === 'master') {
    const edge = ctx.createConicGradient(0, W / 2, cy + ch / 2)
    ;['--sky', '--leaf', '--grape', '--rose', '--sky'].forEach((v, i) => edge.addColorStop(i / 4, cssVar(v, '#fff')))
    ctx.lineWidth = 10
    ctx.strokeStyle = edge
    roundRect(ctx, cx + 5, cy + 5, cw - 10, ch - 10, r - 5)
    ctx.stroke()
  }
  // A light top edge.
  ctx.lineWidth = 3
  ctx.strokeStyle = t.material === 'paper' ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.35)'
  roundRect(ctx, cx + 1.5, cy + 1.5, cw - 3, ch - 3, r)
  ctx.stroke()

  // The medal.
  const mx = cx + 170, my = cy + ch / 2, mr = 110
  ctx.beginPath()
  ctx.arc(mx, my, mr, 0, Math.PI * 2)
  if (t.material === 'paper') {
    ctx.setLineDash([22, 14])
    ctx.lineWidth = 8
    ctx.strokeStyle = ink
    ctx.stroke()
    ctx.setLineDash([])
  } else {
    const disc = ctx.createRadialGradient(mx - 30, my - 40, 10, mx, my, mr)
    disc.addColorStop(0, mix(ink, 'white', 0.3))
    disc.addColorStop(1, ink)
    ctx.fillStyle = disc
    ctx.fill()
    ctx.lineWidth = 10
    ctx.strokeStyle = 'rgba(255,255,255,.28)'
    ctx.stroke()
  }
  ctx.fillStyle = t.material === 'paper' ? ink : mix(hue, 'white', 0.25)
  ctx.font = `800 ${t.at >= 1000 ? 72 : t.at >= 100 ? 76 : 92}px ${display}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(t.at >= 1000 ? '1K' : String(t.at), mx, my + 4)

  // Words on the card.
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = ink
  const tx = mx + mr + 56
  ctx.globalAlpha = 0.75
  ctx.font = `600 40px ${sans}`
  ctx.fillText(input.crewName, tx, my - 80, cx + cw - tx - 40)
  ctx.globalAlpha = 1
  ctx.font = `800 104px ${display}`
  ctx.fillText(t.name, tx, my + 30, cx + cw - tx - 40)
  ctx.font = `700 42px ${sans}`
  const count = `${input.sessions.toLocaleString()} sessions${input.serial ? `, No. ${String(input.serial).padStart(4, '0')}` : ''}`
  ctx.fillText(count, tx, my + 100, cx + cw - tx - 40)

  // Under the card: who, how rare, the brand.
  ctx.textAlign = 'center'
  ctx.fillStyle = 'white'
  ctx.font = `800 76px ${display}`
  ctx.fillText(input.personName, W / 2, 980)
  ctx.globalAlpha = 0.8
  ctx.font = `500 40px ${sans}`
  ctx.fillText(
    input.rarity !== undefined && input.rarity <= 40 ? `reached ${t.name} in ${input.crewName}. Only ${input.rarity < 1 ? 'under 1' : input.rarity}% of members get here.` : `reached ${t.name} in ${input.crewName}.`,
    W / 2,
    1050,
    W - 160,
  )
  ctx.globalAlpha = 1
  ctx.font = `900 64px ${wordmark}`
  ctx.fillText('check-in', W / 2, 1230)
  ctx.globalAlpha = 0.6
  ctx.font = `500 32px ${sans}`
  ctx.fillText('stay consistent with people.', W / 2, 1282)
  ctx.globalAlpha = 1

  return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Couldn’t draw the card.'))), 'image/png'))
}

/** The system share sheet with the image where it's available; otherwise a download. */
export async function shareCard(input: ShareCardInput): Promise<'shared' | 'downloaded'> {
  const blob = await drawShareCard(input)
  const name = `check-in-${tierOf(input.tier).key}-${input.crewName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
  const file = new File([blob], name, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `${tierOf(input.tier).name} in ${input.crewName}` })
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'shared' // they closed the sheet
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
  return 'downloaded'
}

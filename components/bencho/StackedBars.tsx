'use client'
/* eslint-disable react-hooks/set-state-in-effect -- vendored from Bencho: refs that carry per-frame values and the photo <img>s are deliberate, see the comments */

// Pattern: Bencho / Stacked bars (adapted to Check-in tokens). MIT, bencho.dev/licence

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "motion/react";

/* ══ Stacked bars ═════════════════════════════════════════
   Check-in: your check-ins for every day (or week), stacked by
   crew in each crew's colour. Bencho's alert-volume card, with
   its escalated row under the baseline taken out: a habit app
   has nothing that means.

   ── RUN ALONG IT ────────────────────────────────────────
   The column under the pointer gets a ring round its whole stack,
   the rest step back (their colour mixed toward the slab, never
   faded), and one tooltip glides beside it on a spring with the
   date, the total and what made it up.

   ── DAY / WEEK ──────────────────────────────────────────
   Swaps the dataset; every segment eases to its new height and
   offset a beat after its left neighbour. The same transition
   grows the bars out of the baseline the first time the card is
   seen. */

const W = 300;
const PAD = 16;
const CW = W - PAD * 2; // the plot's width, until it is measured
const CH = 104; // room above the baseline
const SEG_GAP = 2;
const LIFT = 2; // air between the baseline and the bars
const TIP_W = 132;
const SPRING = { type: "spring" as const, stiffness: 380, damping: 34 };

type Mode = "Day" | "Week";
/** One column: a count per series, in the order of `series`, and its date. */
export type StackedBar = { vals: number[]; label: string; short: string };
export type StackedSeries = { name: string; color: string };

const fmt = (v: number) => Math.round(v).toLocaleString("en-US");
const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);

export function StackedBars({
  title,
  unit,
  series,
  days,
  weeks,
  gap = 6,
}: {
  title: string;
  /** after the big number, e.g. "check-ins" */
  unit: string;
  series: StackedSeries[];
  days: StackedBar[];
  weeks: StackedBar[];
  gap?: number;
}) {
  const [mode, setMode] = useState<Mode>("Day");
  const data = mode === "Day" ? days : weeks;
  const n = Math.max(2, data.length);
  const [at, setAt] = useState<number | null>(null);
  const [seen, setSeen] = useState(false);
  const root = useRef<HTMLDivElement | null>(null);
  const plot = useRef<HTMLDivElement | null>(null);
  /* Check-in: the plot is as wide as its column, so it is measured
     rather than fixed at Bencho's 268 */
  const [cw, setCw] = useState(CW);
  useEffect(() => {
    const el = plot.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setCw(Math.max(120, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* grow in once, the first time the card is on screen */
  useEffect(() => {
    const el = root.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  /* geometry: the gap gives way before a bar gets thinner than 3px,
     so 30 bars at the widest gap still draw */
  const g = Math.max(1, Math.min(gap, (cw - 3 * n) / (n - 1)));
  const bw = (cw - g * (n - 1)) / n;
  const r = Math.min(2.5, bw / 2);
  const totals = data.map((b) => sum(b.vals));
  /* at least 1, so an empty stretch draws a flat baseline rather than dividing by zero */
  const maxT = Math.max(1, ...totals);
  const scale = (CH - LIFT - 2 - SEG_GAP * (series.length - 1)) / maxT;
  const layout = useMemo(() => data.map((b) => {
    let y = 0;
    const segs = b.vals.map((v) => {
      /* Check-in: a crew with nothing that day draws nothing, not a 2px sliver */
      const h = v > 0 ? Math.max(2, v * scale) : 0;
      const s = { bottom: y, h };
      if (h) y += h + SEG_GAP;
      return s;
    });
    return { segs, top: Math.max(0, y - SEG_GAP) };
  }), [data, scale]);

  /* the headline pops in on a change, Price flow's way: every
     character is keyed by a generation, so a new total is new
     elements and each plays one short entrance, left to right.
     The first paint does not play it; only a change does. */
  const total = sum(totals);
  const [gen, setGen] = useState(0);
  const last = useRef(total);
  useEffect(() => {
    if (last.current === total) return;
    last.current = total;
    setGen((v) => v + 1);
  }, [total]);

  /* ring and tooltip: placed at once when they appear, glide after */
  const ringX = useMotionValue(0);
  const ringY = useMotionValue(0);
  const ringH = useMotionValue(0);
  const tipX = useMotionValue(0);
  const was = useRef<number | null>(null);
  useEffect(() => {
    if (at === null || at >= n) { was.current = null; return; }
    const L = layout[at];
    const left = at * (bw + g);
    const x = left - 3;
    const up = seen ? L.top : 0;
    const y = CH - LIFT - up - 3;
    const h = up + LIFT + 6;
    /* beside the column: right while it fits there, else left */
    const right = left + bw + 8;
    const tx = right + TIP_W <= cw || left - 8 - TIP_W < 0
      ? Math.min(cw - TIP_W, right)
      : left - 8 - TIP_W;
    const go = (mv: typeof ringX, v: number) => {
      if (was.current === null) mv.set(v);
      else animate(mv, v, SPRING);
    };
    go(ringX, x); go(ringY, y); go(ringH, h); go(tipX, tx);
    was.current = at;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, n, bw, g, mode, seen, cw]);

  const pick = (e: React.PointerEvent) => {
    const b = plot.current?.getBoundingClientRect();
    if (!b || b.width === 0) return;
    const i = Math.floor(((e.clientX - b.left) / b.width) * n);
    setAt(Math.max(0, Math.min(n - 1, i)));
  };

  const cur = at !== null && at < n ? data[at] : null;
  /* Check-in: the crews that day, biggest first, and only the ones that showed up */
  const parts = cur
    ? cur.vals.map((v, k) => ({ v, k })).filter((p) => p.v > 0).sort((a, b) => b.v - a.v).slice(0, 3)
    : [];

  return (
    <div
      ref={root}
      className="stb"
      data-scrub={cur ? "" : undefined}
      style={{
        ["--stb-r" as string]: `${r}px`,
        ["--stb-rr" as string]: `${r + 3}px`,
        ...Object.fromEntries(series.map((s, k) => [`--stb-c${k + 1}`, s.color])),
      } as CSSProperties}
    >
      <div className="stb-head">
        <div className="stb-titles">
          <div className="stb-title">{title}</div>
          <div className="stb-sub">Last {data.length} {mode === "Day" ? "days" : "weeks"}</div>
        </div>
        <div className="stb-seg-ctl" data-mode={mode} role="tablist" aria-label="Group by">
          <span className="stb-thumb" aria-hidden />
          {(["Day", "Week"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              data-on={mode === m || undefined}
              className="stb-tab"
              onClick={() => { setMode(m); setAt(null); }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="stb-figure">
        <span className="stb-num" aria-label={fmt(total)}>
          {fmt(total).split("").map((ch, i) => (
            <span key={`${gen}-${i}`} className="stb-digit" data-pop={gen > 0 || undefined} style={{ ["--i" as string]: i } as CSSProperties} aria-hidden>
              {ch}
            </span>
          ))}
        </span>
        <span className="stb-unit">{unit}</span>
      </div>

      <div
        ref={plot}
        className="stb-plot"
        style={{ height: CH + 1 }}
        role="img"
        aria-label={`${title}: ${fmt(total)} ${unit} over the last ${data.length} ${mode === "Day" ? "days" : "weeks"}`}
        onPointerDown={(e) => {
          try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* scripted */ }
          pick(e);
        }}
        onPointerMove={pick}
        onPointerUp={(e) => {
          try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* scripted */ }
          if (e.pointerType !== "mouse") setAt(null);
        }}
        onPointerCancel={() => setAt(null)}
        onPointerLeave={() => setAt(null)}
      >
        <span className="stb-base" style={{ top: CH }} />
        {data.map((_, i) => (
          <div
            key={i}
            className="stb-col"
            data-on={at === i || undefined}
            style={{ left: i * (bw + g), width: bw, ["--i" as string]: i } as CSSProperties}
          >
            {layout[i].segs.map((s, k) => (
              <span
                key={k}
                className="stb-bar"
                style={{
                  ["--c" as string]: `var(--stb-c${k + 1})`,
                  bottom: 1 + LIFT + (seen ? s.bottom : 0),
                  height: seen ? s.h : 0,
                } as CSSProperties}
              />
            ))}
          </div>
        ))}

        <motion.span
          className="stb-ring"
          aria-hidden
          style={{ x: ringX, y: ringY, height: ringH, width: bw + 6 }}
        />

        <motion.div className="stb-tip" style={{ x: tipX, width: TIP_W }} aria-hidden>
          {cur && (
            <>
              <div className="stb-tip-head">
                <span>{cur.label}</span>
                <b>{fmt(totals[at!])}</b>
              </div>
              {parts.length ? parts.map(({ v, k }) => (
                <div className="stb-tip-row" key={series[k].name}>
                  <i style={{ ["--c" as string]: `var(--stb-c${k + 1})` } as CSSProperties} />
                  <span>{series[k].name}</span>
                  <b>{fmt(v)}</b>
                </div>
              )) : <div className="stb-tip-row"><span>A rest day</span></div>}
            </>
          )}
        </motion.div>
      </div>

      <div className="stb-axis">
        <span>{data[0]?.short}</span>
        <span>{data[data.length - 1]?.short}</span>
      </div>

      {/* Check-in: which colour is which crew */}
      <div className="stb-legend">
        {series.map((s, k) => (
          <span key={s.name}><i style={{ ["--c" as string]: `var(--stb-c${k + 1})` } as CSSProperties} />{s.name}</span>
        ))}
      </div>
    </div>
  );
}

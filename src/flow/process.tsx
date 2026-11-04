"use client";

import { useEffect, useRef, useState } from "react";

/* ───────────────────────── Verifying screen ───────────────────────── */

export type ProcessStep = { label: string; ms: number };

/**
 * The full-page wait used by every check: CKYC, penny drop, DigiLocker, selfie, screening and retries.
 * Moving shapes, a title and "1 of 3: what is happening now". Calls onDone once every step has finished.
 */
export function VerifyScreen({
  title,
  steps,
  note,
  onDone,
}: {
  title: string;
  steps: ProcessStep[];
  note?: string;
  onDone: () => void;
}) {
  const [active, setActive] = useState(0);
  const done = useRef(onDone);
  const list = useRef(steps);
  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    const items = list.current;
    if (active >= items.length) {
      const t = setTimeout(() => done.current(), 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActive((a) => a + 1), items[active].ms);
    return () => clearTimeout(t);
  }, [active]);

  const shown = Math.min(active, steps.length - 1);
  return (
    <section className="flex min-h-[60vh] w-full max-w-[560px] flex-col items-center justify-center text-center" aria-busy={active < steps.length}>
      <span className="relative mb-8 block size-28" aria-hidden="true">
        <span className="anim-shape-a absolute top-1/2 left-1/2 -mt-1.5 -ml-1.5 size-3 rounded-full bg-success" />
        <span className="anim-shape-b absolute top-1/2 left-1/2 -mt-1 -ml-6 h-2 w-12 rounded-full bg-warning" />
        <span className="anim-shape-c absolute top-1/2 left-1/2 -mt-1 -ml-4 h-2 w-8 rounded-full bg-brand" />
      </span>
      <h1 className="t-28b text-ink">{title}</h1>
      <p key={shown} className="t-14r anim-fade-up mt-2 text-ink-2" aria-live="polite">
        {shown + 1} of {steps.length}: {steps[shown].label}
      </p>
      {note && <p className="t-12r mt-6 text-ink-3">{note}</p>}
    </section>
  );
}

/* ───────────────────────── Celebration ───────────────────────── */

const CONFETTI = ["#533cd2", "#6e56f6", "#12a150", "#f5a524", "#e5484d", "#3b6fd8"];

export type ResultTone = "success" | "error" | "warning" | "info";

const RESULT_BG: Record<ResultTone, string> = {
  success: "var(--success)",
  error: "var(--error)",
  warning: "var(--warning)",
  info: "var(--info)",
};

/**
 * Result badge from the "Heading block" in Figma (4.1.1): a solid 54px circle in the semantic
 * colour with a white 36px glyph, stroke 3.75. Tick for success, cross for failed, "!" for
 * something to act on, clock for in review. Pops in with a ring; the glyph draws itself.
 */
export function ResultIcon({ tone }: { tone: ResultTone }) {
  const stroke = { stroke: "white", strokeWidth: 3.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <span
      className="anim-burst relative flex size-[54px] shrink-0 items-center justify-center rounded-full"
      style={{ background: RESULT_BG[tone] }}
      aria-hidden="true"
    >
      <span className="anim-ring absolute inset-0 rounded-full border-2" style={{ borderColor: RESULT_BG[tone] }} />
      <svg width="36" height="36" viewBox="0 0 36 36">
        {tone === "success" && <path d="M30 9L13.5 25.5L6 18" {...stroke} className="anim-draw" pathLength={1} />}
        {tone === "error" && (
          <>
            <path d="M26 10L10 26" {...stroke} className="anim-draw" pathLength={1} />
            <path d="M10 10L26 26" {...stroke} className="anim-draw" pathLength={1} />
          </>
        )}
        {tone === "warning" && (
          <>
            <path d="M18 9V20" {...stroke} className="anim-draw" pathLength={1} />
            <circle cx="18" cy="26.5" r="2.3" fill="white" />
          </>
        )}
        {tone === "info" && (
          <>
            <circle cx="18" cy="18" r="11.5" {...stroke} strokeWidth={3} />
            <path d="M18 11.5V18L22.5 20.5" {...stroke} strokeWidth={3} className="anim-draw" pathLength={1} />
          </>
        )}
      </svg>
    </span>
  );
}

/** Success badge, with optional confetti for the moments that deserve it (approved, live). */
export function Celebrate({ confetti }: { confetti?: boolean }) {
  return (
    <div className="relative flex justify-center" aria-hidden="true">
      {confetti && (
        <div className="pointer-events-none absolute inset-x-0 -top-4 h-40 overflow-visible">
          {Array.from({ length: 28 }).map((_, i) => (
            <span
              key={i}
              className="anim-confetti absolute top-8 left-1/2 block h-2.5 w-1.5 rounded-[1px]"
              style={
                {
                  background: CONFETTI[i % CONFETTI.length],
                  "--dx": `${Math.cos((i / 28) * Math.PI * 2) * (90 + (i % 5) * 28)}px`,
                  "--dy": `${Math.sin((i / 28) * Math.PI * 2) * (50 + (i % 4) * 18) - 30}px`,
                  "--r": `${(i * 67) % 360}deg`,
                  animationDelay: `${(i % 6) * 30}ms`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}
      <ResultIcon tone="success" />
    </div>
  );
}

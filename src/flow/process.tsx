"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "@/components/ui/ds";
import { Check } from "@/components/ui/icons";

/* ───────────────────────── Live processing view ───────────────────────── */

export type ProcessStep = { label: string; ms: number };

/**
 * A "we're working on it" block: illustration, a determinate bar, and a checklist that ticks off
 * step by step. Calls onDone once every step has finished. Used for CKYC, penny drop, DigiLocker
 * and screening, so every wait looks and behaves the same.
 */
export function ProcessView({
  steps,
  onDone,
  art,
  footnote,
}: {
  steps: ProcessStep[];
  onDone: () => void;
  art?: ReactNode;
  footnote?: string;
}) {
  const [active, setActive] = useState(0);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    if (active >= steps.length) {
      const t = setTimeout(() => done.current(), 450);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActive((a) => a + 1), steps[active].ms);
    return () => clearTimeout(t);
  }, [active, steps]);

  const total = steps.reduce((n, s) => n + s.ms, 0);
  const elapsed = steps.slice(0, active).reduce((n, s) => n + s.ms, 0);
  const current = steps[Math.min(active, steps.length - 1)];
  // The bar glides toward the end of the running step over that step's duration, so it never sits still.
  const target = active < steps.length ? Math.round(((elapsed + current.ms) / total) * 100) : 100;
  const [bar, setBar] = useState(0);
  useEffect(() => {
    const r = requestAnimationFrame(() => setBar(target));
    return () => cancelAnimationFrame(r);
  }, [target]);

  return (
    <div className="flex flex-col gap-5" aria-busy={active < steps.length}>
      {art && <div className="flex justify-center pt-2">{art}</div>}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="t-14s text-ink" aria-live="polite">
            {active < steps.length ? current.label : "All done"}
          </p>
          <span className="t-12s text-brand tabular-nums">{active < steps.length ? `Step ${active + 1} of ${steps.length}` : "Done"}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line-2">
          <div
            className="h-full rounded-full bg-brand transition-[width] ease-linear"
            style={{ width: `${Math.max(bar, 3)}%`, transitionDuration: `${active < steps.length ? current.ms : 300}ms` }}
          />
        </div>
      </div>
      <ol className="flex flex-col gap-3 rounded-xl bg-surface-variant p-4">
        {steps.map((s, i) => {
          const state = i < active ? "done" : i === active ? "active" : "todo";
          return (
            <li key={s.label} className="flex items-center gap-3">
              <span
                className={cx(
                  "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
                  state === "done" && "bg-success text-white",
                  state === "active" && "bg-brand-container text-brand",
                  state === "todo" && "border border-line",
                )}
              >
                {state === "done" ? (
                  <Check size={14} strokeWidth={2.4} />
                ) : state === "active" ? (
                  <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
              </span>
              <span className={cx("t-14r", state === "todo" ? "text-ink-3" : "text-ink")}>{s.label}</span>
            </li>
          );
        })}
      </ol>
      {footnote && <p className="t-12r text-center text-ink-2">{footnote}</p>}
    </div>
  );
}

/** Document under a moving magnifier, for registry look-ups. */
export function ScanArt() {
  return (
    <div className="relative h-[96px] w-[220px]" aria-hidden="true">
      {[-70, 70].map((x) => (
        <span
          key={x}
          className="absolute top-4 flex h-[64px] w-[50px] flex-col gap-1.5 rounded-md bg-surface-variant p-2 shadow-sm"
          style={{ left: `calc(50% + ${x}px - 25px)` }}
        >
          {[70, 90, 60, 80].map((w, i) => (
            <span key={i} className="h-1 rounded bg-line" style={{ width: `${w}%` }} />
          ))}
        </span>
      ))}
      <span className="absolute top-0 left-1/2 flex h-[88px] w-[68px] -translate-x-1/2 flex-col gap-2 rounded-lg border border-line bg-surface p-3 shadow-md">
        {[80, 60, 90, 70, 50].map((w, i) => (
          <span key={i} className="h-1.5 rounded bg-brand-container" style={{ width: `${w}%` }} />
        ))}
        <span className="anim-scanline absolute inset-x-2 h-0.5 rounded bg-brand opacity-70" />
      </span>
      <span className="anim-scan absolute top-6 left-1/2 -ml-6 block size-12 rounded-full border-[5px] border-brand">
        <span className="absolute -right-4 -bottom-3 h-2 w-6 rotate-45 rounded-full bg-brand" />
      </span>
    </div>
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

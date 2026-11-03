"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Check, LogOut, Monitor, Moon, RotateCcw, Sun } from "./ui/icons";
import { cx } from "./ui/ds";

export const STEPS = [
  "Business details",
  "Stakeholders and KYC",
  "Settlement bank",
  "Storefront",
  "Review and sign",
  "Verification and go-live",
] as const;

/** Concentric brand orbs from the "Backdrop" component (cx 640, cy 980 on a 1280×714 frame). */
export function Backdrop() {
  const orbs = [
    { r: 700, o: 0.2 },
    { r: 500, o: 0.28 },
    { r: 320, o: 0.38 },
  ];
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "linear-gradient(180deg, var(--surface-background), var(--surface-variant))" }}
    >
      {orbs.map(({ r, o }) => (
        <span
          key={r}
          className="absolute left-1/2 rounded-full"
          style={{
            width: r * 2,
            height: r * 2,
            marginLeft: -r,
            bottom: -266 - r,
            opacity: o,
            border: "1.5px solid var(--orb-stroke)",
            background: "linear-gradient(180deg, var(--orb-top), var(--orb-bottom))",
          }}
        />
      ))}
    </div>
  );
}

function Ring({ progress }: { progress: number }) {
  const c = 2 * Math.PI * 10;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="-rotate-90">
      <circle cx="12" cy="12" r="10" fill="none" stroke="var(--border)" strokeWidth="2" />
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="var(--success)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={`${(c * progress) / STEPS.length} ${c}`}
        style={{ transition: "stroke-dasharray 400ms ease" }}
      />
    </svg>
  );
}

function ProgressMenu({ step, progress, done }: { step: number; progress: number; done: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${STEPS[step - 1]}, step ${step} of ${STEPS.length}, ${Math.round((progress / STEPS.length) * 100)}% complete`}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-4 rounded-full px-2 py-1 hover:bg-container/60"
      >
        <span className="flex items-center gap-3">
          <Ring progress={done ? STEPS.length : progress} />
          <span className="t-16s hidden whitespace-nowrap text-ink-2 sm:inline">{STEPS[step - 1]}</span>
        </span>
        <span className="hidden size-[7px] rounded-full bg-line sm:block" />
        <span className="t-16s whitespace-nowrap text-ink-2">
          {step} / {STEPS.length}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="anim-pop absolute top-12 left-1/2 z-40 w-[300px] -translate-x-1/2 rounded-2xl border border-line bg-surface p-2"
          style={{ boxShadow: "var(--shadow-pop)" }}
        >
          <p className="t-12s px-3 pt-2 pb-2 text-ink-2">Your progress</p>
          <ol className="flex flex-col">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const status = done || n < step ? "done" : n === step ? "current" : "todo";
              return (
                <li key={label} role="menuitem" className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                  <span
                    className={cx(
                      "t-12s flex size-6 shrink-0 items-center justify-center rounded-full",
                      status === "done" && "bg-success text-white",
                      status === "current" && "bg-brand text-white",
                      status === "todo" && "border border-line text-ink-3",
                    )}
                  >
                    {status === "done" ? <Check size={14} strokeWidth={2.2} /> : n}
                  </span>
                  <span className={cx("t-14m flex-1", status === "todo" ? "text-ink-3" : "text-ink")}>{label}</span>
                  <span
                    className={cx(
                      "t-12r",
                      status === "done" && "text-on-success",
                      status === "current" && "text-brand",
                      status === "todo" && "text-ink-3",
                    )}
                  >
                    {status === "done" ? "Done" : status === "current" ? "In progress" : "Not started"}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

type Theme = "light" | "dark" | "system";

function readTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "dark" ? t : "system";
}

/** Applies the choice now and stores it in a cookie, which the layout reads on the next load. */
function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === "system") {
    delete root.dataset.theme;
    document.cookie = "pw-theme=; path=/; max-age=0; samesite=lax";
  } else {
    root.dataset.theme = t;
    document.cookie = `pw-theme=${t}; path=/; max-age=31536000; samesite=lax`;
  }
}

const THEMES: { value: Theme; label: string; icon: ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun size={16} /> },
  { value: "dark", label: "Dark", icon: <Moon size={16} /> },
  { value: "system", label: "System", icon: <Monitor size={16} /> },
];

/** Avatar with the account menu: who is signed in, theme choice and Log out. */
function AccountMenu({
  initials,
  name,
  onLogout,
  onStartOver,
}: {
  initials: string;
  name: string;
  onLogout: () => void;
  onStartOver: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(readTheme());
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const pick = (t: Theme) => {
    setTheme(t);
    applyTheme(t);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cx(
          "t-14m flex size-10 items-center justify-center rounded-full bg-brand text-white transition-shadow",
          open && "shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-primary)_30%,transparent)]",
        )}
      >
        {initials}
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="anim-pop absolute top-12 right-0 z-40 w-[320px] max-w-[calc(100vw-32px)] rounded-2xl border border-line bg-surface p-2"
          style={{ boxShadow: "var(--shadow-pop)" }}
        >
          <div className="flex items-center gap-3 px-3 pt-2 pb-3">
            <span className="t-14m flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-white">{initials}</span>
            <div className="min-w-0">
              <p className="t-14s truncate text-ink">{name}</p>
              <p className="t-12r text-ink-2">Merchant account</p>
            </div>
          </div>
          <div className="border-t border-line-2 px-3 pt-3 pb-2">
            <p className="t-12s mb-2 text-ink-2" id="theme-label">
              Theme
            </p>
            <div role="radiogroup" aria-labelledby="theme-label" className="flex gap-1 rounded-xl bg-container p-1">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={theme === t.value}
                  onClick={() => pick(t.value)}
                  className={cx(
                    "t-12s flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-2 transition-colors",
                    theme === t.value ? "bg-surface text-ink shadow-sm" : "text-ink-2 hover:text-ink",
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-1 border-t border-line-2 pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onStartOver();
              }}
              className="t-14m flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-ink hover:bg-container"
            >
              <RotateCcw size={18} />
              Start over
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="t-14m flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-on-error hover:bg-error-container"
            >
              <LogOut size={18} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TopBar({
  step,
  progress,
  done,
  onBack,
  onExplore,
  canBack,
  account,
  onLogout,
  onStartOver,
}: {
  step: number;
  progress: number;
  done: boolean;
  onBack: () => void;
  onExplore?: () => void;
  canBack: boolean;
  account: { initials: string; name: string };
  onLogout: () => void;
  onStartOver: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface-bg/80 backdrop-blur">
      <div className="relative flex h-16 items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          disabled={!canBack}
          className="flex size-10 items-center justify-center rounded-full border border-line text-ink hover:bg-container/60 disabled:opacity-40"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="absolute left-1/2 -translate-x-1/2">
          <ProgressMenu step={step} progress={progress} done={done} />
        </div>
        <div className="flex items-center gap-4">
          {onExplore && (
            <button
              type="button"
              onClick={onExplore}
              className="t-12s hidden h-8 items-center rounded-2xl border border-line bg-surface px-6 text-ink hover:border-ink-3 sm:flex"
            >
              Explore test mode
            </button>
          )}
          <AccountMenu initials={account.initials} name={account.name} onLogout={onLogout} onStartOver={onStartOver} />
        </div>
      </div>
    </header>
  );
}

export function ProgressDots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden="true">
      {STEPS.map((_, i) => (
        <span
          key={i}
          className={cx(
            "h-2 rounded-full transition-all duration-300",
            i === step - 1 ? "w-7 bg-brand-dark" : "w-2 bg-brand-2 opacity-45",
          )}
        />
      ))}
    </div>
  );
}

/** Heading block + main card. The CTA sits inside the card. */
export function Page({
  title,
  subtitle,
  children,
  bare,
  icon,
}: {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
  bare?: boolean;
  /** Result badge shown above the heading on success, failed and confirmation screens. */
  icon?: ReactNode;
}) {
  return (
    <section className="flex w-full max-w-[640px] flex-col items-center gap-5">
      {icon && <div className="-mb-1 flex justify-center">{icon}</div>}
      <div className="flex w-full flex-col items-center gap-1.5 text-center">
        <h1 className="t-28b text-ink">{title}</h1>
        <p className="t-14r text-ink-2">{subtitle}</p>
      </div>
      {bare ? (
        children
      ) : (
        <div className="flex w-full flex-col gap-3 rounded-[28px] bg-surface p-6">{children}</div>
      )}
    </section>
  );
}

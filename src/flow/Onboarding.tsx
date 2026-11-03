"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Backdrop, ProgressDots, TopBar } from "@/components/shell";
import type { Ctx } from "./common";
import { SCREENS, initialState, parentScreen, presetFor, progressOf, stepOf, type FlowState } from "./state";
import * as S2 from "./stage2";
import * as S3 from "./stage3";
import * as S4 from "./stage4";
import * as S5 from "./stage5";
import * as S6 from "./stage6";
import * as S78 from "./stage78";
import * as V from "./verify";
import { CircleCheck, LayoutList, X } from "@/components/ui/icons";
import { Button, cx } from "@/components/ui/ds";

const ROUTES: Record<string, ComponentType<Ctx>> = {
  "2.0": S2.PanEntry,
  "2.1A.E1": S2.McaFailed,
  "2.1A.M": S2.ManualCompany,
  "2.1A.E2": S2.NoGstin,
  "2.1A.G": S2.AddGstin,
  "2.1A.E3": S2.CompanyInactive,
  "2.2A": S2.MandatoryDocs,
  "2.2A.E1": S2.ResolutionNotSigned,
  "2.2A.E2": S2.DocNotReadable,
  "2.2B": S2.AddressMethod,
  "2.2B.1": S2.DigiLockerConsent,
  "2.2B.F": S2.DigiLockerFetch,
  "2.2B.2": S2.UploadAddressDoc,
  "2.2B.3": S2.ProofOfBusiness,
  "2.2B.4": S2.PortfolioLink,
  "2.2B.5": S2.EngagementProof,
  "2.2B.E2": S2.DigiLockerFailed,
  "3.0": S3.KeyPersons,
  "3.0.2": S3.IndividualApplicant,
  "3.0.E2": S3.DirectorFlagged,
  "3.1": S3.CkycCheck,
  "3.1.1": S3.CkycFound,
  "3.1.2": S3.CkycUpload,
  "3.1.E1": S3.CkycUnavailable,
  "3.2": S3.PepDeclaration,
  "3.2.1": S3.PepForm,
  "3.2.2": S3.PepNoted,
  "4.0": S4.AccountDetails,
  "4.1": S4.PennyDrop,
  "4.1.1": S4.AccountVerified,
  "4.1.2": S4.NameMismatch,
  "4.1.3": S4.UploadBankProof,
  "4.1.4": S4.ManualReview,
  "4.1.E1": S4.DepositFailed,
  "5.0": S5.CollectionMethod,
  "5.0.E2": S5.ContentDiffers,
  "5.0.E2.X": S5.ExplainDifference,
  "5.1": S5.PolicyAck,
  "5.1.E1": S5.PageNotFound,
  "5.1.E2": S5.GrievanceMissing,
  "6.0": S6.ReviewSubmit,
  "6.E1": S6.MissingItem,
  "6.1": S6.Screening,
  "6.2": S6.Submitted,
  "6.3": S6.AdditionalVerification,
  "6.4": S6.DocumentDeficiency,
  "6.5": V.CpvBook,
  "6.6": V.CpvConfirmed,
  "6.8": V.FaceIntro,
  "6.8.1": V.FaceCapture,
  "6.8.2": V.FaceChecking,
  "6.8.E1": V.CameraBlocked,
  "6.8.E2": V.FaceNoMatch,
  "6.E2": S6.CpvMissed,
  "6.E3": S6.UnableToProceed,
  "6.E4": S6.Rejected,
  "6.7": S6.Approved,
  "7.0": S78.ESignDocs,
  "7.3": S78.MsaSigned,
  "8.0": S78.Sandbox,
  "8.1": S78.TestTransactions,
  "8.2": S78.LiveTransactions,
  "8.3": S78.ProbationComplete,
  "8.E1": S78.ReKyc60,
  "8.E2": S78.ReKyc7,
  "8.E3": S78.LimitReached,
};

const MODALS: Record<string, ComponentType<Ctx>> = {
  "confirm-company": S2.ConfirmCompanyModal,
  "confirm-individual": S2.ConfirmIndividualModal,
  invite: S3.InviteModal,
  "bank-proof": S4.BankProofModal,
  "edit-business": S6.EditBusiness,
  "edit-pan": S6.EditPan,
  "edit-stakeholders": S6.EditStakeholders,
  "edit-bank": S6.EditBank,
  "edit-storefront": S6.EditStorefront,
  esign: S78.ESignModal,
};

function readScreenParam() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("screen");
}

const SAVE_KEY = "pw-onboarding";
type Toast = { id: number; title: string; text?: string };

function loadSaved(): FlowState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    // An upload cut off by a reload never finished, so it comes back as not added.
    const json = JSON.stringify(JSON.parse(raw), (_, v) => (v && v.status === "uploading" ? { status: "missing" } : v));
    return { ...initialState(), ...JSON.parse(json), modal: null };
  } catch {
    return null;
  }
}

export default function Onboarding() {
  const [s, setS] = useState<FlowState>(initialState);
  const [indexOpen, setIndexOpen] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [dir, setDir] = useState<"forward" | "back">("forward");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const ready = useRef(false);

  // A ?screen= link shows that state; otherwise resume where the merchant left off.
  useEffect(() => {
    const id = readScreenParam();
    const saved = id ? null : loadSaved();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (id) setS(presetFor(id));
    else if (saved) setS(saved);
    ready.current = true;
  }, []);

  // Autosave every change (popups are not restored).
  useEffect(() => {
    if (!ready.current || readScreenParam()) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({ ...s, modal: null }));
      } catch {
        // Storage blocked: the flow still works for this visit.
      }
    }, 400);
    return () => clearTimeout(t);
  }, [s]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [s.screen]);

  const toast = useCallback((title: string, text?: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, title, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const set = useCallback((patch: Partial<FlowState>) => setS((p) => ({ ...p, ...patch })), []);
  const ctx: Ctx = useMemo(
    () => ({
      s,
      set,
      toast,
      update: (fn) => setS((p) => ({ ...p, ...fn(p) })),
      go: (screen, patch) => {
        setDir("forward");
        setS((p) => ({ ...p, ...patch, screen, history: [...p.history, p.screen] }));
      },
      replace: (screen, patch) => {
        setDir("forward");
        setS((p) => ({ ...p, ...patch, screen }));
      },
      back: () => {
        setDir("back");
        setS((p) =>
          p.modal
            ? { ...p, modal: null }
            : p.history.length
              ? { ...p, screen: p.history[p.history.length - 1], history: p.history.slice(0, -1) }
              : // No history (opened from the index or a link): step back to the screen this one belongs to.
                { ...p, screen: parentScreen(p.screen, p.record?.entity) ?? p.screen },
        );
      },
    }),
    [s, set, toast],
  );

  const Screen = ROUTES[s.screen] ?? S2.PanEntry;
  const ModalView = s.modal ? MODALS[s.modal] : null;
  const step = stepOf(s.screen);

  const jump = (id: string) => {
    setDir("forward");
    setS(presetFor(id));
    setIndexOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set("screen", id);
    window.history.replaceState(null, "", url);
  };

  if (signedOut) return <SignedOut onLogin={() => setSignedOut(false)} />;

  return (
    <div className="relative isolate flex min-h-screen flex-col">
      <Backdrop />
      <TopBar
        account={{ initials: "PN", name: s.record?.displayName ?? "Your business" }}
        onLogout={() => {
          set({ modal: null });
          setIndexOpen(false);
          setSignedOut(true);
        }}
        onStartOver={() => {
          try {
            localStorage.removeItem(SAVE_KEY);
          } catch {}
          window.history.replaceState(null, "", window.location.pathname);
          setDir("back");
          setS(initialState());
          toast("Started over", "Your earlier answers were cleared.");
        }}
        step={step}
        progress={progressOf(s.screen)}
        done={s.screen === "8.3"}
        canBack={s.history.length > 0 || !!s.modal || !!parentScreen(s.screen, s.record?.entity)}
        onBack={ctx.back}
        onExplore={s.screen === "4.1" ? undefined : () => ctx.go("8.0")}
      />
      <main className="flex flex-1 flex-col items-center px-4 pt-9 pb-24">
        <div key={s.screen} className={cx("flex w-full justify-center", dir === "back" ? "anim-back" : "anim-forward")}>
          <Screen {...ctx} />
        </div>
      </main>
      <div className="pointer-events-none fixed inset-x-0 bottom-9 -z-[1]">
        <ProgressDots step={step} />
      </div>
      {ModalView && <ModalView key={s.modal} {...ctx} />}

      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="anim-toast pointer-events-auto flex max-w-[420px] items-start gap-3 rounded-2xl bg-btn px-4 py-3 text-btn-text"
            style={{ boxShadow: "var(--shadow-pop)" }}
          >
            <span className="mt-px shrink-0 text-success">
              <CircleCheck size={20} />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="t-14s">{t.title}</span>
              {t.text && <span className="t-12r opacity-80">{t.text}</span>}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setIndexOpen(true)}
        className="t-12s fixed right-5 bottom-5 z-30 flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-4 text-ink-2 hover:text-ink"
        style={{ boxShadow: "var(--shadow-pop)" }}
      >
        <LayoutList size={16} />
        Screens · {s.screen}
      </button>
      {indexOpen && (
        <aside
          aria-label="All screens"
          className="anim-fade-up fixed top-4 right-4 bottom-4 z-[60] flex w-[320px] flex-col overflow-hidden rounded-2xl border border-line bg-surface"
          style={{ boxShadow: "var(--shadow-pop)" }}
        >
          <div className="flex items-center justify-between border-b border-line-2 px-4 py-3">
            <div>
              <p className="t-14s text-ink">All screens</p>
              <p className="t-12r text-ink-2">Jump to any state from the design file.</p>
            </div>
            <button type="button" aria-label="Close" onClick={() => setIndexOpen(false)} className="text-ink-2 hover:text-ink">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-auto px-2 py-2">
            {SCREENS.map((g) => (
              <div key={g.stage} className="mb-2">
                <p className="t-12s px-2 py-2 text-ink-3">{g.stage}</p>
                {g.items.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => jump(id)}
                    className={cx(
                      "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-container",
                      id === s.screen && "bg-brand-container",
                    )}
                  >
                    <span className="t-12s w-14 shrink-0 text-brand">{id}</span>
                    <span className="t-12r text-ink">{label}</span>
                  </button>
                ))}
              </div>
            ))}
            <p className="t-12r px-2 pt-2 pb-4 text-ink-3">
              Demo PANs: AAACN1234Q company (several GST, CIN) · AABCN1234M single GST and CIN · AAAFS5821K firm ·
              AAAFS6120M LLP · AKPPS4821R individual · AAACM1234D MCA down · AAACG1234N no GSTIN · AAACZ1234S struck off.
              Bank: account ending 0000 fails the deposit, 1111 gives a name mismatch. eSign code 000000 is wrong.
            </p>
          </div>
        </aside>
      )}
    </div>
  );
}

/** Shown after Log out. Progress stays in this tab, so logging back in resumes the same screen. */
function SignedOut({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center px-4">
      <Backdrop />
      <section className="anim-fade-up flex w-full max-w-[440px] flex-col items-center gap-5 rounded-[28px] bg-surface p-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/paywize-mark.svg" alt="Paywize" width={40} height={40} />
        <div className="flex flex-col gap-1.5">
          <h1 className="t-28b text-ink">You are logged out</h1>
          <p className="t-14r text-ink-2">Your progress is saved. Log in to pick up where you left off.</p>
        </div>
        <Button full onClick={onLogin}>
          Log in again
        </Button>
      </section>
    </div>
  );
}

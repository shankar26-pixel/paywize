"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, OptionRow, cx } from "@/components/ui/ds";
import { Building, Clock, IdCard, Smartphone, Sun } from "@/components/ui/icons";
import { Page } from "@/components/shell";
import { Actions, StatusScreen, SuccessScreen, useFilePicker, type Ctx } from "./common";
import { ProcessView } from "./process";
import type { FlowState } from "./state";

/** The person completing KYC: chosen on 3.0, or the applicant for individuals. */
export function kycPerson(s: FlowState) {
  return s.people.find((p) => p.id === s.kycOwner)?.name ?? s.record?.displayName ?? "you";
}

/* ───────────────────────── 6.8 Face verification ───────────────────────── */

const TIPS = [
  { icon: <Sun size={20} />, title: "Find good light", desc: "Face a window or lamp. Avoid light behind you." },
  { icon: <IdCard size={20} />, title: "Show your full face", desc: "Remove caps, masks and dark glasses." },
  { icon: <Clock size={20} />, title: "Takes about 20 seconds", desc: "Follow the prompts: blink, then turn slightly." },
];

export function FaceIntro({ s, go }: Ctx) {
  const name = kycPerson(s);
  return (
    <Page title="Verify your face" subtitle={`A quick live selfie confirms that ${name.split(" ")[0]} is the person completing KYC.`}>
      <div className="flex flex-col gap-3">
        {TIPS.map((t) => (
          <div key={t.title} className="flex items-center gap-3 rounded-xl bg-container px-4 py-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-surface text-ink-2">{t.icon}</span>
            <span className="flex flex-col gap-1">
              <span className="t-14s text-ink">{t.title}</span>
              <span className="t-12r text-ink-2">{t.desc}</span>
            </span>
          </div>
        ))}
      </div>
      <p className="t-12r text-ink-2">
        We compare it with the photo on your PAN and CKYC record, then delete the video. Only the result is kept.
      </p>
      <Actions actions={[{ label: "Start face verification", onClick: () => go("6.8.1") }]} />
    </Page>
  );
}

const PROMPTS = [
  { text: "Place your face inside the oval", ms: 1800 },
  { text: "Blink twice", ms: 1600 },
  { text: "Turn your head slightly left", ms: 1600 },
  { text: "Now slightly right", ms: 1600 },
  { text: "Hold still", ms: 1100 },
];

/** Live camera with an oval guide and liveness prompts. Without a camera it goes to 6.8.E1. */
export function FaceCapture({ replace }: Ctx) {
  const video = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<"asking" | "live">("asking");
  const [step, setStep] = useState(0);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      replace("6.8.E1");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 640, height: 640 }, audio: false })
      .then((st) => {
        if (cancelled) return st.getTracks().forEach((t) => t.stop());
        stream = st;
        if (video.current) video.current.srcObject = st;
        setPhase("live");
      })
      .catch(() => !cancelled && replace("6.8.E1"));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "live") return;
    if (step >= PROMPTS.length) {
      const t = setTimeout(() => replace("6.8.2"), 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((n) => n + 1), PROMPTS[step].ms);
    return () => clearTimeout(t);
  }, [phase, step, replace]);

  const c = 2 * Math.PI * 128;
  const done = Math.min(step, PROMPTS.length) / PROMPTS.length;
  return (
    <Page title="Look at the camera" subtitle="Keep your face inside the oval and follow the prompts.">
      <div className="flex flex-col items-center gap-5 py-2">
        <div className="relative size-[272px]">
          <div className="absolute inset-[8px] overflow-hidden rounded-full bg-container">
            <video
              ref={video}
              autoPlay
              playsInline
              muted
              className={cx("size-full -scale-x-100 object-cover transition-opacity", phase === "live" ? "opacity-100" : "opacity-0")}
            />
            {phase === "asking" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
                <span className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                <span className="t-12r text-ink-2">Allow camera access when your browser asks.</span>
              </div>
            )}
          </div>
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 272 272" aria-hidden="true">
            <circle cx="136" cy="136" r="128" fill="none" stroke="var(--border-variant)" strokeWidth="6" />
            <circle
              cx="136"
              cy="136"
              r="128"
              fill="none"
              stroke="var(--success)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${c * done} ${c}`}
              style={{ transition: "stroke-dasharray 500ms ease" }}
            />
          </svg>
        </div>
        <p className="t-18s min-h-[26px] text-ink" aria-live="assertive">
          {phase === "live" ? (step < PROMPTS.length ? PROMPTS[step].text : "Got it") : "Starting your camera…"}
        </p>
        <p className="t-12r text-ink-2">Your video stays on this device until the check is done.</p>
      </div>
    </Page>
  );
}

export function FaceChecking({ s, replace, toast }: Ctx) {
  return (
    <Page title="Checking your selfie" subtitle="This takes a few seconds.">
      <ProcessView
        steps={[
          { label: "Confirming it is a live person", ms: 1100 },
          { label: "Matching with your PAN and CKYC photo", ms: 1500 },
          { label: "Saving the result securely", ms: 800 },
        ]}
        footnote="The video is deleted once the check is done."
        onDone={() => {
          replace("6.5");
          toast("Face verified", `${kycPerson(s)} · match score 98%`);
        }}
      />
    </Page>
  );
}

export function CameraBlocked({ go, replace }: Ctx) {
  const [open, input] = useFilePicker(() => replace("6.8.2"), ".jpg,.jpeg,.png");
  return (
    <StatusScreen
      title="We cannot use your camera"
      subtitle="Face verification needs a front camera."
      tone="warning"
      alertTitle="Camera access is off or unavailable"
      alertText="Allow camera access for this site in your browser settings, or upload a clear, recent selfie instead."
      actions={[
        { label: "Upload a selfie", variant: "secondary", onClick: open },
        { label: "Try again", onClick: () => go("6.8.1") },
      ]}
    >
      {input}
    </StatusScreen>
  );
}

export function FaceNoMatch({ go }: Ctx) {
  return (
    <StatusScreen
      title="We could not match your face"
      subtitle="This usually means the light was poor or the face was partly hidden."
      tone="error"
      alertTitle="Let us try once more"
      alertText="Move to brighter light, remove glasses and keep your whole face in the oval."
      actions={[{ label: "Try again", onClick: () => go("6.8.1") }]}
    />
  );
}

/* ───────────────────────── 6.5 Contact point verification (CPV) ───────────────────────── */

/** The next five working days (no Sundays), labelled like "Tomorrow" or "Thu, 5 Nov". */
function nextDays() {
  const out: string[] = [];
  const d = new Date();
  while (out.length < 5) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) continue;
    out.push(
      out.length === 0 && new Date().getDay() !== 6
        ? "Tomorrow"
        : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
    );
  }
  return out;
}

const VIDEO_SLOTS = ["10:00 AM", "11:00 AM", "12:30 PM", "2:00 PM", "3:30 PM", "5:00 PM"];
const VISIT_SLOTS = ["10 AM – 1 PM", "2 PM – 5 PM"];
const FULL = new Set(["12:30 PM", "3:30 PM"]);

function ChipGroup({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: Set<string>;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="t-12s mb-2 text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const off = disabled?.has(o);
          const on = value === o;
          return (
            <button
              key={o}
              type="button"
              disabled={off}
              aria-pressed={on}
              onClick={() => onChange(o)}
              className={cx(
                "t-14m h-10 rounded-full border px-4 transition-colors",
                on && "border-brand bg-brand text-white",
                !on && !off && "border-line bg-surface text-ink hover:border-brand",
                off && "cursor-not-allowed border-line-2 bg-surface-variant text-ink-disabled line-through",
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function CpvBook({ s, set, go }: Ctx) {
  const days = nextDays();
  const video = s.cpvMode === "video";
  const slots = video ? VIDEO_SLOTS : VISIT_SLOTS;
  const ready = !!s.cpvDay && slots.includes(s.cpvTime);
  return (
    <Page title="Verify your business" subtitle="A short contact point verification, required for every account.">
      <div role="radiogroup" aria-label="Verification method" className="flex flex-col gap-3">
        <OptionRow
          name="cpv"
          icon={<Smartphone size={20} />}
          title="Video call"
          description="About 10 minutes, from anywhere. Keep your PAN and a government ID ready."
          checked={video}
          onSelect={() => set({ cpvMode: "video", cpvTime: "" })}
        />
        <OptionRow
          name="cpv"
          icon={<Building size={20} />}
          title="Visit to your registered address"
          description={`An officer visits ${s.record?.office ?? "your registered address"}.`}
          checked={!video}
          onSelect={() => set({ cpvMode: "visit", cpvTime: "" })}
        />
      </div>
      <ChipGroup label="Pick a day" options={days} value={s.cpvDay} onChange={(cpvDay) => set({ cpvDay })} />
      <ChipGroup
        label={video ? "Pick a time" : "Pick a window"}
        options={slots}
        value={s.cpvTime}
        onChange={(cpvTime) => set({ cpvTime })}
        disabled={video ? FULL : undefined}
      />
      {!video && (
        <Alert tone="info" dismissible={false}>
          Someone authorised to act for the business must be present with an original ID.
        </Alert>
      )}
      <Actions actions={[{ label: "Confirm slot", disabled: !ready, onClick: () => go("6.6") }]} />
    </Page>
  );
}

export function CpvConfirmed({ s, go }: Ctx) {
  const video = s.cpvMode === "video";
  return (
    <SuccessScreen
      title="Slot confirmed"
      subtitle={
        video
          ? "We will send a joining link 15 minutes before. Submit your application now; the call completes it."
          : "We will text you the officer's name the day before. Submit your application now; the visit completes it."
      }
      detail={`${video ? "Video call" : "Visit"} · ${s.cpvDay || "Tomorrow"}, ${s.cpvTime || "11:00 AM"}`}
      action={{ label: "Submit application", onClick: () => go("6.1") }}
    />
  );
}


"use client";

import { useEffect, useRef, useState, type HTMLAttributes, type PointerEvent } from "react";
import { Button, Input, Select, SummaryTable, cx } from "@/components/ui/ds";
import { Clock, IdCard, Sun } from "@/components/ui/icons";
import { Page } from "@/components/shell";
import { Actions, StatusScreen, UploadRow, startUpload, type Ctx } from "./common";
import { ProcessView, ResultIcon } from "./process";
import type { DocState, FlowState } from "./state";

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

const FACE_ATTEMPTS = 3;
const DAY_MS = 24 * 3600 * 1000;

/** Sends the merchant to sign in; progress is saved and they resume here afterwards. */
export function saveAndExit({ s, replace, toast }: Ctx) {
  replace("I.1", { resume: s.screen, modal: null, history: [] });
  toast("Your progress is saved", "Sign in any time to continue.");
}

/** Retries are spent once locked; a lock that has passed gives the merchant a fresh 3 attempts. */
function startFaceCheck({ s, go }: Ctx) {
  if (s.faceLockUntil > Date.now()) return go("6.8.E3");
  go("6.8.1", s.faceLockUntil ? { faceFails: 0, faceLockUntil: 0 } : undefined);
}

export function FaceIntro(ctx: Ctx) {
  const { s } = ctx;
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
      <Actions actions={[{ label: "Start face verification", onClick: () => startFaceCheck(ctx) }]} />
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
          if (s.faceFail) {
            const faceFails = s.faceFails + 1;
            if (faceFails >= FACE_ATTEMPTS) return replace("6.8.E3", { faceFails, faceLockUntil: Date.now() + DAY_MS });
            return replace("6.8.E2", { faceFails });
          }
          replace("6.1", { faceFails: 0, faceLockUntil: 0 });
          toast("Face verified", `${kycPerson(s)} · match score 98%`);
        }}
      />
    </Page>
  );
}

export function CameraBlocked(ctx: Ctx) {
  const { go } = ctx;
  return (
    <StatusScreen
      title="We cannot use your camera"
      subtitle="Face verification needs a front camera."
      tone="warning"
      alertTitle="Camera access is off or unavailable"
      alertText="Allow camera access for this site in your browser settings, or upload left, right and straight photos instead."
      actions={[
        { label: "Upload photos", variant: "secondary", onClick: () => go("6.8.U") },
        { label: "Try again", onClick: () => startFaceCheck(ctx) },
      ]}
    />
  );
}

export function FaceNoMatch(ctx: Ctx) {
  const left = Math.max(FACE_ATTEMPTS - ctx.s.faceFails, 0);
  return (
    <StatusScreen
      title="We could not match your face"
      subtitle="This usually means the light was poor or the face was partly hidden."
      tone="error"
      alertTitle={`${left} of ${FACE_ATTEMPTS} attempts left today`}
      alertText="Move to brighter light, remove glasses and keep your whole face in the oval."
      actions={[{ label: "Try again", onClick: () => startFaceCheck(ctx) }]}
    />
  );
}

export function FaceLocked(ctx: Ctx) {
  const { s, go } = ctx;
  const until = s.faceLockUntil
    ? new Date(s.faceLockUntil).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : "24 hours from now";
  return (
    <StatusScreen
      title="Try again after 24 hours"
      subtitle={`You have used all ${FACE_ATTEMPTS} attempts for today.`}
      tone="warning"
      alertTitle={`You can retry from ${until}`}
      alertText="Or continue now by uploading left, right and straight photos of the authorised signatory's face. We check these by hand."
      actions={[
        { label: "Come back later", variant: "secondary", onClick: () => saveAndExit(ctx) },
        { label: "Upload photos", onClick: () => go("6.8.U") },
      ]}
    />
  );
}

const ANGLES = [
  { key: "left", title: "Left side of the face", hint: "Turn your head to the right, so the left side faces the camera." },
  { key: "right", title: "Right side of the face", hint: "Turn your head to the left, so the right side faces the camera." },
  { key: "front", title: "Straight, looking at the camera", hint: "Full face in good light, with no cap, mask or dark glasses." },
] as const;

const IMAGE = /\.(jpe?g|png)$/i;

export function FacePhotos({ s, go, update, toast }: Ctx) {
  const photos = s.facePhotos;
  const ready = ANGLES.every((a) => photos[a.key].status === "uploaded");
  const apply = (key: (typeof ANGLES)[number]["key"], d: DocState) => update((p) => ({ facePhotos: { ...p.facePhotos, [key]: d } }));
  return (
    <Page title="Upload photos of the face" subtitle={`Three recent photos of the authorised signatory${s.isSignatory ? "" : ", not your own"}.`}>
      {ANGLES.map((a) => (
        <UploadRow
          key={a.key}
          title={a.title}
          hint={`${a.hint} JPG or PNG, up to 5 MB.`}
          doc={photos[a.key]}
          onPick={([file]) => {
            if (!IMAGE.test(file.name)) return apply(a.key, { status: "error", note: "Upload a JPG or PNG photo." });
            startUpload(file, (d) => apply(a.key, d));
          }}
        />
      ))}
      <Actions
        actions={[
          {
            label: "Submit photos",
            disabled: !ready,
            onClick: () => {
              toast("Photos received", "We will check them by hand along with your application.");
              go("6.1");
            },
          },
        ]}
      />
    </Page>
  );
}

/* ───────────── The applicant is not the signatory: share the link ───────────── */

const SOMEONE_ELSE = "other";

export function FaceShare({ s, go, toast }: Ctx) {
  const signatories = s.people.filter((p) => /director|partner|proprietor|signatory/i.test(p.role));
  const options = [...signatories.map((p) => ({ value: p.id, label: p.name, hint: p.role })), { value: SOMEONE_ELSE, label: "Someone else" }];
  const [who, setWho] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const person = signatories.find((p) => p.id === who);
  const fullName = person?.name ?? name.trim();
  const ready = !!fullName && !!mobile;
  return (
    <Page title="Share the face verification link" subtitle="An authorised signatory must verify their own face, on their own phone.">
      <Select label="Who should verify?" placeholder="Select a director or signatory" value={who} onChange={setWho} options={options} />
      {who === SOMEONE_ELSE && <Input label="Their full name" value={name} onChange={setName} placeholder="As on their PAN" />}
      <Input
        label="Their mobile number"
        inputMode="tel"
        value={mobile}
        placeholder="+91 98765 43210"
        error={error}
        help="We send the link by SMS. It works for 24 hours."
        onChange={(v) => {
          setMobile(v);
          setError("");
        }}
      />
      <Actions
        actions={[
          { label: "They are with me", variant: "secondary", onClick: () => go("6.8") },
          {
            label: "Send link",
            disabled: !ready,
            onClick: () => {
              const m = mobile.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
              if (!/^[6-9]\d{9}$/.test(m)) return setError("Enter a valid 10-digit mobile number.");
              toast(`Link sent to ${fullName.split(" ")[0]}`, `By SMS to +91 ••••••${m.slice(-4)}.`);
              go("6.8.W", { faceLink: { name: fullName, mobile: m } });
            },
          },
        ]}
      />
    </Page>
  );
}

export function FaceWaiting(ctx: Ctx) {
  const { s, replace, toast } = ctx;
  const { name, mobile } = s.faceLink;
  const first = (name || "the signatory").split(" ")[0];
  return (
    <Page title={`Waiting for ${first}`} subtitle="We will continue as soon as they finish. You can close this page." icon={<ResultIcon tone="info" />}>
      <SummaryTable
        rows={[
          { label: "Link sent to", value: name || "Authorised signatory" },
          { label: "Mobile", value: `+91 ••••••${(mobile || "0000").slice(-4)}` },
          { label: "Link works for", value: "24 hours" },
          { label: "Attempts allowed", value: `${FACE_ATTEMPTS} a day` },
        ]}
      />
      <Actions
        actions={[
          { label: "Resend link", variant: "secondary", onClick: () => toast("Link sent again", `By SMS to +91 ••••••${(mobile || "0000").slice(-4)}.`) },
          {
            label: "Check status",
            onClick: () => {
              toast("Face verified", `${name || "Authorised signatory"} · match score 98%`);
              replace("6.1");
            },
          },
        ]}
      />
    </Page>
  );
}

/* ───────────── 6.5 Contact point verification (CPV) ───────────── */

/**
 * Deliberately says nothing about how or when CPV happens: no date, method, or who carries it out.
 * A merchant who knows when it is coming could stage it.
 */
export function CpvProcessing(ctx: Ctx) {
  const { s, go } = ctx;
  return (
    <section className="flex w-full max-w-[880px] flex-col items-center gap-2 md:flex-row md:items-start md:justify-center md:gap-16">
      <VerificationPass business={s.record?.displayName ?? "Your business"} />
      <div className="relative z-10 flex w-full max-w-[500px] flex-col items-center text-center md:pt-8">
        <span className="flex size-[72px] items-center justify-center rounded-full bg-brand-container text-brand" aria-hidden="true">
          <Clock size={36} />
        </span>
        <h1 className="t-28b mt-6 text-ink">Business verification in progress</h1>
        <p className="t-14r mt-2 text-ink-2">This can take 2 weeks or longer. No action is needed from you, and we will email you once it is complete.</p>
        <div className="mt-7 flex w-full flex-col items-center">
          <div className="flex w-full flex-col items-center gap-1 rounded-[28px] bg-surface px-6 py-7">
            <h2 className="t-18s text-ink">You can still accept limited transactions</h2>
            <p className="t-14r text-ink-2">Funds will settle after your business verification is complete.</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" variant="secondary" onClick={() => saveAndExit(ctx)}>
                Come back later
              </Button>
              {/* A used batch starts again, so the merchant can always keep transacting while verification runs. */}
              <Button size="lg" onClick={() => go("8.0", { limited: true, live: s.live >= 10 ? 0 : s.live })}>
                Start transaction
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Side notches where the pass tears along its two perforated lines.
const NOTCHES = ["132px", "368px"].flatMap((y) => [`0 ${y}`, `100% ${y}`]);
const PASS_MASK = NOTCHES.map((at) => `radial-gradient(circle 8px at ${at}, transparent 98%, black)`).join(", ");

function PassField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="font-mono text-[9px] leading-3 tracking-wider text-[#606078] uppercase">{label}</span>
      <span className="truncate text-[12px] leading-4 font-semibold">{value}</span>
    </div>
  );
}

const PASS_REST = -5;
const PASS_MAX = 55;

type PassHandlers = Pick<HTMLAttributes<HTMLDivElement>, "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel">;

/**
 * Pendulum for the pass: it swings in on load, follows the pointer around the top of its cord
 * while held, and swings back to rest on release. Writes straight to the element, so no re-renders.
 */
function usePendulum() {
  const ref = useRef<HTMLDivElement>(null);
  const handlers = useRef<PassHandlers>({});

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Desktop only: on smaller screens, and with reduced motion, the pass simply hangs still.
    const motion = window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
    let stop = () => {};
    const sync = () => {
      stop();
      stop = motion.matches ? swing(el, handlers.current) : () => {};
    };
    sync();
    motion.addEventListener("change", sync);
    return () => {
      motion.removeEventListener("change", sync);
      stop();
    };
  }, []);

  return { ref, handlers };
}

function swing(el: HTMLDivElement, handlers: PassHandlers) {
  let angle = 24;
  let speed = 0;
  let held = false;
  let pointer = -1;
  let target = PASS_REST;
  let grab = 0;
  let frame = 0;
  let last = 0;

  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000 || 1 / 60, 1 / 30);
    last = now;
    // Stiff and well damped while held, loose and swingy once let go.
    const [stiffness, damping] = held ? [220, 24] : [26, 1.5];
    speed += (stiffness * (target - angle) - damping * speed) * dt;
    angle += speed * dt;
    el.style.rotate = `${angle.toFixed(2)}deg`;
    if (held || Math.abs(speed) > 0.05 || Math.abs(angle - target) > 0.05) frame = requestAnimationFrame(tick);
    else frame = 0;
  };
  const run = () => {
    if (frame) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };
  // Measured on the unrotated parent, the top of the cord is the pivot.
  const pointerAngle = (e: PointerEvent<HTMLDivElement>) => {
    const box = el.parentElement!.getBoundingClientRect();
    return (-Math.atan2(e.clientX - (box.left + box.width / 2), Math.max(e.clientY - box.top, 1)) * 180) / Math.PI;
  };
  const release = () => {
    held = false;
    target = PASS_REST;
    el.style.cursor = "grab";
    run();
  };
  handlers.onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    held = true;
    pointer = e.pointerId;
    grab = angle - pointerAngle(e);
    target = angle;
    el.style.cursor = "grabbing";
    run();
  };
  handlers.onPointerMove = (e) => {
    if (held && e.pointerId === pointer) target = Math.max(-PASS_MAX, Math.min(PASS_MAX, pointerAngle(e) + grab));
  };
  handlers.onPointerUp = (e) => e.pointerId === pointer && release();
  handlers.onPointerCancel = (e) => e.pointerId === pointer && release();
  el.style.cursor = "grab";
  run();
  return () => {
    cancelAnimationFrame(frame);
    el.style.rotate = "";
    el.style.cursor = "";
    for (const key of Object.keys(handlers) as (keyof PassHandlers)[]) delete handlers[key];
  };
}

/** A printed pass on a cord that the merchant can grab and swing; colours are fixed, like paper, in both themes. */
function VerificationPass({ business }: { business: string }) {
  const { ref, handlers } = usePendulum();
  return (
    <div className="-mt-9 h-[400px] w-[260px] shrink-0 md:h-[590px]" aria-hidden="true">
      <div
        ref={ref}
        className="anim-pass relative flex origin-top scale-[0.68] flex-col items-center select-none md:touch-pan-y md:scale-100"
        style={{ filter: "drop-shadow(0 14px 22px rgb(26 16 82 / 0.18))" }}
        onPointerDown={(e) => handlers.current.onPointerDown?.(e)}
        onPointerMove={(e) => handlers.current.onPointerMove?.(e)}
        onPointerUp={(e) => handlers.current.onPointerUp?.(e)}
        onPointerCancel={(e) => handlers.current.onPointerCancel?.(e)}
      >
        <svg width="40" height="84" viewBox="0 0 40 84" className="relative z-10 -mb-5" fill="none" stroke="#25253c" strokeWidth="2.5" strokeLinecap="round">
          <path d="M13 0 19 66M27 0 21 66" />
          <circle cx="20" cy="72" r="6" strokeWidth="3.5" fill="var(--surface-background)" />
        </svg>
        <div
          className="flex h-[510px] w-[260px] flex-col rounded-2xl bg-[#f5f3ee] text-[#25253c]"
          style={{ mask: PASS_MASK, WebkitMask: PASS_MASK, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
        >
          <div className="flex h-[132px] shrink-0 flex-col justify-end gap-2 border-b border-dashed border-[#25253c]/30 px-5 pb-4">
            <div className="flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/figma/auth/mark.svg" alt="" draggable={false} className="size-6" />
              <span className="text-[18px] font-medium tracking-[-0.37px] italic" style={{ fontFamily: "var(--font-poppins)" }}>
                Paywize
              </span>
            </div>
            <span className="w-fit rounded-full border border-[#25253c] px-2.5 py-0.5 text-[11px] leading-4 font-medium">Merchant pass</span>
          </div>
          <div className="flex h-[236px] shrink-0 flex-col justify-center border-b border-dashed border-[#25253c]/30 px-4">
            <div
              className="relative flex h-[204px] flex-col justify-between overflow-hidden rounded-xl p-4 text-white"
              style={{ background: "linear-gradient(160deg, #1a1052 10%, #6953e4 75%, #1a1052 120%)" }}
            >
              <span className="absolute -top-8 -right-8 size-28 rounded-full bg-[#d9ff00]/90" />
              <span className="absolute right-6 -bottom-10 size-24 rounded-full bg-white/15" />
              <span className="relative font-mono text-[10px] leading-3 tracking-wider uppercase">In progress</span>
              <p className="relative">
                <span className="block text-[20px] leading-6 font-extrabold">Move money</span>
                <span className="block text-[26px] leading-8 font-semibold text-[#d9ff00] italic" style={{ fontFamily: "var(--font-playfair)" }}>
                  without friction
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-between px-5 py-4">
            <div className="flex flex-col gap-2">
              <PassField label="Business" value={business} />
              <PassField label="Reference" value="PWZ-2026-48213" />
            </div>
            <div
              className="h-9 w-full"
              style={{ background: "repeating-linear-gradient(90deg, #25253c 0 2px, transparent 2px 4px, #25253c 4px 5px, transparent 5px 9px, #25253c 9px 12px, transparent 12px 14px)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

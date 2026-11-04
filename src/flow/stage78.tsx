"use client";

import { useEffect, useState } from "react";
import { Button, Chip, CtaRow, DocRow, OtpModal, SegmentBar, SummaryTable } from "@/components/ui/ds";
import { CheckBadge, FileCheck, FileText } from "@/components/ui/icons";
import { Page } from "@/components/shell";
import { MSA_DOCS } from "./data";
import { Actions, StatusScreen, SuccessScreen, type Ctx } from "./common";

/* ───────────── 7.0 / 7.2 E-sign documents ───────────── */

export function ESignDocs({ s, set, go }: Ctx) {
  const all = s.signed.every(Boolean);
  const count = s.signed.filter(Boolean).length;
  const next = s.signed.indexOf(false);
  const [submitting, setSubmitting] = useState(false);
  return (
    <Page
      title="Sign your documents"
      subtitle={all ? "All documents are signed. Submit to finish." : "Sign each document with Aadhaar eSign. You can submit once all are signed."}
    >
      <div className="flex items-center justify-between">
        <h2 className="t-16s text-ink">E-Sign documents</h2>
        <span className={`t-12s ${all ? "text-success" : "text-ink-2"}`} role="status">
          {count} of {MSA_DOCS.length} signed
        </span>
      </div>
      {MSA_DOCS.map((d, i) => (
        <DocRow
          key={d.title}
          variant="neutral"
          icon={s.signed[i] ? <FileCheck size={20} /> : <FileText size={20} />}
          title={d.title}
          description={i === next ? `${d.file} · Up next` : d.file}
          trailing={
            s.signed[i] ? (
              <Chip tone="success">Signed</Chip>
            ) : (
              <button
                type="button"
                onClick={() => set({ modal: "esign", signing: i })}
                className="t-14s shrink-0 px-1 text-brand underline"
                aria-label={`E-Sign ${d.title}`}
              >
                E-Sign
              </button>
            )
          }
        />
      ))}
      <hr className="border-line-2" />
      <CtaRow>
        <Button
          disabled={!all}
          loading={submitting}
          onClick={() => {
            setSubmitting(true);
            setTimeout(() => go("7.3"), 900);
          }}
        >
          Submit
        </Button>
      </CtaRow>
    </Page>
  );
}

/* ───────────── 7.1 Aadhaar eSign popup ───────────── */

const OTP_SECONDS = 120;

export function ESignModal({ s, set, toast }: Ctx) {
  const [code, setCode] = useState("");
  const [attempts, setAttempts] = useState(3);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [justSigned, setJustSigned] = useState("");
  const [wait, setWait] = useState(OTP_SECONDS);
  const doc = MSA_DOCS[s.signing];
  const locked = attempts === 0;

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const verify = (value = code) => {
    if (busy || locked || wait <= 0 || value.length !== 6) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (value === "000000") {
        const left = attempts - 1;
        setAttempts(left);
        setCode("");
        setError(left ? `That code is incorrect. ${left} ${left === 1 ? "attempt" : "attempts"} left.` : "Too many attempts. Close this and try again in 30 minutes.");
        return;
      }
      const signed = s.signed.map((v, i) => (i === s.signing ? true : v));
      const next = signed.indexOf(false);
      if (next === -1) {
        set({ modal: null, signed });
        toast("All documents signed", "Submit to finish your agreement.");
        return;
      }
      // Carry straight on to the next document with a fresh code, so all three are signed in one go.
      setJustSigned(doc.title);
      setCode("");
      setWait(OTP_SECONDS);
      set({ signed, signing: next });
    }, 900);
  };

  return (
    <OtpModal
      label={`Sign the ${doc.title} with Aadhaar eSign`}
      subtitle="Sent to your Aadhaar-linked mobile number ***** *4821."
      notice={justSigned ? `${justSigned} signed. Enter the new OTP to sign the ${doc.title}.` : undefined}
      inputKey={s.signing}
      value={code}
      onChange={(v) => {
        setCode(v);
        setError("");
        if (v.length === 6) verify(v);
      }}
      error={error}
      secondsLeft={wait}
      canResend={!locked}
      onResend={() => {
        setCode("");
        setError("");
        setWait(OTP_SECONDS);
        toast("New OTP sent", "Check your Aadhaar-linked mobile.");
      }}
      onCancel={() => set({ modal: null })}
      onContinue={() => verify()}
      canContinue={code.length === 6 && wait > 0 && !locked}
      loading={busy}
    />
  );
}

export function MsaSigned({ go }: Ctx) {
  return (
    <SuccessScreen
      title="Agreement signed"
      subtitle="Your MSA is signed and a copy is in your email. Two quick checks left: a live selfie and a short business verification."
      detail={`Signed with Aadhaar eSign · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
      action={{ label: "Verify your face", onClick: () => go("6.8") }}
    />
  );
}

/* ───────────── 8 Sandbox and probation ───────────── */

export function Sandbox({ s, go }: Ctx) {
  return (
    <SuccessScreen
      title="Account approved: sandbox mode"
      subtitle="Test your integration before going live. Live collection opens after your first 10 test transactions."
      detail={`${s.tests} of 10 test transactions · 2 to 3 per day`}
      action={{ label: "Start test payments", onClick: () => go("8.1") }}
    />
  );
}

function Counter({ label, done, current }: { label: string; done: number; current?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="t-14m text-ink">{label}</span>
        <span className="t-14s text-brand">{done} of 10</span>
      </div>
      <SegmentBar total={10} done={done} current={current} />
    </div>
  );
}

export function TestTransactions({ s, set, go, toast }: Ctx) {
  const [running, setRunning] = useState(false);
  const capped = s.today >= 3;
  const run = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      const tests = s.tests + 1;
      set({ tests, today: s.today + 1 });
      toast("₹10 test payment succeeded", `${tests} of 10 done · UPI · just now`);
      if (tests >= 10) go("8.2");
    }, 1300);
  };
  const recent = Array.from({ length: Math.min(s.tests, 3) }, (_, i) => s.tests - i);
  return (
    <Page title="Run your test transactions" subtitle="Use small payments of ₹10 each.">
      <Counter label="Test transactions" done={s.tests} current={s.tests < 10} />
      <SummaryTable
        rows={[
          { label: "Completed", value: `${s.tests} of 10` },
          { label: "Today", value: `${s.today} of 3 used` },
          { label: "Amount", value: "₹10 each" },
        ]}
      />
      {recent.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="t-12s text-ink-2">Recent test payments</p>
          {recent.map((n, i) => (
            <div key={n} className="anim-fade-up flex items-center justify-between rounded-xl bg-surface-variant px-4 py-2.5">
              <span className="t-14r flex items-center gap-2 text-ink">
                <CheckBadge /> Test payment #{n}
              </span>
              <span className="t-12r text-ink-2">₹10 · UPI · {i === 0 ? "just now" : `${i * 7 + 3} min ago`}</span>
            </div>
          ))}
        </div>
      )}
      <Alertish />
      <CtaRow>
        {capped ? (
          <>
            <span className="t-12r mr-auto text-ink-2">Daily limit reached. You can run more tomorrow.</span>
            <Button onClick={() => go("8.2")}>Continue</Button>
          </>
        ) : (
          <Button loading={running} onClick={run}>
            {running ? "Processing payment" : "Run ₹10 test payment"}
          </Button>
        )}
      </CtaRow>
    </Page>
  );
}

function Alertish() {
  return (
    <div role="status" className="flex items-center gap-3 rounded-xl bg-info-container px-4 py-3 text-on-info">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
      </svg>
      <div className="flex flex-1 flex-col gap-1">
        <p className="t-14s">Funds are held for now</p>
        <p className="t-12r">Test amounts sit in a holding account and release after probation.</p>
      </div>
    </div>
  );
}

const LIVE_AMOUNTS = [1240, 560, 2899, 349, 1999, 780, 4250, 1150, 699, 3200];

export function LiveTransactions({ s, set, go, toast }: Ctx) {
  return (
    <Page title="Almost live" subtitle="Your first 10 live payments are monitored.">
      <Counter label="Live transactions" done={s.live} />
      <SummaryTable
        rows={[
          { label: "Completed", value: `${s.live} of 10` },
          { label: "Settlement", value: "Held until probation ends" },
        ]}
      />
      <Actions
        actions={[
          {
            label: "Continue",
            onClick: () => {
              const amt = LIVE_AMOUNTS[s.live % LIVE_AMOUNTS.length].toLocaleString("en-IN");
              if (s.live + 1 >= 10) return go("8.3", { live: 10 });
              set({ live: s.live + 1 });
              toast(`Live payment of ₹${amt} received`, `${s.live + 1} of 10 · settles after probation`);
            },
          },
        ]}
      />
    </Page>
  );
}

export function ProbationComplete({ go }: Ctx) {
  return (
    <SuccessScreen
      confetti
      title="You are live"
      subtitle="Probation is complete. Settlements are now active."
      detail="Settlements reach your bank on the next cycle"
      action={{ label: "Open dashboard", onClick: () => go("8.E1") }}
    />
  );
}

export function ReKyc60({ go }: Ctx) {
  return (
    <StatusScreen
      title="Refresh your KYC"
      subtitle="Due in 60 days."
      tone="info"
      alertTitle="Your KYC is due for renewal"
      alertText="Complete it early to avoid any pause in settlements."
      size="lg"
      actions={[
        { label: "Remind me later", variant: "secondary", onClick: () => go("8.E2") },
        { label: "Start now", onClick: () => go("3.1") },
      ]}
    />
  );
}

export function ReKyc7({ go }: Ctx) {
  return (
    <StatusScreen
      title="Refresh your KYC"
      subtitle="Due in 7 days."
      tone="warning"
      alertTitle="Settlements may pause in 7 days"
      alertText="Update your KYC to keep payouts running."
      actions={[{ label: "Update now", onClick: () => go("3.1") }]}
    />
  );
}

export function LimitReached({ go }: Ctx) {
  return (
    <StatusScreen
      title="Daily test limit reached"
      subtitle="You can run more tests tomorrow."
      tone="warning"
      alertTitle="3 of 3 test payments used today"
      alertText="The limit resets at midnight."
      actions={[{ label: "Back to dashboard", onClick: () => go("8.0") }]}
    />
  );
}


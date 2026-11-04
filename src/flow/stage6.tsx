"use client";

import { useState } from "react";
import {
  Button,
  Checkbox,
  Chip,
  CtaRow,
  DocRow,
  Input,
  Modal,
  ModalArt,
  ModalHeader,
  SummaryTable,
  type Tone,
} from "@/components/ui/ds";
import { AlertBadge, CheckBadge, FileText, Pencil } from "@/components/ui/icons";
import { Page } from "@/components/shell";
import { Actions, StatusScreen, SuccessScreen, acceptFile, supportMail, useFilePicker, type Ctx } from "./common";
import { resolveIfsc, maskAcct } from "./stage4";
import { ResultIcon, VerifyScreen } from "./process";
import { initialState, type Collection, type FlowState, type Modal as ModalId } from "./state";

/* ───────────── 6.0 Review and submit ───────────── */

function stakeholderSummary(s: FlowState) {
  if (s.record?.entity === "individual") return "1 applicant";
  const directors = s.people.filter((p) => /director|partner/i.test(p.role)).length;
  const owners = s.people.length - directors;
  const part = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  return [directors && part(directors, "director", "directors"), owners && part(owners, "UBO", "UBOs")].filter(Boolean).join(", ");
}

export function storefrontSummary(s: FlowState) {
  const host = (u: string) => {
    try {
      return new URL(u).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  };
  // Empty when a chosen method still needs its link, so review flags it as missing.
  if (s.collections.length === 0) return "";
  if (s.collections.includes("web") && !host(s.site)) return "";
  if (s.collections.includes("app") && !host(s.app)) return "";
  const parts: Record<Collection, string> = {
    web: host(s.site),
    app: "Mobile app",
    links: "Payment links",
    qr: "QR codes",
  };
  return (["web", "app", "links", "qr"] as const)
    .filter((c) => s.collections.includes(c))
    .map((c) => parts[c])
    .join(", ");
}

function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={`Edit ${label}`}
      onClick={onClick}
      className="-my-1 ml-1 flex size-7 items-center justify-center rounded-full text-ink-2 hover:bg-container hover:text-ink"
    >
      <Pencil size={16} />
    </button>
  );
}

export function ReviewSubmit({ s, set, go }: Ctx) {
  const [submitting, setSubmitting] = useState(false);
  const ifsc = resolveIfsc(s.ifsc);
  const store = storefrontSummary(s);
  const rows: { label: string; value: string; modal: ModalId }[] = [
    { label: "Business", value: s.record?.displayName ?? "", modal: "edit-business" },
    { label: "PAN", value: s.pan ? `${s.pan.slice(0, 5)}••••${s.pan.slice(-1)}` : "", modal: "edit-pan" },
    { label: "Stakeholders", value: stakeholderSummary(s), modal: "edit-stakeholders" },
    {
      label: "Settlement bank",
      value: s.acct ? `${ifsc.state === "ok" ? ifsc.bank.short : "Bank"} ${maskAcct(s.acct)}` : "",
      modal: "edit-bank",
    },
    { label: "Storefront", value: store, modal: "edit-storefront" },
  ];
  const missing = rows.some((r) => !r.value);
  const complete = rows.filter((r) => r.value).length;
  return (
    <Page title="Review and submit" subtitle="Check the details once. You can edit any section.">
      <p className={`t-12s flex items-center gap-2 ${missing ? "text-on-warning" : "text-on-success"}`} role="status">
        {missing ? <AlertBadge /> : <CheckBadge />}
        {missing ? `${complete} of ${rows.length} sections complete` : "Everything is filled in. Takes under a minute to check."}
      </p>
      <SummaryTable
        rows={rows.map((r) => ({
          label: r.label,
          value: r.value || "Missing",
          tone: r.value ? undefined : "warning",
          action: <EditButton label={r.label} onClick={() => set({ modal: r.modal })} />,
        }))}
      />
      <Checkbox checked={s.confirm} onChange={(confirm) => set({ confirm })}>
        I confirm that the details above are accurate and I am authorised to submit them.
      </Checkbox>
      <CtaRow>
        <Button
          disabled={!s.confirm}
          loading={submitting}
          onClick={() => {
            if (missing) return go("6.E1");
            setSubmitting(true);
            setTimeout(() => go("7.0", { signed: [false, false, false] }), 700);
          }}
        >
          {submitting ? "Saving" : "Continue to sign"}
        </Button>
      </CtaRow>
    </Page>
  );
}

/* ───────────── 6.0.1 – 6.0.5 Edit popups ───────────── */

function EditShell({
  title,
  subtitle,
  onClose,
  children,
  cta = "Save changes",
  onSave,
  disabled,
  loading,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
  cta?: string;
  onSave: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Modal open label={title} onClose={onClose}>
      <ModalHeader title={title} subtitle={subtitle} />
      <ModalArt src="/figma/art-edit.png" />
      {children}
      <CtaRow>
        <Button disabled={disabled} loading={loading} onClick={onSave}>
          {cta}
        </Button>
      </CtaRow>
    </Modal>
  );
}

export function EditBusiness({ s, set, toast }: Ctx) {
  const rec = s.record;
  const [f, setF] = useState({ name: rec?.displayName ?? "", reg: s.reg, office: rec?.office ?? "" });
  const close = () => set({ modal: null });
  return (
    <EditShell
      title="Edit business details"
      subtitle="Changes here may need a quick re-check by our team."
      onClose={close}
      disabled={!f.name.trim()}
      onSave={() => {
        set({ modal: null, reg: f.reg, record: rec && { ...rec, displayName: f.name.trim(), office: f.office } });
        toast("Business details updated");
      }}
    >
      <Input label="Legal name" value={f.name} onChange={(name) => setF({ ...f, name })} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input label={rec?.entity === "llp" ? "LLPIN" : "CIN"} value={f.reg} onChange={(reg) => setF({ ...f, reg: reg.toUpperCase() })} />
        <Input label="Registered office" value={f.office} onChange={(office) => setF({ ...f, office })} />
      </div>
    </EditShell>
  );
}

export function EditPan({ s, set }: Ctx) {
  const [pan, setPan] = useState(s.pan);
  const [name, setName] = useState(s.record?.name ?? "");
  const changed = pan !== s.pan;
  return (
    <EditShell
      title="Edit PAN"
      subtitle="Changing your PAN restarts verification."
      onClose={() => set({ modal: null })}
      disabled={pan.length !== 10}
      onSave={() =>
        changed
          ? set({ ...initialState(), pan, screen: "2.0", history: [] })
          : set({ modal: null, record: s.record && { ...s.record, name } })
      }
      cta={changed ? "Save and verify again" : "Save changes"}
    >
      <Input
        label="PAN number"
        value={pan}
        maxLength={10}
        onChange={(v) => setPan(v.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
        help={changed ? "You will verify the new PAN and the steps after it again." : undefined}
      />
      <Input label="Name on PAN" value={name} onChange={setName} readOnly={changed} />
    </EditShell>
  );
}

export function EditStakeholders({ s, set, toast }: Ctx) {
  const [people, setPeople] = useState(s.people);
  const label = (role: string) => (/director/i.test(role) ? "Director" : /partner/i.test(role) ? "Partner" : "Beneficial owner");
  return (
    <EditShell
      title="Edit stakeholders"
      subtitle="Update names or invite someone else to complete KYC."
      onClose={() => set({ modal: null })}
      disabled={people.some((p) => !p.name.trim())}
      onSave={() => {
        set({ modal: null, people });
        toast("Stakeholders updated");
      }}
    >
      {people.map((p, i) => (
        <Input
          key={p.id}
          label={label(p.role)}
          value={p.name}
          onChange={(name) => setPeople(people.map((x, j) => (j === i ? { ...x, name } : x)))}
        />
      ))}
      <div>
        <Button variant="secondary" size="sm" onClick={() => set({ modal: "invite" })}>
          Invite someone else
        </Button>
      </div>
    </EditShell>
  );
}

export function EditBank({ s, set, toast }: Ctx) {
  const [f, setF] = useState({ acct: s.acct, ifsc: s.ifsc, holder: s.holder });
  const [busy, setBusy] = useState(false);
  const ifsc = resolveIfsc(f.ifsc);
  return (
    <EditShell
      title="Edit settlement bank"
      subtitle="We will verify the new account with a small deposit."
      onClose={() => set({ modal: null })}
      cta="Verify"
      loading={busy}
      disabled={!/^[0-9]{9,18}$/.test(f.acct) || ifsc.state !== "ok"}
      onSave={() => {
        setBusy(true);
        setTimeout(() => {
          set({ modal: null, acct: f.acct, acct2: f.acct, ifsc: f.ifsc, holder: f.holder });
          toast("New account verified", `Settlements will go to ••••${f.acct.slice(-4)}.`);
        }, 1500);
      }}
    >
      <Input label="Account number" inputMode="numeric" value={f.acct} onChange={(v) => setF({ ...f, acct: v.replace(/\D/g, "") })} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          label="IFSC"
          maxLength={11}
          value={f.ifsc}
          onChange={(v) => setF({ ...f, ifsc: v.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
          error={ifsc.state === "bad" ? "We could not find this IFSC." : undefined}
        />
        <Input label="Account holder name" value={f.holder} onChange={(holder) => setF({ ...f, holder })} placeholder="As printed on the cheque" />
      </div>
    </EditShell>
  );
}

export function EditStorefront({ s, set, toast }: Ctx) {
  const [f, setF] = useState({ site: s.site, app: s.app, link: s.payLink });
  return (
    <EditShell
      title="Edit storefront"
      subtitle="Update where customers will pay you."
      onClose={() => set({ modal: null })}
      disabled={!f.site && !f.app && !f.link && !s.collections.includes("qr")}
      onSave={() => {
        // Filled fields switch their method on; cleared ones switch it off. QR has no link and stays as chosen.
        const on: Record<Collection, boolean> = {
          web: !!f.site.trim(),
          app: !!f.app.trim(),
          links: !!f.link.trim() || (s.collections.includes("links") && !s.payLink),
          qr: s.collections.includes("qr"),
        };
        set({
          modal: null,
          site: f.site.trim(),
          app: f.app.trim(),
          payLink: f.link.trim(),
          collections: (["web", "app", "links", "qr"] as const).filter((c) => on[c]),
        });
        toast("Storefront updated");
      }}
    >
      <Input label="Website address" inputMode="url" value={f.site} onChange={(site) => setF({ ...f, site })} placeholder="https://" />
      <Input label="App link (optional)" inputMode="url" value={f.app} onChange={(app) => setF({ ...f, app })} placeholder="Add your app link" />
      <Input label="Payment link (optional)" inputMode="url" value={f.link} onChange={(link) => setF({ ...f, link })} placeholder="Add a payment link" />
    </EditShell>
  );
}

/* ───────────── 6.E1 and screening ───────────── */

export function MissingItem({ go }: Ctx) {
  return (
    <StatusScreen
      title="Finish one more step"
      subtitle="We cannot submit yet."
      tone="warning"
      alertTitle="Storefront details are missing"
      alertText="Add your website or app link to submit."
      actions={[{ label: "Complete now", onClick: () => go("5.0") }]}
    />
  );
}

function StatusRow({ icon, title, sub, chip, tone }: { icon: React.ReactNode; title: string; sub: string; chip: string; tone: Tone }) {
  return <DocRow variant="neutral" icon={icon} title={title} description={sub} trailing={<Chip tone={tone}>{chip}</Chip>} />;
}

export function Screening({ replace }: Ctx) {
  return (
    <VerifyScreen
      title="We are verifying your details"
      steps={[
        { label: "Checking your identity and PAN", ms: 1200 },
        { label: "Checking your bank account", ms: 1300 },
        { label: "Running business checks", ms: 900 },
      ]}
      note="We will email you as soon as there is a decision."
      onDone={() => replace("6.2")}
    />
  );
}

export function Submitted({ go }: Ctx) {
  return (
    <SuccessScreen
      title="Application submitted"
      subtitle="We will update you here and by email."
      detail="Reference ID PWZ-2026-48213"
      copy="PWZ-2026-48213"
      action={{ label: "Go to dashboard", onClick: () => go("6.5") }}
    />
  );
}

export function AdditionalVerification({ go }: Ctx) {
  return (
    <StatusScreen
      title="We need a little more time"
      subtitle="Your application needs an extra check."
      tone="info"
      alertTitle="Additional verification in progress"
      alertText="No action is needed from you right now. We will email you within 2 business days."
      actions={[{ label: "Go to dashboard", onClick: () => go("6.5") }]}
    />
  );
}

export function DocumentDeficiency({ set, go }: Ctx) {
  const [open, input] = useFilePicker((f) => {
    const d = acceptFile(f);
    set({ bankProof: d });
    if (d.status === "uploaded") go("6.1");
  });
  return (
    <Page title="One document needs attention" subtitle="Please upload a clearer copy." icon={<ResultIcon tone="warning" />}>
      {input}
      <StatusRow icon={<FileText size={20} />} title="Cancelled cheque or statement" sub="Rejected: image unclear" chip="Rejected" tone="error" />
      <AlertSlim>Upload a clear, full-page copy. We will resume the review right away.</AlertSlim>
      <Actions actions={[{ label: "Upload document", onClick: open }]} />
    </Page>
  );
}

function AlertSlim({ children }: { children: React.ReactNode }) {
  // Warning alert without a title, as used on 6.4.
  return (
    <div role="alert" className="flex items-center gap-3 rounded-xl bg-warning-container px-4 py-3 text-on-warning">
      <span className="t-12r flex-1">{children}</span>
    </div>
  );
}



export function CpvNotCompleted({ go }: Ctx) {
  return (
    <StatusScreen
      title="We could not complete your business verification"
      subtitle="We were unable to finish this check."
      tone="warning"
      alertTitle="Full access is on hold"
      alertText="Our team will email you with what is needed. You do not need to do anything until then."
      actions={[{ label: "Go to dashboard", onClick: () => go("6.5") }]}
    />
  );
}

export function UnableToProceed() {
  return (
    <StatusScreen
      title="We cannot proceed"
      subtitle="We are unable to open an account for this application."
      tone="error"
      alertTitle="Application closed"
      alertText="This decision is final for this application. You can write to support for general queries."
      actions={[{ label: "Contact support", onClick: () => supportMail("Application closed") }]}
    />
  );
}

export function Rejected({ go }: Ctx) {
  return (
    <StatusScreen
      title="Application not approved"
      subtitle="We could not approve this application."
      tone="error"
      alertTitle="Not approved this time"
      alertText="You can correct your details and apply again after 30 days."
      actions={[{ label: "Review and reapply", onClick: () => go("6.0", { confirm: false }) }]}
    />
  );
}

export function Approved({ go }: Ctx) {
  return (
    <SuccessScreen
      confetti
      title="You are approved"
      subtitle="Your business verification is complete. Start with test payments; live collection opens after 10 of them."
      detail="Reference ID PWZ-2026-48213"
      copy="PWZ-2026-48213"
      action={{ label: "Go to sandbox", onClick: () => go("8.0", { limited: false }) }}
    />
  );
}

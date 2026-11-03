"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  CtaRow,
  DocRow,
  FieldHelp,
  Input,
  Modal,
  ModalHeader,
  OptionRow,
  Select,
  SummaryTable,
} from "@/components/ui/ds";
import { Building, CheckBadge, FileCheck, FileText, Globe, IdCard, Briefcase, ShieldCheck, Smartphone } from "@/components/ui/icons";
import { Page } from "@/components/shell";
import { LINES_OF_BUSINESS, LOB_DOC, PAN_ERRORS, PAN_PATTERN, lookupPan, requiredDocs, type DocSpec } from "./data";
import { Actions, StatusScreen, UploadRow, acceptFile, startUpload, supportMail, useFilePicker, type Ctx } from "./common";
import { MISSING, initialState, type DocState } from "./state";
import { PanCard } from "./PanCard";
import { ProcessView, ScanArt } from "./process";

/* ───────────── 2.0 PAN entry, GST and CIN selection ───────────── */

export function PanEntry({ s, set, go, toast }: Ctx) {
  const [checking, setChecking] = useState(false);
  const rec = s.record;
  const verified = !!rec;

  // Verify on its own once a well-formed PAN is in; the Verify link stays for anyone who prefers it.
  useEffect(() => {
    if (s.pan.length === 10 && PAN_PATTERN.test(s.pan) && !rec && !s.panError && !checking) {
      const t = setTimeout(verify, 350);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.pan]);

  const verify = () => {
    // Read the field itself: text typed before the page finished loading, or autofilled,
    // can be on screen without having reached state yet.
    const dom = document.querySelector<HTMLInputElement>('input[name="pan"]')?.value ?? "";
    const pan = (s.pan || dom).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!pan) return set({ panError: "E1" });
    if (pan !== s.pan) set({ pan });
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      const r = lookupPan(pan);
      if (!r.ok) return set({ panError: r.code, record: null });
      const only = (o: typeof r.record.gsts) => (o.length === 1 ? o[0].value : "");
      set({ panError: "", record: r.record, gst: only(r.record.gsts), reg: only(r.record.regs) });
      toast("PAN verified", `${r.record.displayName} · matched with Income Tax records`);
    }, 1100);
  };

  const showGst = verified && rec.entity !== "individual" && rec.gsts.length > 0;
  const showReg = verified && (rec.entity === "company" || rec.entity === "llp") && rec.regs.length > 0;
  const regLabel = rec?.entity === "llp" ? "LLPIN" : "CIN";
  const single = showGst && rec.gsts.length === 1 && (!showReg || rec.regs.length === 1);

  const ready = verified && (!showGst || !!s.gst) && (!showReg || !!s.reg);

  let help = "";
  if (verified && rec.entity === "firm") help = "CIN is not applicable for this business type. We verify the firm with its PAN and deed.";
  else if (verified && rec.entity === "llp") help = "LLPIN fetched from MCA. Companies use a CIN instead.";
  else if (single) help = "Only one GST and one CIN are linked to this PAN, so we filled them in for you.";
  else if (showGst && (!s.gst || !showReg))
    help = `${rec.gsts.length} GST numbers found for this PAN. Choose the one you will collect payments against.`;
  else if (showReg && rec.regs.length > 1) help = `${rec.regs.length} CINs are linked to this PAN. Pick the company you are onboarding.`;

  const onContinue = () => {
    if (!rec) return;
    if (rec.entity === "individual") return set({ modal: "confirm-individual" });
    if (rec.mca === "down") return go("2.1A.E1");
    if (rec.mca === "struck-off") return go("2.1A.E3");
    if (rec.mca === "no-gst") return go("2.1A.E2");
    set({ modal: "confirm-company" });
  };

  const gstField = (wide: boolean) =>
    rec!.gsts.length === 1 ? (
      <Input label="GST number" value={s.gst} readOnly />
    ) : (
      <Select
        label="GST number"
        value={s.gst}
        onChange={(gst) => set({ gst })}
        options={rec!.gsts}
        placeholder="Select GST number"
        key={wide ? "w" : "n"}
      />
    );

  return (
    <Page title="Enter your PAN" subtitle="Company, firm, LLP or individual. We work out the rest.">
      <div className="flex w-full flex-col gap-1.5">
        <Input
          label="PAN"
          name="pan"
          value={s.pan}
          maxLength={10}
          autoFocus
          success={verified}
          error={s.panError ? PAN_ERRORS[s.panError] : undefined}
          onChange={(v) =>
            set({ pan: v.toUpperCase().replace(/[^A-Z0-9]/g, ""), panError: "", record: null, gst: "", reg: "" })
          }
          onEnter={verified ? undefined : verify}
          placeholder="Enter your 10-character PAN"
          help={verified ? undefined : "Business or individual PAN. Letters are capitalised for you."}
          trailing={
            verified ? (
              <CheckBadge size={18} />
            ) : checking ? (
              <span className="t-14s flex shrink-0 items-center gap-2 text-brand" role="status">
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Verifying
              </span>
            ) : (
              <button type="button" onClick={verify} className="t-14s shrink-0 text-brand underline">
                Verify
              </button>
            )
          }
        />
        {verified && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1" role="status">
            <CheckBadge />
            <span className="t-12r text-ink-2">Successfully verified PAN for</span>
            <span className="t-12s text-ink">{rec.name}</span>
          </p>
        )}
      </div>

      {checking && (
        <div className="flex flex-col gap-2 pt-1" aria-hidden="true">
          <div className="h-[168px] w-[276px] animate-pulse rounded-xl bg-container" />
          <p className="t-12r text-ink-2">Checking with the Income Tax Department…</p>
        </div>
      )}
      {verified && (
        <>
          <div className="pt-1">
            <PanCard name={rec.name} pan={s.pan} />
          </div>
          {(showGst || showReg) && (
            <div className="flex w-full flex-col gap-3">
              <div className="flex w-full flex-col gap-3 sm:flex-row">
                {showGst && <div className="min-w-0 flex-1">{gstField(!showReg)}</div>}
                {showReg && (
                  <div className="min-w-0 flex-1">
                    {rec.regs.length === 1 ? (
                      <Input label={regLabel} value={s.reg} readOnly />
                    ) : (
                      <Select
                        label={regLabel}
                        value={s.reg}
                        onChange={(reg) => set({ reg })}
                        options={rec.regs}
                        placeholder={`Select ${regLabel} number`}
                      />
                    )}
                  </div>
                )}
              </div>
              {help && <FieldHelp>{help}</FieldHelp>}
            </div>
          )}
        </>
      )}

      <div className="pt-2">
        <CtaRow>
          <Button disabled={!ready} onClick={onContinue}>
            Continue
          </Button>
        </CtaRow>
      </div>
    </Page>
  );
}

/* ───────────── 2.1A Confirm company (popup) ───────────── */

export function ConfirmCompanyModal({ s, set, go, toast }: Ctx) {
  const rec = s.record;
  if (!rec) return null;
  const kind = rec.entity === "llp" ? "LLP" : rec.entity === "firm" ? "firm" : "company";
  const rows = [
    { label: "Legal name", value: rec.displayName },
    ...(rec.entity === "company" ? [{ label: "CIN", value: s.reg }] : []),
    ...(rec.entity === "llp" ? [{ label: "LLPIN", value: s.reg }] : []),
    ...(rec.entity === "firm" ? [{ label: "GSTIN", value: s.gst }] : []),
    { label: rec.entity === "firm" ? "Date of registration" : "Date of incorporation", value: rec.incorporated ?? "" },
    { label: "Registered office", value: rec.office ?? "" },
  ];
  return (
    <Modal open label={`Confirm your ${kind}`} onClose={() => set({ modal: null })}>
      <ModalHeader
        large
        chip="Fetched from your PAN"
        title={`Confirm your ${kind}`}
        subtitle={rec.entity === "firm" ? "Read-only. Fetched from PAN and GST records." : "Read-only. Fetched from MCA records."}
      />
      <SummaryTable rows={rows} />
      <Button
        full
        onClick={() => {
          go("2.2A", { modal: null });
          toast(`${kind[0].toUpperCase()}${kind.slice(1)} details confirmed`, "Next, add your documents.");
        }}
      >
        I acknowledge
      </Button>
    </Modal>
  );
}

/* ───────────── 2.1B Confirm individual details (popup) ───────────── */

export function ConfirmIndividualModal({ s, set, go, toast }: Ctx) {
  const rec = s.record;
  const [editing, setEditing] = useState(false);
  if (!rec) return null;
  const gst = rec.gsts[0]?.value;
  const mismatch = s.nameMismatch && s.signupName.trim().toLowerCase() !== rec.displayName.toLowerCase();
  return (
    <Modal open label="Confirm your details" onClose={() => set({ modal: null })}>
      <ModalHeader
        large
        chip="Fetched from your PAN"
        title="Confirm your details"
        subtitle="Matched with NSDL. Company records are not needed."
      />
      <SummaryTable
        rows={[
          { label: "Legal name", value: rec.displayName },
          { label: "Date of birth", value: rec.dob ?? "" },
          {
            label: "PAN status",
            value: (
              <span className="flex items-center gap-2">
                <CheckBadge />
                Active
              </span>
            ),
          },
          { label: "Source", value: "NSDL and Income Tax records" },
        ]}
      />
      {mismatch && (
        <>
          <Alert tone="warning" title="Your name does not match your PAN" dismissible={false}>
            You signed up as {s.signupName}. Your PAN says {rec.displayName}.
          </Alert>
          {editing ? (
            <Input label="Your name" value={s.signupName} onChange={(signupName) => set({ signupName })} help="Enter it exactly as it appears on your PAN." />
          ) : (
            <CtaRow>
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Edit name
              </Button>
              <Button onClick={() => set({ signupName: rec.displayName, nameMismatch: false })}>Use PAN name</Button>
            </CtaRow>
          )}
        </>
      )}
      {gst && (
        <Checkbox checked={s.includeGst} onChange={(includeGst) => set({ includeGst, gst: includeGst ? gst : "" })}>
          Include GSTIN {gst} found under this PAN (optional)
        </Checkbox>
      )}
      <Button
        full
        disabled={mismatch}
        onClick={() => {
          go("2.2B", { modal: null, gst: s.includeGst ? (gst ?? "") : "" });
          toast("Identity confirmed", "Next, verify your address.");
        }}
      >
        I acknowledge
      </Button>
    </Modal>
  );
}

/* ───────────── 2.1A error states ───────────── */

export function McaFailed({ s, set, go }: Ctx) {
  const [busy, setBusy] = useState(false);
  return (
    <StatusScreen
      title="We could not reach MCA"
      subtitle="Your details are safe. Nothing was lost."
      tone="warning"
      alertTitle="The records service is not responding"
      alertText="Try again, or enter the details yourself and we will verify them."
      actions={[
        { label: "Enter manually", variant: "secondary", onClick: () => go("2.1A.M") },
        {
          label: busy ? "Trying…" : "Try again",
          disabled: busy,
          onClick: () => {
            setBusy(true);
            setTimeout(() => {
              setBusy(false);
              set({ record: s.record && { ...s.record, mca: undefined }, modal: "confirm-company" });
            }, 900);
          },
        },
      ]}
    />
  );
}

export function ManualCompany({ s, go }: Ctx) {
  const [f, setF] = useState({ name: s.record?.displayName ?? "", cin: s.reg, doi: "", office: "" });
  const ok = f.name && f.cin.length >= 8 && f.doi && f.office;
  return (
    <Page title="Enter your company details" subtitle="We will verify these with MCA once it is back.">
      <Input label="Legal name" value={f.name} onChange={(name) => setF({ ...f, name })} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input label="CIN" value={f.cin} onChange={(cin) => setF({ ...f, cin: cin.toUpperCase() })} placeholder="U74999KA2018PTC123456" />
        <Input label="Date of incorporation" type="date" value={f.doi} onChange={(doi) => setF({ ...f, doi })} />
      </div>
      <Input label="Registered office" value={f.office} onChange={(office) => setF({ ...f, office })} placeholder="Street, city and PIN code" />
      <Actions actions={[{ label: "Continue", disabled: !ok, onClick: () => go("2.2A") }]} />
    </Page>
  );
}

export function NoGstin({ set, go }: Ctx) {
  return (
    <StatusScreen
      title="No GSTIN under this PAN"
      subtitle="GST is optional for some businesses."
      tone="info"
      alertTitle="We found no active GSTIN"
      alertText="If you are registered, add the GSTIN yourself."
      actions={[
        { label: "Add a GSTIN", variant: "secondary", onClick: () => go("2.1A.G") },
        { label: "Continue without GST", onClick: () => set({ noGst: true, gst: "", modal: "confirm-company" }) },
      ]}
    />
  );
}

export function AddGstin({ s, set }: Ctx) {
  const [gst, setGst] = useState("");
  const valid = /^[0-9]{2}[A-Z0-9]{13}$/.test(gst) && gst.slice(2, 12) === s.pan;
  const [err, setErr] = useState("");
  return (
    <Page title="Add your GSTIN" subtitle="It must be registered under the same PAN.">
      <Input
        label="GSTIN"
        value={gst}
        maxLength={15}
        error={err || undefined}
        onChange={(v) => {
          setGst(v.toUpperCase().replace(/[^A-Z0-9]/g, ""));
          setErr("");
        }}
        placeholder={`29${s.pan || "AAACN1234Q"}1Z5`}
        help="15 characters. The middle ten are your PAN."
      />
      <Actions
        actions={[
          {
            label: "Continue",
            disabled: gst.length !== 15,
            onClick: () => (valid ? set({ gst, noGst: false, modal: "confirm-company" }) : setErr("This GSTIN is not linked to your PAN.")),
          },
        ]}
      />
    </Page>
  );
}

export function CompanyInactive({ set }: Ctx) {
  return (
    <StatusScreen
      title="This company is not active"
      subtitle="MCA shows it as struck off."
      tone="error"
      alertTitle="Struck off"
      alertText="We can only onboard active companies and LLPs. Restore it with MCA first."
      actions={[
        { label: "Use a different PAN", variant: "secondary", onClick: () => set({ ...initialState() }) },
        { label: "Contact support", onClick: () => supportMail("Company shown as struck off") },
      ]}
    />
  );
}

/* ───────────── 2.2A Mandatory documents ───────────── */

export function MandatoryDocs({ s, set, go, update, toast }: Ctx) {
  const [submitting, setSubmitting] = useState(false);
  const entity = s.record?.entity ?? "company";
  const base = requiredDocs(entity);
  const extra = LOB_DOC[s.lob];
  const all = extra ? [...base, extra] : base;
  const doc = (k: string) => s.docs[k] ?? MISSING;
  const pick = (k: string) => (files: File[]) =>
    startUpload(files[0], (d) => update((p) => ({ docs: { ...p.docs, [k]: d } })));
  const added = all.filter((d) => doc(d.key).status === "uploaded").length;
  const ready = !!s.lob && added === all.length;
  const subtitle = extra
    ? extra.subtitle
    : entity === "llp"
      ? "For an LLP, the agreement replaces the Certificate of Incorporation."
      : entity === "firm"
        ? "Two documents for every firm. More depend on what you sell."
        : "Two documents for every company. More depend on what you sell.";
  const row = (d: DocSpec) => <UploadRow key={d.key} title={d.title} hint={d.hint} doc={doc(d.key)} onPick={pick(d.key)} empty="required" />;

  return (
    <Page title="Add the mandatory documents" subtitle={subtitle}>
      {base.map(row)}
      <Select
        label="Line of business"
        value={s.lob}
        onChange={(lob) => set({ lob })}
        options={LINES_OF_BUSINESS}
        placeholder="Select line of business"
        help={s.lob ? undefined : "Some categories need one more licence. We will ask for it here."}
      />
      {extra && row(extra)}
      <CtaRow>
        <Button
          disabled={!ready}
          loading={submitting}
          onClick={() => {
            setSubmitting(true);
            setTimeout(() => {
              go("3.0");
              toast("Documents submitted", "We check them in the background while you continue.");
            }, 900);
          }}
        >
          Continue
        </Button>
      </CtaRow>
    </Page>
  );
}

export function ResolutionNotSigned({ s, set, replace }: Ctx) {
  const [a, b] = requiredDocs(s.record?.entity ?? "company");
  const [open, input] = useFilePicker((f) => {
    const d = acceptFile(f);
    set({ docs: { ...s.docs, [b.key]: d } });
    if (d.status === "uploaded") replace("2.2A");
  });
  const template = () => {
    const blob = new Blob(
      [
        `${b.title.toUpperCase()}\n\nRESOLVED THAT ${s.record?.displayName ?? "the company"} is authorised to open a payment gateway account with Paywize, and that the signatories below may act for it.\n\nSigned by the designated directors:\n\n1. ______________________   DIN ________\n2. ______________________   DIN ________\n`,
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    el.download = "Board_resolution_template.txt";
    el.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Page title="Add the mandatory documents" subtitle="Two documents for every company.">
      {input}
      <DocRow variant="neutral" icon={<Building size={20} />} title={a.title} description="Verified" trailing={<Chip tone="success">Verified</Chip>} />
      <DocRow
        variant="neutral"
        icon={<Building size={20} />}
        title={b.title}
        description="Signature of a designated director is missing"
        trailing={<Chip tone="error">Rejected</Chip>}
      />
      <Actions
        actions={[
          { label: "Download template", variant: "secondary", onClick: template },
          { label: "Upload signed copy", onClick: open },
        ]}
      />
    </Page>
  );
}

export function DocNotReadable({ s, set, replace }: Ctx) {
  const [a, b] = requiredDocs(s.record?.entity ?? "company");
  const [open, input] = useFilePicker((f) => {
    const d = acceptFile(f);
    set({ docs: { ...s.docs, [a.key]: d } });
    if (d.status === "uploaded") replace("2.2A");
  });
  return (
    <Page title="Add the mandatory documents" subtitle="Two documents for every company.">
      {input}
      <DocRow variant="error" title={a.title} description="The page is cropped. Scan every edge." />
      <DocRow variant="neutral" icon={<Building size={20} />} title={b.title} description="In review" trailing={<Chip tone="info">In review</Chip>} />
      <Actions actions={[{ label: "Upload again", onClick: open }]} />
    </Page>
  );
}

/* ───────────── 2.2B Address proof and proof of business ───────────── */

const ADDRESS_METHODS = [
  { value: "digilocker", title: "DigiLocker", desc: "Fastest. Fetches your address securely", icon: <Smartphone size={20} /> },
  { value: "passport", title: "Passport", desc: "Upload the front and back", icon: <ShieldCheck size={20} /> },
  { value: "dl", title: "Driving licence", desc: "Upload the front and back", icon: <ShieldCheck size={20} /> },
  { value: "voter", title: "Voter ID", desc: "Upload the front and back", icon: <ShieldCheck size={20} /> },
];

export function AddressMethod({ s, set, go }: Ctx) {
  return (
    <Page title="Verify your address" subtitle="Use an official valid document.">
      <div role="radiogroup" aria-label="Address proof" className="flex flex-col gap-3">
        {ADDRESS_METHODS.map((m) => (
          <OptionRow
            key={m.value}
            name="addr"
            icon={m.icon}
            title={m.title}
            description={m.desc}
            checked={s.addrMethod === m.value}
            onSelect={() => set({ addrMethod: m.value })}
          />
        ))}
      </div>
      <Actions actions={[{ label: "Continue", onClick: () => go(s.addrMethod === "digilocker" ? "2.2B.1" : "2.2B.2") }]} />
    </Page>
  );
}

export function DigiLockerConsent({ go }: Ctx) {
  return (
    <Page title="Share your address securely" subtitle="You will sign in to DigiLocker and approve what we see.">
      <SummaryTable
        rows={[
          { label: "We receive", value: "Name, date of birth and address" },
          { label: "We never see", value: "Your Aadhaar number" },
        ]}
      />
      <p className="t-12r flex items-center gap-2 text-ink-2">
        <ShieldCheck size={16} />
        Government-run and consent-based. You can revoke access in DigiLocker any time.
      </p>
      <Actions actions={[{ label: "Continue to DigiLocker", onClick: () => go("2.2B.F") }]} />
    </Page>
  );
}

/** Live fetch from DigiLocker after consent. */
export function DigiLockerFetch({ replace, toast }: Ctx) {
  return (
    <Page title="Fetching your address" subtitle="Approve the request in DigiLocker. We will pick it up here.">
      <ProcessView
        art={<ScanArt />}
        steps={[
          { label: "Opening DigiLocker securely", ms: 900 },
          { label: "Waiting for your approval", ms: 1400 },
          { label: "Reading your address", ms: 900 },
        ]}
        footnote="Usually about 5 seconds. Keep this page open."
        onDone={() => {
          replace("2.2B.3");
          toast("Address verified", "Fetched from DigiLocker.");
        }}
      />
    </Page>
  );
}

export function DigiLockerFailed({ go }: Ctx) {
  return (
    <StatusScreen
      title="DigiLocker did not respond"
      subtitle="Nothing was shared."
      tone="warning"
      alertTitle="We could not reach DigiLocker"
      alertText="Try again, or upload your document instead."
      actions={[
        { label: "Upload instead", variant: "secondary", onClick: () => go("2.2B.2", { addrMethod: "passport" }) },
        { label: "Try again", onClick: () => go("2.2B.1") },
      ]}
    />
  );
}

export function UploadAddressDoc({ s, go, update }: Ctx) {
  const pick = (k: "front" | "back") => (files: File[]) =>
    startUpload(files[0], (d) => update((p) => ({ addrDocs: { ...p.addrDocs, [k]: d } })));
  const ready = s.addrDocs.front?.status === "uploaded" && s.addrDocs.back?.status === "uploaded";
  const hint = "PDF, JPG or PNG up to 5 MB. Make sure all four corners are visible.";
  return (
    <Page title="Upload your document" subtitle="Passport, driving licence or voter ID.">
      <UploadRow title="Front of the document" hint={hint} doc={s.addrDocs.front ?? MISSING} onPick={pick("front")} />
      <UploadRow title="Back of the document" hint={hint} doc={s.addrDocs.back ?? MISSING} onPick={pick("back")} />
      <Actions actions={[{ label: "Continue", disabled: !ready, onClick: () => go("2.2B.3") }]} />
    </Page>
  );
}

const PROOFS = [
  { value: "udyam", title: "Udyam or MSME certificate", desc: "Registered with the Ministry of MSME", icon: <Briefcase size={20} /> },
  { value: "professional", title: "Professional registration", desc: "Bar Council, ICAI, Medical or Architecture council", icon: <IdCard size={20} /> },
  { value: "engagement", title: "Client engagement proof", desc: "Agreement, work order or recent invoices", icon: <FileText size={20} /> },
  { value: "portfolio", title: "Portfolio or marketplace profile", desc: "GitHub, Behance, Upwork or your own site", icon: <Globe size={20} /> },
];

export function ProofOfBusiness({ s, set, go }: Ctx) {
  return (
    <Page title="Show how you do business" subtitle="Any one of these will do.">
      {s.proofError && (
        <Alert tone="error" title="Pick one to continue">
          We need one proof so that we can keep accounts safe from misuse.
        </Alert>
      )}
      <div role="radiogroup" aria-label="Proof of doing business" className="flex flex-col gap-3">
        {PROOFS.map((p) => (
          <OptionRow
            key={p.value}
            name="proof"
            icon={p.icon}
            title={p.title}
            description={p.desc}
            checked={s.proof === p.value}
            onSelect={() => set({ proof: p.value, proofError: false })}
          />
        ))}
      </div>
      <Actions
        actions={[
          {
            label: "Continue",
            disabled: s.proofError,
            onClick: () => (s.proof ? go(s.proof === "portfolio" ? "2.2B.4" : "2.2B.5") : set({ proofError: true })),
          },
        ]}
      />
    </Page>
  );
}

export function PortfolioLink({ s, set, go }: Ctx) {
  const [err, setErr] = useState("");
  const submit = () => {
    try {
      const u = new URL(s.portfolio);
      if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) throw new Error();
      go("3.0.2");
    } catch {
      setErr("Enter a full link that starts with https://");
    }
  };
  return (
    <Page title="Share your portfolio" subtitle="A public page that shows your work.">
      <Input
        label="Profile link"
        value={s.portfolio}
        inputMode="url"
        placeholder="https://"
        error={err || undefined}
        onChange={(portfolio) => {
          set({ portfolio });
          setErr("");
        }}
        onEnter={submit}
        help="GitHub, Behance, Upwork or your own domain."
      />
      <Actions actions={[{ label: "Continue", disabled: !s.portfolio, onClick: submit }]} />
    </Page>
  );
}

export function EngagementProof({ s, set, go }: Ctx) {
  const [files, setFiles] = useState<DocState[]>(s.engagement.status === "uploaded" ? [s.engagement] : []);
  const heading =
    s.proof === "udyam"
      ? ["Upload your Udyam certificate", "The certificate issued on the Udyam portal."]
      : s.proof === "professional"
        ? ["Upload your registration", "Your council or institute membership certificate."]
        : ["Upload your engagement proof", "An agreement, work order or recent invoices."];
  const add = (list: File[]) => {
    const next = [...files, ...list.map(acceptFile)].slice(-3);
    setFiles(next);
    const firstOk = next.find((f) => f.status === "uploaded");
    if (firstOk) set({ engagement: firstOk });
  };
  const ok = files.some((f) => f.status === "uploaded");
  return (
    <Page title={heading[0]} subtitle={heading[1]}>
      {files.map((f, i) =>
        f.status === "uploaded" ? (
          <DocRow
            key={i}
            variant="neutral"
            icon={<FileCheck size={20} />}
            title={f.file!}
            description={f.size}
            trailing={<Chip tone="success">Uploaded</Chip>}
          />
        ) : (
          <DocRow key={i} variant="error" title="File not added" description={f.note} />
        ),
      )}
      {files.length < 3 && (
        <DocRow variant="dropzone" title="Drag files here or browse" description="Up to 3 files, 5 MB each" multiple onPick={add} />
      )}
      <Actions actions={[{ label: "Continue", disabled: !ok, onClick: () => go("3.0.2") }]} />
    </Page>
  );
}

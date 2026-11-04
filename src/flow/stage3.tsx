"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Chip,
  CtaRow,
  DocRow,
  Input,
  Modal,
  ModalArt,
  ModalHeader,
  PersonRow,
  RadioInline,
  Select,
  SummaryTable,
} from "@/components/ui/ds";
import { CirclePlus, FileCheck } from "@/components/ui/icons";
import { Page } from "@/components/shell";
import { Actions, StatusScreen, UploadRow, startUpload, supportMail, type Ctx } from "./common";
import { ProcessView, ResultIcon, ScanArt } from "./process";
import { MISSING, type DocState } from "./state";

/* ───────────── 3.0 Key persons ───────────── */

export function KeyPersons({ s, set, go }: Ctx) {
  return (
    <Page
      title="Who owns and runs the business?"
      subtitle="Choose who completes KYC. Directors come from MCA; invite anyone holding 10% or more."
    >
      {s.kycError && (
        <Alert tone="error" title="Choose who will complete KYC">
          Select at least one person to continue.
        </Alert>
      )}
      <fieldset className="flex flex-col gap-3">
        <legend className="t-14m mb-3 text-ink">Who will complete KYC?</legend>
        {s.people.map((p) => (
          <PersonRow
            key={p.id}
            radioName="kyc-owner"
            name={p.name}
            role={p.role}
            checked={s.kycOwner === p.id}
            onSelect={() => set({ kycOwner: p.id, kycError: false })}
          />
        ))}
      </fieldset>
      <div>
        <Button variant="secondary" size="sm" icon={<CirclePlus size={16} />} onClick={() => set({ modal: "invite" })}>
          Add directors
        </Button>
      </div>
      <p className="t-12r text-ink-2">By continuing, you consent to Paywize fetching your KYC record from the CKYC registry.</p>
      <Actions
        actions={[
          {
            label: "Continue",
            disabled: s.kycError,
            onClick: () => (s.kycOwner ? go("3.1") : set({ kycError: true })),
          },
        ]}
      />
    </Page>
  );
}

const MOBILE = /^[6-9][0-9]{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function InviteModal({ s, set, toast }: Ctx) {
  const [sending, setSending] = useState(false);
  const [f, setF] = useState({ name: "", mobile: "", email: "" });
  const [touched, setTouched] = useState({ mobile: false, email: false });
  const mobileOk = MOBILE.test(f.mobile);
  const emailOk = EMAIL.test(f.email);
  const ok = f.name.trim().length > 1 && mobileOk && emailOk;
  const send = () => {
    setSending(true);
    setTimeout(() => {
      set({
        modal: null,
        people: [...s.people, { id: `inv-${Date.now()}`, name: f.name.trim(), role: "Director · Invite sent", invited: true }],
      });
      toast(`Invite sent to ${f.name.trim().split(" ")[0]}`, `By SMS to +91 ${f.mobile.slice(0, 2)}••••${f.mobile.slice(-2)} and by email.`);
    }, 900);
  };
  return (
    <Modal open label="Add a director" onClose={() => set({ modal: null })}>
      <ModalHeader title="Add a director" subtitle="We will text and email them a secure link to complete their own KYC." />
      <ModalArt src="/figma/art-ubo.png" />
      <Input label="Full name" value={f.name} onChange={(name) => setF({ ...f, name })} placeholder="Enter full name" />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="min-w-0 flex-1" onBlur={() => setTouched((t) => ({ ...t, mobile: true }))}>
          <Input
            label="Mobile number"
            inputMode="tel"
            maxLength={10}
            value={f.mobile}
            onChange={(v) => setF({ ...f, mobile: v.replace(/\D/g, "") })}
            placeholder="Enter mobile number"
            error={touched.mobile && f.mobile && !mobileOk ? "Enter a 10-digit mobile number." : undefined}
          />
        </div>
        <div className="min-w-0 flex-1" onBlur={() => setTouched((t) => ({ ...t, email: true }))}>
          <Input
            label="Email ID"
            inputMode="email"
            value={f.email}
            onChange={(email) => setF({ ...f, email: email.trim() })}
            placeholder="Enter email address"
            error={touched.email && f.email && !emailOk ? "Enter a valid email address." : undefined}
          />
        </div>
      </div>
      <CtaRow>
        <Button disabled={!ok} loading={sending} onClick={send}>
          {sending ? "Sending" : "Send invite link"}
        </Button>
      </CtaRow>
    </Modal>
  );
}

export function IndividualApplicant({ s, go }: Ctx) {
  return (
    <Page title="You are the only owner" subtitle="For individuals and freelancers, this is you at 100%.">
      <PersonRow name={s.record?.displayName ?? "Rohit Sharma"} role="Applicant · proprietor" />
      <p className="t-12r text-ink-2">By continuing, you consent to Paywize fetching your KYC record from the CKYC registry.</p>
      <Actions actions={[{ label: "Continue", onClick: () => go("3.1") }]} />
    </Page>
  );
}

export function DirectorFlagged({ s, set, replace }: Ctx) {
  return (
    <Page title="A director needs attention" subtitle="MCA shows a problem with one director." icon={<ResultIcon tone="warning" />}>
      <PersonRow name="Karan Nair" role="DIN deactivated on MCA" trailing={<Chip tone="error">Action needed</Chip>} />
      <Alert tone="warning" title="We cannot proceed with this person">
        Remove them, or ask them to fix their DIN with MCA.
      </Alert>
      <Actions
        actions={[
          { label: "Contact support", variant: "secondary", onClick: () => supportMail("Director DIN deactivated") },
          {
            label: "Remove director",
            onClick: () => {
              set({ people: s.people.filter((p) => p.id !== "karan"), kycOwner: s.kycOwner === "karan" ? "" : s.kycOwner });
              replace("3.0");
            },
          },
        ]}
      />
    </Page>
  );
}

/* ───────────── 3.1 CKYC ───────────── */

function ownerName(s: Ctx["s"]) {
  return s.people.find((p) => p.id === s.kycOwner)?.name ?? s.record?.displayName ?? "Rohit Sharma";
}

export function CkycCheck({ s, replace, toast }: Ctx) {
  return (
    <Page title="Checking your CKYC record" subtitle="We check each owner against the central registry.">
      <ProcessView
        art={<ScanArt />}
        steps={[
          { label: "Matching your PAN and date of birth", ms: 1000 },
          { label: "Searching the CERSAI CKYC registry", ms: 1600 },
          { label: `Linking the verified profile for ${ownerName(s).split(" ")[0]}`, ms: 900 },
        ]}
        footnote="Usually under 10 seconds. You do not need to upload anything if we find a record."
        onDone={() => {
          replace("3.1.1");
          toast("CKYC record found", "Your verified profile is linked.");
        }}
      />
    </Page>
  );
}

export function CkycFound({ s, go }: Ctx) {
  return (
    <Page title="We found a CKYC record" subtitle="Your verified profile is linked automatically." icon={<ResultIcon tone="success" />}>
      <div>
        <Chip tone="success">Verified</Chip>
      </div>
      <SummaryTable
        rows={[
          { label: "Name", value: ownerName(s) },
          { label: "CKYC identifier (KIN)", value: "1234 5678 9012 34" },
          { label: "Status", value: "Linked", tone: "success" },
        ]}
      />
      <Actions actions={[{ label: "Continue", onClick: () => go("3.2") }]} />
    </Page>
  );
}

export function CkycUpload({ s, go, update }: Ctx) {
  const pick = (k: "poi" | "poa") => (files: File[]) => startUpload(files[0], (d) => update(() => ({ [k]: d })));
  const ready = s.poi.status === "uploaded" && s.poa.status === "uploaded";
  return (
    <Page title="We need your ID and address proof" subtitle="No CKYC record yet. We will create one for you.">
      <UploadRow title="Proof of identity" hint="PAN, passport or voter ID" doc={s.poi} onPick={pick("poi")} onRemove={() => update(() => ({ poi: MISSING }))} />
      <UploadRow title="Proof of address" hint="Aadhaar, utility bill or passport" doc={s.poa} onPick={pick("poa")} onRemove={() => update(() => ({ poa: MISSING }))} />
      <Actions actions={[{ label: "Continue", disabled: !ready, onClick: () => go("3.2") }]} />
    </Page>
  );
}

export function CkycUnavailable({ replace, go }: Ctx) {
  return (
    <StatusScreen
      title="The registry is not responding"
      subtitle="This is on our side."
      tone="warning"
      alertTitle="We could not reach CKYC"
      alertText="Try again, or upload your ID and address proof now."
      actions={[
        { label: "Try again", onClick: () => replace("3.1") },
        { label: "Upload proofs", variant: "secondary", onClick: () => go("3.1.2") },
      ]}
    />
  );
}

/* ───────────── 3.2 PEP declaration ───────────── */

const PEP_Q = "Are you, or any of your directors, partners or beneficial owners, a Politically Exposed Person (PEP) or related to one?";

export function PepDeclaration({ s, set, go }: Ctx) {
  return (
    <Page title="One more declaration" subtitle="Required by the Prevention of Money Laundering Act.">
      <p className="t-14m text-ink" id="pep-q">
        {PEP_Q}
      </p>
      <div className="rounded-xl bg-container p-4" aria-labelledby="pep-q">
        <RadioInline
          name="pep"
          value={s.pep}
          onChange={(v) => set({ pep: v as "yes" | "no" })}
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
        />
      </div>
      <Actions actions={[{ label: "Continue", onClick: () => go(s.pep === "yes" ? "3.2.1" : "4.0") }]} />
    </Page>
  );
}

const COUNTRIES = [
  { value: "IN", label: "India" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "SG", label: "Singapore" },
];
const FUNDS = [
  { value: "salary", label: "Salary or pension" },
  { value: "business", label: "Business income" },
  { value: "investments", label: "Investments" },
  { value: "inheritance", label: "Inheritance or gift" },
  { value: "other", label: "Other" },
];

export function PepForm({ s, set, go, replace }: Ctx) {
  const roleErr = s.pepError && !s.pepRole.trim();
  const fundsErr = s.pepError && !s.pepFunds;
  return (
    <Page
      title="Tell us about the public role"
      subtitle={s.pepError ? "This is needed for a closer review." : "This is needed for a closer review. It does not mean a rejection."}
    >
      <p className="t-14m text-ink">{PEP_Q}</p>
      <RadioInline
        name="pep"
        value={s.pep}
        onChange={(v) => (v === "no" ? replace("3.2", { pep: "no", pepError: false }) : set({ pep: "yes" }))}
        options={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ]}
      />
      <Input
        label="Public role"
        value={s.pepRole}
        onChange={(pepRole) => set({ pepRole })}
        placeholder="For example, Member of a state legislative body"
        error={roleErr ? "Tell us the position you hold or held." : undefined}
      />
      <Select label="Country or jurisdiction" value={s.pepCountry} onChange={(pepCountry) => set({ pepCountry })} options={COUNTRIES} />
      <Select
        label="Source of funds"
        value={s.pepFunds}
        onChange={(pepFunds) => set({ pepFunds })}
        options={FUNDS}
        error={fundsErr ? "Choose where the funds come from." : undefined}
      />
      <Actions
        actions={[
          {
            label: "Submit declaration",
            onClick: () => (s.pepRole.trim() && s.pepFunds ? go("3.2.2", { pepError: false }) : set({ pepError: true })),
          },
        ]}
      />
    </Page>
  );
}

export function PepNoted({ go }: Ctx) {
  return (
    <StatusScreen
      title="We will review this closely"
      subtitle="A senior reviewer will look at your application."
      tone="info"
      alertTitle="This adds up to 2 working days"
      alertText="You can keep going. Nothing else changes for you."
      actions={[{ label: "Continue", onClick: () => go("4.0") }]}
    />
  );
}

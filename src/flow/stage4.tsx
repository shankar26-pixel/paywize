"use client";

import { Button, Chip, CtaRow, DocRow, Input, Modal, ModalArt, ModalHeader, SummaryTable } from "@/components/ui/ds";
import { FileCheck, Landmark } from "@/components/ui/icons";
import { Page } from "@/components/shell";
import { IFSC_BANKS } from "./data";
import { Actions, StatusScreen, UploadRow, startUpload, type Ctx } from "./common";
import { ResultIcon, VerifyScreen } from "./process";
import { MISSING, type FlowState } from "./state";

const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function resolveIfsc(ifsc: string) {
  if (ifsc.length < 11) return { state: "typing" as const };
  const bank = IFSC.test(ifsc) ? IFSC_BANKS[ifsc.slice(0, 4)] : undefined;
  return bank ? { state: "ok" as const, bank } : { state: "bad" as const };
}

function BankLogo({ size = 20 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-container text-brand"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Landmark size={size * 0.6} />
    </span>
  );
}

export function maskAcct(a: string) {
  return `••••${a.slice(-4)}`;
}

/* ───────────── 4.0 Account details ───────────── */

export function AccountDetails({ s, set, go }: Ctx) {
  const ifsc = resolveIfsc(s.ifsc);
  const acctOk = /^[0-9]{9,18}$/.test(s.acct);
  const differ = s.acct2.length >= s.acct.length && s.acct2.length > 0 && s.acct2 !== s.acct;
  const ready = acctOk && s.acct2 === s.acct && ifsc.state === "ok";
  return (
    <Page title="Add your settlement account" subtitle="Settlements go to this account. It must be in the business name.">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="min-w-0 flex-1">
          <Input
            label="Account number"
            required
            inputMode="numeric"
            maxLength={18}
            value={s.acct}
            onChange={(v) => set({ acct: v.replace(/\D/g, "") })}
            placeholder="Enter account number"
          />
        </div>
        <div className="min-w-0 flex-1">
          <Input
            label="Confirm account number"
            required
            inputMode="numeric"
            maxLength={18}
            value={s.acct2}
            onChange={(v) => set({ acct2: v.replace(/\D/g, "") })}
            placeholder="Re-enter account number"
            error={differ ? "The account numbers do not match." : undefined}
            success={acctOk && s.acct2 === s.acct}
            help={acctOk && s.acct2 === s.acct ? "Account numbers match." : undefined}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Input
          label="IFSC"
          required
          maxLength={11}
          value={s.ifsc}
          muted={ifsc.state === "ok"}
          onChange={(v) => set({ ifsc: v.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
          placeholder="Enter IFSC"
          error={ifsc.state === "bad" ? "We could not find this IFSC. It has 11 characters." : undefined}
          trailing={ifsc.state === "ok" ? <BankLogo /> : undefined}
        />
        {ifsc.state === "ok" && (
          <p className="t-12s text-success" role="status">
            {ifsc.bank.bank}, {ifsc.bank.branch}
          </p>
        )}
      </div>
      <Actions actions={[{ label: "Verify with ₹1", disabled: !ready, onClick: () => go("4.1") }]} />
    </Page>
  );
}

/* ───────────── 4.1 Penny drop ───────────── */

export function pennyOutcome(s: FlowState) {
  if (s.acct.endsWith("0000")) return { screen: "4.1.E1", modal: null };
  if (s.acct.endsWith("1111")) return { screen: "4.1.2", modal: "bank-proof" as const };
  return { screen: "4.1.1", modal: null };
}

export function PennyDrop({ s, replace, toast }: Ctx) {
  const ifsc = resolveIfsc(s.ifsc);
  const bank = ifsc.state === "ok" ? ifsc.bank.short : "your bank";
  return (
    <VerifyScreen
      title="Verifying your account"
      steps={[
        { label: "Sending ₹1 by IMPS", ms: 1100 },
        { label: `Waiting for ${bank} to confirm`, ms: 1400 },
        { label: "Matching the account name with your business", ms: 1000 },
      ]}
      note="The ₹1 stays in your account. Please keep this page open."
      onDone={() => {
        const o = pennyOutcome(s);
        replace(o.screen, { modal: o.modal });
        if (o.screen === "4.1.1") toast("Bank account verified", `${bank} ••••${s.acct.slice(-4)} will receive your settlements.`);
      }}
    />
  );
}

export function AccountVerified({ s, go }: Ctx) {
  return (
    <Page title="Account verified" subtitle="The name on the account matches your business." icon={<ResultIcon tone="success" />}>
      <SummaryTable
        rows={[
          { label: "Name on the account", value: s.holder || accountName(s) },
          { label: "Legal entity name", value: s.record?.displayName ?? "" },
          { label: "Match score", value: "96%", tone: "success" },
        ]}
      />
      <Actions actions={[{ label: "Continue", onClick: () => go("5.0") }]} />
    </Page>
  );
}

function accountName(s: FlowState) {
  return (s.record?.displayName ?? "").toUpperCase().replace(/ PVT LTD$/, " PRIVATE LIMITED");
}

export function NameMismatch({ s, set }: Ctx) {
  return (
    <Page title="The names do not match" subtitle="We found a different name on this account." icon={<ResultIcon tone="warning" />}>
      <div>
        <Chip tone="warning">Name mismatch</Chip>
      </div>
      <SummaryTable
        rows={[
          { label: "Name on the account", value: "NIMBUS AGRO TRADERS" },
          { label: "Legal entity name", value: s.record?.displayName ?? "" },
          { label: "Match score", value: "72%", tone: "warning" },
        ]}
      />
      <Button full onClick={() => set({ modal: "bank-proof" })}>
        Upload bank proof
      </Button>
    </Page>
  );
}

export function BankProofModal({ set, go }: Ctx) {
  return (
    <Modal open label="Upload bank proof" onClose={() => set({ modal: null })}>
      <ModalHeader
        title="Upload bank proof"
        subtitle="Upload a cancelled cheque or a statement that shows the account number and the printed name. A reviewer will check it."
      />
      <ModalArt src="/figma/art-bank.png" />
      <CtaRow>
        <Button variant="secondary" onClick={() => set({ modal: null })}>
          Cancel
        </Button>
        <Button onClick={() => go("4.1.3", { modal: null })}>Upload proof</Button>
      </CtaRow>
    </Modal>
  );
}

export function UploadBankProof({ s, go, update }: Ctx) {
  const d = s.bankProof;
  return (
    <Page title="Upload bank proof" subtitle="It must show the account number and the printed name.">
      <UploadRow
        title="Cancelled cheque or statement"
        hint="PDF, JPG or PNG up to 5 MB. Statement from the last 3 months."
        doc={d}
        onPick={(files) => startUpload(files[0], (bankProof) => update(() => ({ bankProof })))}
        onRemove={() => update(() => ({ bankProof: MISSING }))}
      />
      <Actions actions={[{ label: "Submit for review", disabled: d.status !== "uploaded", onClick: () => go("4.1.4") }]} />
    </Page>
  );
}

export function ManualReview({ go }: Ctx) {
  return (
    <StatusScreen
      title="We will check this for you"
      subtitle="A reviewer will confirm your account."
      tone="info"
      alertTitle="This adds up to 1 working day"
      alertText="You can keep going. We will tell you the result."
      actions={[{ label: "Continue", onClick: () => go("5.0") }]}
    />
  );
}

export function DepositFailed({ go, replace }: Ctx) {
  return (
    <StatusScreen
      title="We could not verify the account"
      subtitle="The ₹1 deposit did not go through."
      tone="error"
      alertTitle="Deposit failed"
      alertText="The account may be closed, frozen or unable to receive credits."
      actions={[
        { label: "Use another account", variant: "secondary", onClick: () => go("4.0", { acct: "", acct2: "", ifsc: "" }) },
        { label: "Try again", onClick: () => replace("4.1") },
      ]}
    />
  );
}

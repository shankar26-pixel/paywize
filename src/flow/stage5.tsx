"use client";

import { Alert, Checkbox, Chip, DocRow, Input, OptionRow } from "@/components/ui/ds";
import { AlertBadge, CheckBadge, FileCheck, Globe, LinkIcon, QrCode, Smartphone } from "@/components/ui/icons";
import { Page } from "@/components/shell";
import { POLICIES } from "./data";
import { Actions, UploadRow, startUpload, type Ctx } from "./common";
import type { Collection } from "./state";
import { ResultIcon } from "./process";

const METHODS: { value: Collection; title: string; desc: string; icon: React.ReactNode }[] = [
  { value: "web", title: "E-commerce website", desc: "Customers pay on your site", icon: <Globe size={20} /> },
  { value: "app", title: "Mobile app", desc: "Customers pay in your Android or iOS app", icon: <Smartphone size={20} /> },
  { value: "links", title: "Payment links and smart invoicing", desc: "Share a link, no site needed", icon: <LinkIcon size={20} /> },
  { value: "qr", title: "QR codes", desc: "Collect in person", icon: <QrCode size={20} /> },
];

function checkUrl(v: string, store?: boolean) {
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" || !u.hostname.includes(".")) return "We could not open this page. Check that it is live and uses https.";
    if (store && !/(play\.google\.com|apps\.apple\.com)$/.test(u.hostname)) return "Use a Google Play or App Store link.";
    return "";
  } catch {
    return "We could not open this page. Check that it is live and uses https.";
  }
}

/** 5.0 – 5.0.3 in one page: tick every method used; each ticked card asks for its own link. */
export function CollectionMethod({ s, set, go, update }: Ctx) {
  const toggle = (c: Collection) =>
    set({ collections: s.collections.includes(c) ? s.collections.filter((x) => x !== c) : [...s.collections, c] });
  const has = (c: Collection) => s.collections.includes(c);
  const pickInvoice = (f: File[]) => startUpload(f[0], (invoice) => update(() => ({ invoice })));
  const inv = s.invoice;

  const fields: Partial<Record<Collection, React.ReactNode>> = {
    web: (
      <Input
        label="Storefront URL"
        required
        inputMode="url"
        value={s.site}
        placeholder="https://"
        onChange={(site) => set({ site: site.trim(), urlError: "" })}
        error={s.urlError || undefined}
        help="It must open without a login. We check that it matches your business."
      />
    ),
    app: (
      <Input
        label="Play Store or App Store link"
        required
        inputMode="url"
        value={s.app}
        placeholder="https://play.google.com/store/apps/details?id="
        onChange={(app) => set({ app: app.trim(), appError: "" })}
        error={s.appError || undefined}
        help="We check the listing and its policies."
      />
    ),
    links: (
      <>
        <Input
          label="Payment page link (optional)"
          inputMode="url"
          value={s.payLink}
          placeholder="https://"
          onChange={(payLink) => set({ payLink: payLink.trim() })}
          help="If you already share one. We create your Paywize links after approval."
        />
        <UploadRow
          title="Sample invoice (optional)"
          hint="Helps us confirm what you sell. PDF, JPG or PNG up to 5 MB"
          doc={inv}
          onPick={pickInvoice}
        />
      </>
    ),
    qr: <p className="t-12r text-brand-dark">No link needed. Your QR codes are ready to download once you are approved.</p>,
  };

  const submit = () => {
    const urlError = has("web") ? checkUrl(s.site) : "";
    const appError = has("app") ? checkUrl(s.app, true) : "";
    if (urlError || appError) return set({ urlError, appError });
    go("5.1", { urlError: "", appError: "" });
  };

  return (
    <Page title="How will customers pay you?" subtitle="Choose all that apply. You can add more later.">
      <div role="group" aria-label="Collection methods" className="flex flex-col gap-3">
        {METHODS.map((m) => (
          <OptionRow
            key={m.value}
            multi
            name="collection"
            icon={m.icon}
            title={m.title}
            description={m.desc}
            checked={has(m.value)}
            onSelect={() => toggle(m.value)}
          >
            {fields[m.value]}
          </OptionRow>
        ))}
      </div>
      <Actions
        actions={[
          {
            label: "Continue",
            disabled: s.collections.length === 0 || (has("web") && !s.site) || (has("app") && !s.app),
            onClick: submit,
          },
        ]}
      />
    </Page>
  );
}

export function ContentDiffers({ go }: Ctx) {
  return (
    <Page title="Your site looks different" subtitle="The content does not match the category you declared." icon={<ResultIcon tone="warning" />}>
      <dl className="w-full overflow-hidden rounded-xl border border-line-2">
        <div className="flex min-h-[43px] items-center justify-between gap-4 px-4 py-2">
          <dt className="t-12r flex items-center gap-2 text-ink-2">
            <CheckBadge />
            You declared
          </dt>
          <dd className="t-12s text-ink">Apparel and retail</dd>
        </div>
        <div className="flex min-h-[43px] items-center justify-between gap-4 border-t border-line-2 bg-warning-container px-4 py-2">
          <dt className="t-12r flex items-center gap-2 text-ink-2">
            <AlertBadge />
            We found
          </dt>
          <dd className="t-12s text-on-warning">Packaged food and beverages</dd>
        </div>
      </dl>
      <Alert tone="warning" dismissible={false}>
        The right category keeps settlements on time and avoids a later review.
      </Alert>
      <Actions
        actions={[
          { label: "Explain the difference", variant: "secondary", onClick: () => go("5.0.E2.X") },
          { label: "Update my category", onClick: () => go("2.2A") },
        ]}
      />
    </Page>
  );
}

export function ExplainDifference({ go }: Ctx) {
  return (
    <Page title="Explain the difference" subtitle="A reviewer reads this with your application.">
      <label className="flex flex-col gap-1.5">
        <span className="t-12s text-ink">Your explanation</span>
        <textarea
          rows={4}
          className="t-14r rounded-xl border border-line bg-surface p-3 text-ink outline-none placeholder:text-ink-3 focus:border-ink-2"
          placeholder="For example, we sell apparel and run a small café at our flagship store."
        />
      </label>
      <Actions actions={[{ label: "Continue", onClick: () => go("5.1") }]} />
    </Page>
  );
}

function PolicyList({ s, set }: Pick<Ctx, "s" | "set">) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-container p-4">
      {POLICIES.map((p, i) => (
        <Checkbox
          key={p}
          checked={s.policies[i]}
          onChange={(v) => set({ policies: s.policies.map((x, j) => (j === i ? v : x)) })}
        >
          {p}
        </Checkbox>
      ))}
    </div>
  );
}

export function PolicyAck({ s, set, go, toast }: Ctx) {
  const all = s.policies.every(Boolean);
  const n = s.policies.filter(Boolean).length;
  return (
    <Page title="Confirm your public pages" subtitle="Customers and regulators expect these to be live.">
      <div className="flex items-center justify-between gap-3">
        <p className="t-14r text-ink">Confirm that these pages are live on your site or app.</p>
        <span className={`t-12s shrink-0 ${all ? "text-success" : "text-ink-2"}`}>{n} of 4</span>
      </div>
      <PolicyList s={s} set={set} />
      <Actions
        actions={[
          {
            label: "Continue",
            disabled: !all,
            onClick: () => {
              go("6.0");
              toast("Storefront set up", "One last look before you submit.");
            },
          },
        ]}
      />
    </Page>
  );
}

export function PageNotFound({ s, set, replace }: Ctx) {
  return (
    <Page title="Confirm your public pages" subtitle="Customers and regulators expect these to be live.">
      <Alert tone="error" title="We could not find your refund policy">
        Publish it at a public address, then check again.
      </Alert>
      <PolicyList s={s} set={set} />
      <Actions
        actions={[
          {
            label: "Use a template",
            variant: "secondary",
            onClick: () => window.open("https://paywize.in/templates/refund-policy", "_blank", "noopener"),
          },
          { label: "Check again", disabled: !s.policies.every(Boolean), onClick: () => replace("5.1") },
        ]}
      />
    </Page>
  );
}

export function GrievanceMissing({ s, set, go }: Ctx) {
  const err = s.grievanceError && !s.grievanceName.trim();
  const emailErr = s.grievanceError && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.grievanceEmail);
  return (
    <Page title="Add a Grievance Officer" subtitle="Your contact page must name one.">
      <Input
        label="Grievance Officer name"
        required
        value={s.grievanceName}
        onChange={(grievanceName) => set({ grievanceName })}
        placeholder="Full name"
        error={err ? "Required by the Consumer Protection rules." : undefined}
      />
      <Input
        label="Officer email"
        required
        inputMode="email"
        value={s.grievanceEmail}
        onChange={(grievanceEmail) => set({ grievanceEmail: grievanceEmail.trim() })}
        placeholder="grievance@yourdomain.in"
        error={emailErr ? "Enter a valid email address." : undefined}
      />
      <Actions
        actions={[
          {
            label: "Save",
            onClick: () =>
              s.grievanceName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.grievanceEmail)
                ? go("5.1", { grievanceError: false })
                : set({ grievanceError: true }),
          },
        ]}
      />
    </Page>
  );
}


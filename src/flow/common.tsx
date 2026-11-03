"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Alert, Button, Chip, CtaRow, DocRow, formatSize, type Tone } from "@/components/ui/ds";
import { Building, FileCheck } from "@/components/ui/icons";
import { Page } from "@/components/shell";
import type { DocState, FlowState } from "./state";
import { Celebrate, ResultIcon } from "./process";

export type Ctx = {
  s: FlowState;
  set: (patch: Partial<FlowState>) => void;
  /** Push a new screen onto history. */
  go: (screen: string, patch?: Partial<FlowState>) => void;
  /** Swap the current screen without adding history (loading → result). */
  replace: (screen: string, patch?: Partial<FlowState>) => void;
  back: () => void;
  /** Patch computed from the latest state, for updates that land after a delay (uploads). */
  update: (fn: (prev: FlowState) => Partial<FlowState>) => void;
  /** Short confirmation at the bottom of the screen. */
  toast: (title: string, text?: string) => void;
};

export type Action = { label: string; onClick: () => void; variant?: "primary" | "secondary"; disabled?: boolean };

export function Actions({ actions, size, align }: { actions: Action[]; size?: "md" | "lg"; align?: "start" | "end" }) {
  return (
    <CtaRow align={align}>
      {actions.map((a) => (
        <Button key={a.label} variant={a.variant ?? "primary"} disabled={a.disabled} onClick={a.onClick} size={size}>
          {a.label}
        </Button>
      ))}
    </CtaRow>
  );
}

/**
 * Success moments (submitted, approved, signed, live): one centred card that reads top to bottom —
 * tick, title, one line on what happens next, the key detail (e.g. reference ID), then the next action.
 */
export function SuccessScreen({
  title,
  subtitle,
  detail,
  copy,
  action,
  confetti,
}: {
  title: string;
  subtitle: string;
  /** The one fact worth keeping, shown in a pill. */
  detail?: ReactNode;
  /** Text to copy when the detail is an ID. */
  copy?: string;
  action: Action;
  confetti?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <section className="flex w-full max-w-[640px] flex-col items-center rounded-[28px] bg-surface px-6 pt-10 pb-8 text-center">
      <Celebrate confetti={confetti} />
      <h1 className="t-28b mt-5 text-ink">{title}</h1>
      <p className="t-14r mt-2 max-w-[440px] text-ink-2">{subtitle}</p>
      {detail && (
        <div className="t-12s mt-5 inline-flex items-center gap-2 rounded-full bg-surface-variant py-2 pr-2 pl-4 text-ink">
          <span>{detail}</span>
          {copy ? (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(copy).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              }}
              className="t-12s rounded-full bg-surface px-3 py-1 text-brand hover:bg-brand-container"
              aria-label={`Copy ${copy}`}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          ) : (
            <span className="w-2" />
          )}
        </div>
      )}
      <div className="mt-8">
        <Button variant={action.variant ?? "primary"} disabled={action.disabled} onClick={action.onClick}>
          {action.label}
        </Button>
      </div>
    </section>
  );
}

/** Heading + card with a single alert and next-action buttons (status, error and decision screens). */
export function StatusScreen({
  title,
  subtitle,
  tone,
  alertTitle,
  alertText,
  actions,
  children,
  size,
  celebrate,
}: {
  title: string;
  subtitle: string;
  tone: Tone;
  alertTitle: string;
  alertText: ReactNode;
  actions: Action[];
  children?: ReactNode;
  size?: "md" | "lg";
  /** Success moments get an animated mark; "confetti" for the biggest ones (approved, live). */
  celebrate?: boolean | "confetti";
}) {
  return (
    <Page title={title} subtitle={subtitle} icon={<ResultIcon tone={tone} />}>
      {celebrate === "confetti" && <Celebrate confetti />}
      {children}
      <Alert tone={tone} title={alertTitle}>
        {alertText}
      </Alert>
      <Actions actions={actions} size={size} />
    </Page>
  );
}

const MAX = 5 * 1024 * 1024;
const OK_TYPES = /\.(pdf|jpe?g|png)$/i;

/** Client-side checks we can do before the provider reads the document. */
export function acceptFile(file: File): DocState {
  if (!OK_TYPES.test(file.name)) return { status: "error", note: "Upload a PDF, JPG or PNG file." };
  if (file.size > MAX) return { status: "error", note: `This file is ${formatSize(file.size)}. Upload one under 5 MB.` };
  return { status: "uploaded", file: file.name, size: formatSize(file.size) };
}

/**
 * Validates, then shows a short upload with progress before the file counts as added.
 * `apply` receives each state in turn: uploading → uploaded (or error straight away).
 */
export function startUpload(file: File, apply: (d: DocState) => void) {
  const checked = acceptFile(file);
  if (checked.status === "error") return apply(checked);
  apply({ ...checked, status: "uploading" });
  setTimeout(() => apply(checked), 1400);
}

/**
 * One row for any document: required (amber) or dropzone when missing, a progress bar while
 * uploading, a green chip once added, red when rejected. Clicking an added row replaces the file.
 */
export function UploadRow({
  title,
  hint,
  doc,
  onPick,
  empty = "dropzone",
  multiple,
}: {
  title: string;
  hint: string;
  doc: DocState;
  onPick: (files: File[]) => void;
  empty?: "required" | "dropzone";
  multiple?: boolean;
}) {
  if (doc.status === "uploading")
    return (
      <DocRow
        variant="neutral"
        icon={<span className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />}
        title={title}
        description={
          <span className="flex flex-col gap-1.5">
            <span>Uploading {doc.file}…</span>
            <span className="block h-1 w-full max-w-[260px] overflow-hidden rounded-full bg-line">
              <span className="anim-fill block h-full rounded-full bg-brand" />
            </span>
          </span>
        }
      />
    );
  if (doc.status === "uploaded")
    return (
      <DocRow
        variant="neutral"
        icon={<FileCheck size={20} />}
        title={title}
        description={`${doc.file} · ${doc.size} · Click to replace`}
        trailing={<Chip tone="success">Uploaded</Chip>}
        onPick={onPick}
      />
    );
  if (doc.status === "error") return <DocRow variant="error" title={title} description={`${doc.note} Click to upload again.`} onPick={onPick} />;
  if (empty === "required") return <DocRow variant="required" icon={<Building size={20} />} title={title} description={hint} onPick={onPick} multiple={multiple} />;
  return <DocRow variant="dropzone" title={title} description={hint} onPick={onPick} multiple={multiple} />;
}

/** Runs `fn` once after `ms`, cancelling if the screen unmounts. */
export function useAfter(ms: number, fn: () => void, deps: unknown[] = []) {
  useEffect(() => {
    const t = setTimeout(fn, ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** A hidden file input that a button elsewhere on the screen can open. */
export function useFilePicker(onPick: (file: File) => void, accept = ".pdf,.jpg,.jpeg,.png") {
  const ref = useRef<HTMLInputElement>(null);
  const input = (
    <input
      ref={ref}
      type="file"
      accept={accept}
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) onPick(f);
        e.target.value = "";
      }}
    />
  );
  return [() => ref.current?.click(), input] as const;
}

export function supportMail(subject: string) {
  if (typeof window !== "undefined") window.location.href = `mailto:support@paywize.in?subject=${encodeURIComponent(subject)}`;
}

"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
import {
  AlertBadge,
  CheckBadge,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CircleX,
  Info,
  Mail,
  TriangleAlert,
  Upload,
  X,
} from "./icons";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ───────────────────────── Button ───────────────────────── */

type ButtonProps = {
  variant?: "primary" | "secondary" | "muted";
  size?: "md" | "lg" | "sm";
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
  onClick?: () => void;
  children: ReactNode;
  icon?: ReactNode;
  type?: "button" | "submit";
};

export function Button({
  variant = "primary",
  size = "md",
  disabled,
  loading,
  full,
  onClick,
  children,
  icon,
  type = "button",
}: ButtonProps) {
  const off = disabled || loading;
  const sizing =
    size === "lg"
      ? "h-12 px-6 rounded-3xl t-16s font-semibold"
      : size === "sm"
        ? "h-[34px] px-6 rounded-[17px] t-12s"
        : "h-10 px-6 rounded-[20px] t-14s";
  const look = off
    ? "bg-container text-ink-disabled cursor-not-allowed"
    : variant === "primary"
      ? "bg-btn text-btn-text hover:opacity-90 active:scale-[0.98]"
      : variant === "muted"
        ? "bg-container text-ink border-[0.5px] border-line hover:border-ink-3 active:scale-[0.98]"
        : "bg-surface text-ink border border-line hover:border-ink-3 active:scale-[0.98]";
  return (
    <button
      type={type}
      disabled={off}
      onClick={onClick}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap transition",
        sizing,
        look,
        full && "w-full",
      )}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

export function CtaRow({ children, align = "end" }: { children: ReactNode; align?: "end" | "start" }) {
  return (
    <div className={cx("flex w-full flex-wrap items-center gap-3", align === "end" ? "justify-end" : "justify-start")}>
      {children}
    </div>
  );
}

/* ───────────────────────── Alert ───────────────────────── */

export type Tone = "error" | "warning" | "info" | "success";

const toneClass: Record<Tone, string> = {
  error: "bg-error-container text-on-error",
  warning: "bg-warning-container text-on-warning",
  info: "bg-info-container text-on-info",
  success: "bg-success-container text-on-success",
};
const toneIcon: Record<Tone, ReactNode> = {
  error: <CircleX size={20} />,
  warning: <CircleAlert size={20} />,
  info: <Info size={20} />,
  success: <CircleCheck size={20} />,
};

export function Alert({
  tone,
  title,
  children,
  dismissible = true,
}: {
  tone: Tone;
  title?: string;
  children?: ReactNode;
  dismissible?: boolean;
}) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={cx("anim-fade-up flex w-full items-center gap-3 rounded-xl px-4 py-3", toneClass[tone])}
    >
      <span className="shrink-0">{toneIcon[tone]}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title && <p className="t-14s">{title}</p>}
        {children && <p className="t-12r">{children}</p>}
      </div>
      {dismissible && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setOpen(false)}
          className="shrink-0 rounded-full p-0.5 hover:bg-black/5"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

/* ───────────────────────── Chip ───────────────────────── */

const chipTone: Record<Tone | "brand", string> = {
  success: "bg-success-container text-on-success border-[color-mix(in_srgb,var(--success)_55%,transparent)]",
  error: "bg-error-container text-on-error border-[color-mix(in_srgb,var(--error)_60%,transparent)]",
  warning: "bg-warning-container text-on-warning border-[color-mix(in_srgb,var(--warning)_70%,transparent)]",
  info: "bg-info-container text-on-info border-[color-mix(in_srgb,var(--info)_60%,transparent)]",
  brand: "bg-brand-container text-brand-dark border-transparent",
};

export function Chip({ tone, children, caps }: { tone: Tone | "brand"; children: ReactNode; caps?: boolean }) {
  return (
    <span
      className={cx(
        "inline-flex h-6 shrink-0 items-center rounded-full border px-3 whitespace-nowrap",
        caps ? "text-[12px] leading-[16px] font-semibold tracking-[0.02em] uppercase" : "t-12s",
        chipTone[tone],
      )}
    >
      {children}
    </span>
  );
}

/* ───────────────────────── Field shell ───────────────────────── */

type FieldState = "default" | "error" | "success" | "readonly";

function fieldBox(state: FieldState, focused?: boolean) {
  return cx(
    "flex h-10 w-full cursor-text items-center gap-2 rounded-xl border px-3 transition-[border-color,box-shadow]",
    state === "error" && "bg-error-container border-error",
    state === "success" && "bg-success-container border-success",
    state === "readonly" && "bg-surface-variant border-line",
    state === "default" && cx("bg-surface", focused ? "border-brand" : "border-line hover:border-ink-3"),
    // Focus shows on the field's own border, with a soft ring in the field's state colour.
    focused &&
      (state === "error"
        ? "shadow-[0_0_0_3px_color-mix(in_srgb,var(--error)_22%,transparent)]"
        : state === "success"
          ? "shadow-[0_0_0_3px_color-mix(in_srgb,var(--success)_22%,transparent)]"
          : "shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-primary)_22%,transparent)]"),
  );
}

export function FieldLabel({ htmlFor, children, required }: { htmlFor?: string; children: ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="t-12s text-ink">
      {children}
      {required && <span className="text-error"> *</span>}
    </label>
  );
}

export function FieldHelp({ id, error, children }: { id?: string; error?: boolean; children: ReactNode }) {
  return (
    <p id={id} role={error ? "alert" : undefined} className={cx("t-12r", error ? "text-on-error" : "text-ink-2")}>
      {children}
    </p>
  );
}

type InputProps = {
  label?: string;
  required?: boolean;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  help?: ReactNode;
  error?: string;
  success?: boolean;
  readOnly?: boolean;
  trailing?: ReactNode;
  inputMode?: "text" | "numeric" | "email" | "tel" | "url";
  autoFocus?: boolean;
  maxLength?: number;
  type?: string;
  onEnter?: () => void;
  /** Resolved value that stays editable (grey surface, e.g. a looked-up IFSC). */
  muted?: boolean;
  name?: string;
};

export function Input({
  label,
  required,
  value,
  onChange,
  placeholder,
  help,
  error,
  success,
  readOnly,
  trailing,
  inputMode,
  autoFocus,
  maxLength,
  type = "text",
  onEnter,
  muted,
  name,
}: InputProps) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  const [focus, setFocus] = useState(false);
  const state: FieldState = error ? "error" : success ? "success" : readOnly || muted ? "readonly" : "default";

  // Text typed before hydration, or filled in by the browser without an input event,
  // sits in the DOM but never reaches state. Pull it in once on mount and on focus/blur.
  const sync = () => {
    const dom = ref.current?.value ?? "";
    if (!readOnly && dom !== value) onChange?.(dom);
  };
  useEffect(() => {
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <FieldLabel htmlFor={id} required={required}>
          {label}
        </FieldLabel>
      )}
      <div
        className={fieldBox(state, focus && !readOnly)}
        onMouseDown={(e) => {
          // Clicks on the padding or empty space focus the input; trailing buttons keep their own click.
          if (e.target === e.currentTarget) {
            e.preventDefault();
            ref.current?.focus();
          }
        }}
      >
        <input
          ref={ref}
          id={id}
          name={name}
          type={type}
          value={value}
          readOnly={readOnly}
          autoFocus={autoFocus}
          maxLength={maxLength}
          inputMode={inputMode}
          placeholder={placeholder}
          aria-invalid={!!error || undefined}
          aria-describedby={error || help ? `${id}-help` : undefined}
          onFocus={() => {
            setFocus(true);
            sync();
          }}
          onBlur={() => {
            setFocus(false);
            sync();
          }}
          onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
          onChange={(e) => onChange?.(e.target.value)}
          className="t-14r h-full min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-3 focus-visible:outline-none"
        />
        {trailing}
      </div>
      {(error || help) && (
        <FieldHelp id={`${id}-help`} error={!!error}>
          {error ?? help}
        </FieldHelp>
      )}
    </div>
  );
}

/* ───────────────────────── Select (Input + Dropdown toggle) ───────────────────────── */

export type SelectOption = { value: string; label: string; hint?: string; disabled?: boolean; status?: string };

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = "Select",
  help,
  error,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  help?: ReactNode;
  error?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const move = (dir: 1 | -1) => {
    let i = active;
    for (let n = 0; n < options.length; n++) {
      i = (i + dir + options.length) % options.length;
      if (!options[i].disabled) break;
    }
    setActive(i);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open && active >= 0 && !options[active].disabled) {
        onChange(options[active].value);
        setOpen(false);
      } else setOpen((o) => !o);
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={wrap} className="relative flex w-full flex-col gap-1.5">
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-list`}
        aria-invalid={!!error || undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKey}
        className={cx(fieldBox(error ? "error" : "default", open), "cursor-pointer text-left focus-visible:outline-none", !open && !error && "focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-primary)_22%,transparent)]")}
      >
        <span className={cx("t-14r min-w-0 flex-1 truncate", selected ? "text-ink" : "text-ink-3")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={20} className={cx("shrink-0 text-ink-2 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="anim-pop absolute top-[calc(100%+6px)] left-0 z-30 flex max-h-72 w-full flex-col gap-1 overflow-auto rounded-xl border border-line bg-surface p-1.5"
          style={{ boxShadow: "var(--shadow-pop)", top: label ? 66 : 46 }}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              aria-disabled={o.disabled || undefined}
              onMouseEnter={() => setActive(i)}
              onClick={() => {
                if (o.disabled) return;
                onChange(o.value);
                setOpen(false);
              }}
              className={cx(
                "flex items-center gap-3 rounded-lg px-3 py-2",
                o.disabled ? "cursor-not-allowed" : "cursor-pointer",
                (active === i || o.value === value) && !o.disabled && "bg-container",
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className={cx("t-14r", o.disabled ? "text-ink-3" : "text-ink")}>{o.label}</span>
                {o.hint && <span className="t-12r text-ink-2">{o.hint}</span>}
              </div>
              {o.status && <Chip tone={o.disabled ? "error" : "success"}>{o.status}</Chip>}
            </li>
          ))}
        </ul>
      )}
      {(error || help) && <FieldHelp error={!!error}>{error ?? help}</FieldHelp>}
    </div>
  );
}

/* ───────────────────────── Checkbox / Radio ───────────────────────── */

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span className="mt-[-2px] rounded-[4px] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
        <CheckBox checked={checked} />
      </span>
      <span className="t-14s text-ink">{children}</span>
    </label>
  );
}

/** The 20px checkbox square from the DS Checkbox, shared by checkbox rows. */
export function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "flex size-5 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
        checked ? "border-brand bg-brand text-white" : "border-line bg-surface",
      )}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="m2.5 6.2 2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

export function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "flex size-5 shrink-0 items-center justify-center rounded-full border bg-surface",
        checked ? "border-brand border-[1.5px]" : "border-line",
      )}
    >
      {checked && <span className="size-2.5 rounded-full bg-brand" />}
    </span>
  );
}

export function RadioInline({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div role="radiogroup" className="flex gap-6">
      {options.map((o) => (
        <label key={o.value} className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="peer sr-only"
          />
          <span className="rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
            <RadioDot checked={value === o.value} />
          </span>
          <span className="t-14r text-ink">{o.label}</span>
        </label>
      ))}
    </div>
  );
}

/* ───────────────────────── Option row (radio card) ───────────────────────── */

export function OptionRow({
  name,
  icon,
  title,
  description,
  checked,
  onSelect,
  multi,
  children,
}: {
  name: string;
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onSelect: () => void;
  /** Checkbox behaviour: the row toggles and several rows can be on. */
  multi?: boolean;
  /** Extra fields shown inside the card while it is selected (kept outside the label so they stay clickable). */
  children?: ReactNode;
}) {
  const expanded = checked && !!children;
  return (
    <div
      className={cx(
        "w-full rounded-xl border transition-colors",
        checked ? "border-brand bg-brand-container" : "border-transparent bg-container hover:border-line",
      )}
    >
      <label className="flex min-h-[72px] w-full cursor-pointer items-center gap-3 px-4 py-4">
        <input
          type={multi ? "checkbox" : "radio"}
          name={name}
          checked={checked}
          onChange={onSelect}
          aria-expanded={children ? checked : undefined}
          className="peer sr-only"
        />
        <span
          className={cx(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            checked ? "bg-brand text-white" : "bg-surface text-ink-2",
          )}
        >
          {icon}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className={cx("t-14s", checked ? "text-brand-dark" : "text-ink")}>{title}</span>
          <span className={cx("t-12r", checked ? "text-brand-dark" : "text-ink-2")}>{description}</span>
        </span>
        <span
          className={cx(
            multi ? "rounded-[4px]" : "rounded-full",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand",
          )}
        >
          {multi ? <CheckBox checked={checked} /> : <RadioDot checked={checked} />}
        </span>
      </label>
      {expanded && <div className="anim-fade-up flex flex-col gap-3 px-4 pb-4 sm:pl-[68px]">{children}</div>}
    </div>
  );
}

/* ───────────────────────── Person row ───────────────────────── */

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export function PersonRow({
  name,
  role,
  checked,
  onSelect,
  radioName,
  trailing,
}: {
  name: string;
  role: string;
  checked?: boolean;
  onSelect?: () => void;
  radioName?: string;
  trailing?: ReactNode;
}) {
  const inner = (
    <>
      <span className="t-14m flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-white">
        {initials(name)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="t-14m text-ink">{name}</span>
        <span className="t-12r text-ink-2">{role}</span>
      </span>
      {trailing}
    </>
  );
  const shell = cx(
    "flex min-h-[58px] w-full items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
    checked ? "border-brand bg-brand-container" : "border-transparent bg-container",
  );
  if (!onSelect) return <div className={shell}>{inner}</div>;
  return (
    <label className={cx(shell, "cursor-pointer", !checked && "hover:border-line")}>
      <input type="radio" name={radioName} checked={!!checked} onChange={onSelect} className="peer sr-only" />
      {inner}
      <span className="rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
        <RadioDot checked={!!checked} />
      </span>
    </label>
  );
}

/* ───────────────────────── Document row / Upload dropzone ───────────────────────── */

export type DocVariant = "required" | "neutral" | "error" | "dropzone";

export function DocRow({
  variant,
  icon,
  title,
  description,
  trailing,
  onPick,
  accept = ".pdf,.jpg,.jpeg,.png",
  multiple,
}: {
  variant: DocVariant;
  icon?: ReactNode;
  title: string;
  description: ReactNode;
  trailing?: ReactNode;
  /** When set, the row is an upload target and opens the file picker. */
  onPick?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const shell = cx(
    "flex w-full items-center gap-3 rounded-xl px-3 text-left transition-colors",
    variant === "dropzone" ? "min-h-[74px] px-4" : "min-h-16",
    variant === "required" && "border border-dashed border-warning bg-warning-container",
    variant === "neutral" && "border border-transparent bg-container",
    variant === "error" && "border border-dashed border-error bg-error-container",
    variant === "dropzone" && cx("border border-dashed bg-surface", drag ? "border-brand bg-brand-container" : "border-line"),
    onPick && "cursor-pointer",
  );
  const tile =
    variant === "error" ? (
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error-strong text-white">
        <TriangleAlert size={20} />
      </span>
    ) : variant === "dropzone" ? (
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-container text-ink">
        <Upload size={20} />
      </span>
    ) : (
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-ink-2">{icon}</span>
    );
  const body = (
    <>
      {tile}
      <span className="flex min-w-0 flex-1 flex-col gap-1 py-3">
        <span className={cx("t-14s", variant === "error" ? "text-on-error" : "text-ink")}>{title}</span>
        <span className={cx("t-12r", variant === "error" ? "text-on-error" : variant === "dropzone" ? "text-ink-3" : "text-ink-2")}>
          {description}
        </span>
      </span>
      {trailing ??
        (variant === "required" && onPick ? (
          <span className="flex shrink-0 items-center gap-2 text-ink-2">
            <span className="sr-only">Required. Upload</span>
            <Upload size={20} />
          </span>
        ) : null)}
    </>
  );
  if (!onPick) return <div className={shell}>{body}</div>;
  return (
    <>
      <button
        type="button"
        className={shell}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const files = Array.from(e.dataTransfer.files);
          if (files.length) onPick(files);
        }}
      >
        {body}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onPick(files);
          e.target.value = "";
        }}
      />
    </>
  );
}

export function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/* ───────────────────────── Summary card ───────────────────────── */

export type SummaryItem = {
  label: string;
  value: ReactNode;
  tone?: "success" | "warning";
  action?: ReactNode;
};

export function SummaryTable({ rows }: { rows: SummaryItem[] }) {
  return (
    <dl className="w-full overflow-hidden rounded-xl border border-line-2">
      {rows.map((r, i) => (
        <div
          key={r.label}
          className={cx(
            "flex min-h-[43px] items-center justify-between gap-4 px-4 py-2",
            i > 0 && "border-t border-line-2",
            r.tone === "success" && "bg-success-container",
            r.tone === "warning" && "bg-warning-container",
          )}
        >
          <dt className="t-12r flex items-center gap-2 text-ink-2">
            {r.tone === "warning" && r.action === undefined && <AlertBadge />}
            {r.label}
          </dt>
          <dd className="flex items-center gap-2">
            {r.tone === "success" && <CheckBadge />}
            <span className={cx("t-12s text-right", r.tone === "warning" ? "text-on-warning" : "text-ink")}>{r.value}</span>
            {r.action}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ───────────────────────── Modal ───────────────────────── */

export function Modal({
  open,
  onClose,
  children,
  label,
  width = 520,
  bare,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
  width?: number;
  /** No close button and tighter padding, for dialogs that carry their own Cancel. */
  bare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Callers pass an inline onClose. Read it through a ref so a re-render does not re-run the focus effect
  // below, which would pull focus back to the first input.
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close.current();
      if (e.key === "Tab" && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => {
      const target = ref.current?.querySelector<HTMLElement>("input:not([readonly]), [data-autofocus]") ?? ref.current;
      target?.focus();
    }, 30);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--scrim)" }}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cx(
          "anim-pop relative flex max-h-[calc(100vh-32px)] w-full flex-col overflow-auto bg-surface outline-none",
          bare ? "gap-6 rounded-3xl p-[18px]" : "gap-4 rounded-[28px] p-6",
        )}
        style={{ maxWidth: width }}
      >
        {!bare && (
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 flex size-8 items-center justify-center rounded-full bg-container text-ink-2 hover:text-ink"
          >
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, subtitle, chip, large }: { title: string; subtitle: string; chip?: string; large?: boolean }) {
  return (
    <div className="flex flex-col gap-2 pr-10">
      {chip && (
        <span className="mb-1">
          <Chip tone="brand" caps>
            {chip}
          </Chip>
        </span>
      )}
      <h2 className={cx(large ? "t-22b" : "t-18s", "text-ink")}>{title}</h2>
      <p className="t-14r text-ink-2">{subtitle}</p>
    </div>
  );
}

export function ModalArt({ src, alt = "" }: { src: string; alt?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="h-[136px] w-full rounded-2xl object-cover" />;
}

/* ───────────────────────── OTP input ───────────────────────── */

export function OtpInput({
  length = 6,
  value,
  onChange,
  error,
  success,
  size = "md",
}: {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  success?: boolean;
  size?: "md" | "sm";
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  // Back to the first cell whenever the code is cleared: a wrong code, a resend, the next document.
  useEffect(() => {
    if (!value) refs.current[0]?.focus();
  }, [value]);
  const set = (i: number, ch: string) => {
    const arr = value.padEnd(length, " ").split("");
    arr[i] = ch || " ";
    onChange(arr.join("").replace(/\s+$/, ""));
  };
  const onPaste = (e: ClipboardEvent) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!digits) return;
    e.preventDefault();
    onChange(digits);
    refs.current[Math.min(digits.length, length - 1)]?.focus();
  };
  return (
    <div className="flex gap-2" onPaste={onPaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label={`Digit ${i + 1}`}
          maxLength={1}
          value={value[i]?.trim() ?? ""}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(-1);
            set(i, d);
            if (d) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i]?.trim()) refs.current[i - 1]?.focus();
          }}
          className={cx(
            "t-16s min-w-0 rounded-xl border text-center text-ink outline-none focus:border-2 focus:border-brand",
            size === "sm" ? "h-[52px] w-11 shrink-0" : "h-[70px] w-full",
            error ? "border-error bg-error-container" : success ? "border-success bg-success-container" : "border-line bg-surface",
          )}
        />
      ))}
    </div>
  );
}

/** The OTP dialog from the design system (2135:593). Used for every OTP in the flow. */
export function OtpModal({
  label,
  subtitle,
  notice,
  value,
  onChange,
  error,
  secondsLeft,
  canResend = true,
  onResend,
  onCancel,
  onContinue,
  canContinue,
  loading,
  inputKey,
}: {
  label: string;
  subtitle: string;
  /** Information about this OTP, such as which document it signs. */
  notice?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  secondsLeft: number;
  canResend?: boolean;
  onResend: () => void;
  onCancel: () => void;
  onContinue: () => void;
  canContinue: boolean;
  loading?: boolean;
  inputKey?: string | number;
}) {
  return (
    <Modal open bare width={575} label={label} onClose={onCancel}>
      <div className="flex items-center gap-5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-white">
          <Mail size={24} />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="t-16s font-bold text-ink">Enter OTP</h2>
          <p className="t-14m text-ink-2">{subtitle}</p>
        </div>
      </div>
      {notice && (
        <Alert tone="info" dismissible={false}>
          {notice}
        </Alert>
      )}
      <div className="flex flex-col gap-[18px]">
        <OtpInput key={inputKey} value={value} onChange={onChange} error={!!error} />
        {error && <FieldHelp error>{error}</FieldHelp>}
        {canResend && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="t-14m text-ink-2" aria-live="off">
              {secondsLeft > 0 ? `OTP Expires in ${secondsLeft} sec` : "OTP expired"}
            </p>
            <button type="button" onClick={onResend} className="t-14m font-bold text-ink-3 underline hover:text-ink-2">
              Resend OTP
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-2.5">
        <span className="min-w-32">
          <Button size="lg" variant="muted" full onClick={onCancel}>
            Cancel
          </Button>
        </span>
        <span className="min-w-32">
          <Button size="lg" full disabled={!canContinue} loading={loading} onClick={onContinue}>
            Continue
          </Button>
        </span>
      </div>
    </Modal>
  );
}

/* ───────────────────────── Segment progress ───────────────────────── */

export function SegmentBar({ total, done, current }: { total: number; done: number; current?: boolean }) {
  return (
    <div className="flex w-full gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cx(
            "h-1 flex-1 rounded-sm transition-colors duration-500",
            i < done && "bg-brand",
            i === done && current && "h-1.5 -translate-y-px border border-brand bg-surface",
            i >= done && !(i === done && current) && "bg-line-2",
          )}
        />
      ))}
    </div>
  );
}

export { cx };

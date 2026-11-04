"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Alert, Button, Input, OtpInput, RadioInline, Select, cx } from "@/components/ui/ds";
import { Eye, EyeOff } from "@/components/ui/icons";
import { supportMail, type Ctx } from "./common";
import type { FlowState } from "./state";

/* ───────────────────────── Split layout (Figma: Sign up, Sign in) ───────────────────────── */

// Only the first testimonial and the avatar are in Figma. The other two are placeholders: replace them with real quotes before launch.
const TESTIMONIALS = [
  {
    quote: "My experience with this platform so far has been great. Everything is seamless, from onboarding to reconciliation, refunds, and reporting — all in one place.",
    name: "Priya Nair",
    role: "Head of Payments @ hubsport",
  },
  {
    quote: "We went from signing up to taking our first payment without a single back-and-forth. Every step told us exactly what was needed next.",
    name: "Placeholder name",
    role: "Finance Lead @ placeholder",
  },
  {
    quote: "Settlements and refunds are finally easy to follow. My team spends far less time matching payments at the end of every month.",
    name: "Placeholder name",
    role: "Founder @ placeholder",
  },
];

function BrandPanel() {
  const [active, setActive] = useState(0);
  const current = TESTIMONIALS[active];
  return (
    <div
      className="group relative hidden w-[430px] shrink-0 overflow-hidden rounded-3xl p-11 lg:flex"
      style={{ background: "linear-gradient(180deg, #1a1052 13.3%, #6953e4 52.8%, #1a1052 92.4%)" }}
    >
      <div className="pointer-events-none absolute top-[-54px] left-[266px] flex h-[233px] w-[405px] items-center justify-center" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/auth/grid.png" alt="" className="h-[400.6px] w-[225.3px] max-w-none flex-none rotate-[88.85deg] object-cover" />
      </div>
      <div className="relative flex w-[316px] flex-col justify-between">
        <div className="relative flex flex-col">
          <p className="-mb-2 text-[28px] leading-[34px] font-extrabold text-white">Move money</p>
          <p className="text-[42px] leading-normal font-semibold text-[#d9ff00] italic" style={{ fontFamily: "var(--font-playfair)" }}>
            without friction
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/auth/spark.svg" alt="" aria-hidden="true" className="absolute top-[33px] left-[283px] w-[20px] rotate-[42.25deg]" />
        </div>
        <div className="flex flex-col gap-14">
          <figure key={active} className="anim-fade-up flex min-h-[124px] flex-col gap-6 text-white">
            <blockquote className="w-[316px] text-[14px] leading-4 font-medium">&quot;{current.quote}&quot;</blockquote>
            <figcaption className="flex flex-col gap-1" style={{ fontFamily: "var(--font-jakarta)" }}>
              <span className="text-[14px] leading-[18px] font-bold">{current.name}</span>
              <span className="text-[10px] leading-[14px] font-semibold">{current.role}</span>
            </figcaption>
          </figure>
          <div className="flex gap-3">
            {TESTIMONIALS.map((item, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show testimonial ${i + 1} of ${TESTIMONIALS.length}`}
                aria-current={i === active || undefined}
                onClick={() => setActive(i)}
                className="relative size-10 rounded-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/figma/auth/avatar.png"
                  alt=""
                  className={cx("size-10 rounded-full object-cover transition-opacity duration-300", i !== active && "opacity-50")}
                />
                {i === active && (
                  <svg className="absolute -top-[5px] -left-[5px] size-[50px] -rotate-90" viewBox="0 0 50 50" aria-hidden="true">
                    {/* Hovering the panel pauses it. With reduced motion the ring stays full and only a click moves on. */}
                    <circle
                      className="anim-ring-load"
                      cx="25"
                      cy="25"
                      r="23.5"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      pathLength={100}
                      onAnimationEnd={() => setActive((n) => (n + 1) % TESTIMONIALS.length)}
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-[7.5px]" aria-hidden="true">
          <span className="flex h-[23px] w-[54.5px] items-center justify-center rounded-[2.6px] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/figma/auth/verisign.png" alt="" className="h-[19.4px] w-[39.8px] object-cover" />
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/auth/make-in-india.png" alt="" className="h-[23px] w-[43.4px] rounded-[2.6px] object-cover" />
          <span className="flex h-[23px] w-[54.5px] items-center justify-center gap-[5px] rounded-[2.6px] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/figma/auth/ashoka.png" alt="" className="h-[18.4px] w-[12.9px] object-cover" />
            <span className="text-[5.5px] leading-[7.4px] tracking-[-0.22px] text-black">
              <span className="block font-medium">CASHLESS</span>
              <span className="block font-bold">INDIA</span>
            </span>
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/auth/digital-india.png" alt="" className="h-[23px] w-[47.3px] rounded-[2.6px] object-cover" />
        </div>
      </div>
    </div>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-bg p-4 lg:p-6">
      <div className="flex min-h-[666px] w-full max-w-[1232px] items-stretch gap-5">
        <BrandPanel />
        <main className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface-bg px-4 py-10 sm:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function AuthForm({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="anim-fade-up flex w-full max-w-[340px] flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-[3.5px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/auth/mark.svg" alt="" aria-hidden="true" className="size-[23.5px]" />
          <span className="text-[18.5px] font-medium tracking-[-0.37px] text-ink italic" style={{ fontFamily: "var(--font-poppins)" }}>
            Paywize
          </span>
        </div>
        <h1 className="t-22b text-ink">{title}</h1>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Footer({ text, link, onClick }: { text: string; link: string; onClick: () => void }) {
  return (
    <p className="flex items-center justify-center gap-2.5">
      <span className="t-12r text-ink-2">{text}</span>
      <button type="button" onClick={onClick} className="t-14s text-brand underline">
        {link}
      </button>
    </p>
  );
}

function HelpFooter() {
  return (
    <p className="flex items-center justify-center gap-2.5">
      <span className="t-12r text-ink-2">Need help?</span>
      <button type="button" onClick={() => supportMail("Help with my Paywize account")} className="t-14s text-brand">
        Contact support
      </button>
    </p>
  );
}

function SocialButtons({ onPick }: { onPick: (provider: string) => void }) {
  const cell = "t-12s flex h-11 flex-1 items-center justify-center gap-2 rounded-3xl border border-line text-ink hover:border-ink-3";
  return (
    <>
      <div className="flex items-center gap-[9px]">
        <span className="h-0 flex-1 border-t border-dashed border-line" />
        <span className="t-12r text-ink-2">Or</span>
        <span className="h-0 flex-1 border-t border-dashed border-line" />
      </div>
      <div className="flex gap-2">
        <button type="button" className={cell} onClick={() => onPick("Google")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/auth/google.svg" alt="" aria-hidden="true" className="size-5" />
          Google
        </button>
        <button type="button" className={cell} onClick={() => onPick("Microsoft")}>
          <span className="grid size-5 grid-cols-2 gap-px p-px" aria-hidden="true">
            {["#f8510c", "#7eba00", "#00a3f4", "#ffba00"].map((c) => (
              <span key={c} style={{ background: c }} />
            ))}
          </span>
          Microsoft
        </button>
      </div>
    </>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE = /^[6-9]\d{9}$/;
const STRONG = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const digits = (v: string) => v.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");

function PasswordInput(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string; onEnter?: () => void; autoFocus?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <Input
      {...props}
      type={show ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? "Hide password" : "Show password"}
          className="flex shrink-0 items-center text-ink-2 hover:text-ink"
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      }
    />
  );
}

/* ───────────────────────── Code entry, with the verified, expired and incorrect states ───────────────────────── */

type CodeStatus = FlowState["authCode"];
const CODE_SECONDS = 300;

function CodeStep({
  title,
  text,
  initial,
  onVerified,
  onChange,
  toast,
}: {
  title: string;
  text: string;
  initial: CodeStatus;
  onVerified: () => void;
  onChange?: () => void;
  toast: Ctx["toast"];
}) {
  const [code, setCode] = useState(initial ? "482910" : "");
  const [status, setStatus] = useState<CodeStatus>(initial);
  const [left, setLeft] = useState(CODE_SECONDS);

  useEffect(() => {
    if (status) return;
    if (left <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("expired");
      return;
    }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left, status]);

  const clock = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
  const bad = status === "expired" || status === "incorrect";
  return (
    <AuthForm title={title}>
      <p className="t-14r text-ink-2">
        {text}
        {onChange && (
          <>
            {" "}
            <button type="button" onClick={onChange} className="t-14s text-brand">
              Change
            </button>
          </>
        )}
      </p>
      <OtpInput
        size="sm"
        value={code}
        error={bad}
        success={status === "verified"}
        onChange={(v) => {
          setCode(v);
          if (status === "expired") return;
          // Demo codes: 000000 is wrong and 111111 has expired; any other code passes.
          setStatus(v.length < 6 ? "" : v === "000000" ? "incorrect" : v === "111111" ? "expired" : "verified");
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <p
          role={bad ? "alert" : undefined}
          className={cx("t-12r", status === "verified" ? "text-success" : bad ? "text-error" : "text-ink-2")}
        >
          {status === "verified"
            ? "Code verified"
            : status === "expired"
              ? "Code expired. Request a new one."
              : status === "incorrect"
                ? "Incorrect code. Check it and try again."
                : `Code expires in ${clock}`}
        </p>
        <button
          type="button"
          className="t-14s shrink-0 text-brand"
          onClick={() => {
            setCode("");
            setStatus("");
            setLeft(CODE_SECONDS);
            toast("New code sent");
          }}
        >
          Resend code
        </button>
      </div>
      <Button size="lg" full disabled={code.length < 6} onClick={() => status === "verified" && onVerified()}>
        Verify
      </Button>
      <HelpFooter />
    </AuthForm>
  );
}

function maskEmail(email: string) {
  const e = email || "name@company.com";
  return `*********${e.slice(-6)}`;
}
function maskMobile(mobile: string) {
  return `+91 ****** ${(mobile || "9876543210").slice(-4)}`;
}

/* ───────────────────────── Sign up ───────────────────────── */

export function SignupEmail({ s, go, replace, toast }: Ctx) {
  const [email, setEmail] = useState(s.email);
  const [error, setError] = useState("");
  const next = () => {
    if (!EMAIL.test(email.trim())) return setError("Enter a valid work email.");
    go("S.2", { email: email.trim(), authCode: "" });
  };
  return (
    <AuthForm title="Create your account">
      <Input
        label="Work email"
        inputMode="email"
        value={email}
        autoFocus
        placeholder="name@company.com"
        error={error}
        onEnter={next}
        onChange={(v) => {
          setEmail(v);
          setError("");
        }}
      />
      <Button size="lg" full onClick={next}>
        Continue
      </Button>
      <SocialButtons
        onPick={(p) => {
          toast(`Signed up with ${p}`, "Your email is verified. Add your mobile number next.");
          go("S.3", { email: "name@company.com" });
        }}
      />
      <Footer text="Already registered?" link="Sign in" onClick={() => replace("I.1", { history: [] })} />
      <p className="t-12r text-center text-ink-3">By continuing, you agree to the Terms of Use and Privacy Policy.</p>
    </AuthForm>
  );
}

export function SignupEmailCode({ s, go, back, toast }: Ctx) {
  return (
    <CodeStep
      title="Verify your email"
      text={`Enter the 6-digit code sent to ${maskEmail(s.email)}`}
      initial={s.authCode}
      toast={toast}
      onChange={back}
      onVerified={() => go("S.3", { authCode: "" })}
    />
  );
}

export function SignupMobile({ s, go }: Ctx) {
  const [mobile, setMobile] = useState(s.mobile);
  const [error, setError] = useState("");
  const next = () => {
    const m = digits(mobile);
    if (!MOBILE.test(m)) return setError("Enter a valid 10-digit mobile number.");
    go("S.4", { mobile: m, authCode: "" });
  };
  return (
    <AuthForm title="Add your mobile number">
      <Input
        label="Mobile number"
        inputMode="tel"
        value={mobile}
        autoFocus
        placeholder="+91 98765 43210"
        error={error}
        onEnter={next}
        onChange={(v) => {
          setMobile(v);
          setError("");
        }}
      />
      <Button size="lg" full onClick={next}>
        Continue
      </Button>
      <HelpFooter />
    </AuthForm>
  );
}

export function SignupMobileCode({ s, go, back, toast }: Ctx) {
  return (
    <CodeStep
      title="Verify your mobile"
      text={`Enter the 6-digit code sent to ${maskMobile(s.mobile)}`}
      initial={s.authCode}
      toast={toast}
      onChange={back}
      onVerified={() => go("S.5", { authCode: "" })}
    />
  );
}

/** Passwords stay in this component and are never written to the autosaved state. */
function PasswordFields({
  title,
  first,
  second,
  cta,
  demoMismatch,
  onDone,
}: {
  title: string;
  first: string;
  second: string;
  cta: string;
  demoMismatch?: boolean;
  onDone: () => void;
}) {
  const [a, setA] = useState(demoMismatch ? "Paywize@2026" : "");
  const [b, setB] = useState(demoMismatch ? "Paywize" : "");
  const strong = STRONG.test(a);
  const mismatch = !!b && a !== b;
  return (
    <AuthForm title={title}>
      <PasswordInput label={first} value={a} onChange={setA} placeholder="Enter password" autoFocus />
      <PasswordInput
        label={second}
        value={b}
        onChange={setB}
        placeholder="Re-enter password"
        error={mismatch ? "Passwords do not match." : undefined}
        onEnter={() => strong && a === b && onDone()}
      />
      <p className="t-12r text-ink-2">Use 8+ characters with an uppercase letter, a number and a symbol.</p>
      <Button size="lg" full disabled={!strong || a !== b} onClick={onDone}>
        {cta}
      </Button>
      <HelpFooter />
    </AuthForm>
  );
}

export function SignupPassword({ s, go }: Ctx) {
  return (
    <PasswordFields
      title="Create a password"
      first="Password"
      second="Confirm password"
      cta="Continue"
      demoMismatch={s.authCode === "incorrect"}
      onDone={() => go("S.6", { authCode: "" })}
    />
  );
}

const ROLES = [
  { value: "owner", label: "Owner or proprietor" },
  { value: "director", label: "Director or partner" },
  { value: "ceo", label: "CEO or founder" },
  { value: "cfo", label: "CFO or finance head" },
  { value: "accountant", label: "Accountant or CA" },
  { value: "employee", label: "Employee or consultant" },
];

/** Owners and directors sign for the business. CEOs and CFOs may or may not. Everyone else hands those steps over. */
export function SignerRole({ s, replace, toast }: Ctx) {
  const [role, setRole] = useState(s.signerRole);
  const [signs, setSigns] = useState(s.signerRole ? (s.isSignatory ? "yes" : "no") : "");
  const ask = role === "ceo" || role === "cfo";
  const always = role === "owner" || role === "director";
  const isSignatory = always || (ask && signs === "yes");
  const decided = !!role && (!ask || !!signs);
  return (
    <AuthForm title="Who is signing up?">
      <p className="t-14r text-ink-2">So we ask the right person for each verification.</p>
      <Select label="Your role in the business" placeholder="Select your role" value={role} onChange={setRole} options={ROLES} />
      {ask && (
        <fieldset className="flex flex-col gap-2">
          <legend className="t-12s mb-2 text-ink">Are you the authorised signatory?</legend>
          <RadioInline
            name="signatory"
            value={signs}
            onChange={setSigns}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
        </fieldset>
      )}
      {decided && !isSignatory && (
        <Alert tone="info" dismissible={false}>
          You can fill in the application. A director or authorised signatory must complete eSign and face verification, and we will share a link with them.
        </Alert>
      )}
      <Button
        size="lg"
        full
        disabled={!decided}
        onClick={() => {
          toast("Account created", "Next, verify your business.");
          replace("2.0", { signerRole: role, isSignatory, history: [] });
        }}
      >
        Continue
      </Button>
      <HelpFooter />
    </AuthForm>
  );
}

/* ───────────────────────── Sign in and forgot password ───────────────────────── */

export function SignIn({ s, go, replace, toast }: Ctx) {
  const [id, setId] = useState(s.email || s.mobile);
  const [password, setPassword] = useState("");
  const [idError, setIdError] = useState("");
  const [error, setError] = useState("");
  const next = () => {
    if (!EMAIL.test(id.trim()) && !MOBILE.test(digits(id))) return setIdError("Enter a valid mobile number or email.");
    if (!password) return setError("Enter your password.");
    go("I.2", { authCode: "" });
  };
  return (
    <AuthForm title="Sign in to your account">
      <Input
        label="Mobile number or email"
        value={id}
        autoFocus
        placeholder="Enter mobile number or email"
        error={idError}
        onChange={(v) => {
          setId(v);
          setIdError("");
        }}
      />
      <PasswordInput
        label="Password"
        value={password}
        placeholder="Enter password"
        error={error}
        onEnter={next}
        onChange={(v) => {
          setPassword(v);
          setError("");
        }}
      />
      <div className="flex justify-end">
        <button type="button" onClick={() => go("F.1")} className="t-14s text-brand">
          Forgot password?
        </button>
      </div>
      <Button size="lg" full onClick={next}>
        Continue
      </Button>
      <SocialButtons
        onPick={(p) => {
          toast(`Signed in with ${p}`);
          replace(s.resume || "2.0", { resume: "", history: [] });
        }}
      />
      <Footer text="New to Paywize?" link="Create account" onClick={() => replace("S.1", { history: [] })} />
    </AuthForm>
  );
}

export function SignInCode({ s, replace, back, toast }: Ctx) {
  return (
    <CodeStep
      title="Verify it's you"
      text="Enter the 6-digit code sent to your registered mobile or email"
      initial={s.authCode}
      toast={toast}
      onChange={back}
      onVerified={() => {
        toast("Welcome back", s.resume ? "Picking up where you left off." : undefined);
        replace(s.resume || "2.0", { resume: "", authCode: "", history: [] });
      }}
    />
  );
}

export function ForgotPassword({ s, go, replace }: Ctx) {
  const [id, setId] = useState(s.email || s.mobile);
  const [error, setError] = useState("");
  const next = () => {
    if (!EMAIL.test(id.trim()) && !MOBILE.test(digits(id))) return setError("Enter a valid mobile number or email.");
    go("F.2", { authCode: "" });
  };
  return (
    <AuthForm title="Reset your password">
      <Input
        label="Mobile number or email"
        value={id}
        autoFocus
        placeholder="you@company.com"
        error={error}
        onEnter={next}
        onChange={(v) => {
          setId(v);
          setError("");
        }}
      />
      <Button size="lg" full onClick={next}>
        Send code
      </Button>
      <Footer text="Remembered it?" link="Back to sign in" onClick={() => replace("I.1", { history: [] })} />
    </AuthForm>
  );
}

export function ForgotCode({ s, go, back, toast }: Ctx) {
  return (
    <CodeStep
      title="Check your inbox"
      text="Enter the 6-digit code we sent to reset your password"
      initial={s.authCode}
      toast={toast}
      onChange={back}
      onVerified={() => go("F.3", { authCode: "" })}
    />
  );
}

export function NewPassword({ replace, toast }: Ctx) {
  return (
    <PasswordFields
      title="Set a new password"
      first="New password"
      second="Confirm new password"
      cta="Update password"
      onDone={() => {
        toast("Password updated", "Sign in with your new password.");
        replace("I.1", { history: [] });
      }}
    />
  );
}

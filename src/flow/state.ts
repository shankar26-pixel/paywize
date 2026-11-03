import { lookupPan, type Entity, type PanRecord } from "./data";

export type DocState = {
  status: "missing" | "uploading" | "uploaded" | "verified" | "rejected" | "error" | "review";
  file?: string;
  size?: string;
  note?: string;
};

export type Person = { id: string; name: string; role: string; invited?: boolean; flagged?: boolean };

export type Collection = "web" | "app" | "links" | "qr";

export type Modal =
  | null
  | "confirm-company"
  | "confirm-individual"
  | "invite"
  | "bank-proof"
  | "edit-business"
  | "edit-pan"
  | "edit-stakeholders"
  | "edit-bank"
  | "edit-storefront"
  | "esign";

export type FlowState = {
  screen: string;
  history: string[];
  modal: Modal;

  // Stage 2
  pan: string;
  panError: "" | "E1" | "E2" | "E3";
  record: PanRecord | null;
  gst: string;
  reg: string;
  includeGst: boolean;
  noGst: boolean;
  nameMismatch: boolean;
  signupName: string;
  lob: string;
  docs: Record<string, DocState>;
  addrMethod: string;
  addrDocs: Record<string, DocState>;
  proof: string;
  proofError: boolean;
  portfolio: string;
  engagement: DocState;

  // Stage 3
  people: Person[];
  kycOwner: string;
  kycError: boolean;
  poi: DocState;
  poa: DocState;
  pep: "no" | "yes";
  pepRole: string;
  pepCountry: string;
  pepFunds: string;
  pepError: boolean;

  // Stage 4
  acct: string;
  acct2: string;
  ifsc: string;
  holder: string;
  bankProof: DocState;

  // Stage 5
  /** Every way the merchant will collect; a merchant can use several. */
  collections: Collection[];
  site: string;
  app: string;
  payLink: string;
  invoice: DocState;
  urlError: string;
  appError: string;
  policies: boolean[];
  grievanceName: string;
  grievanceEmail: string;
  grievanceError: boolean;

  // Stage 6–8
  confirm: boolean;
  cpvMode: "video" | "visit";
  cpvDay: string;
  cpvTime: string;
  signed: boolean[];
  signing: number;
  tests: number;
  today: number;
  live: number;
};

export const MISSING: DocState = { status: "missing" };

export function initialState(): FlowState {
  return {
    screen: "2.0",
    history: [],
    modal: null,
    pan: "",
    panError: "",
    record: null,
    gst: "",
    reg: "",
    includeGst: true,
    noGst: false,
    nameMismatch: false,
    signupName: "Rohit S",
    lob: "",
    docs: {},
    addrMethod: "digilocker",
    addrDocs: {},
    proof: "",
    proofError: false,
    portfolio: "",
    engagement: MISSING,
    people: [
      { id: "sana", name: "Sana Iyer", role: "Director · from MCA" },
      { id: "karan", name: "Karan Nair", role: "Director · from MCA" },
      { id: "dev", name: "Dev Malhotra", role: "Ultimate beneficial owner" },
    ],
    kycOwner: "",
    kycError: false,
    poi: MISSING,
    poa: MISSING,
    pep: "no",
    pepRole: "",
    pepCountry: "IN",
    pepFunds: "",
    pepError: false,
    acct: "",
    acct2: "",
    ifsc: "",
    holder: "",
    bankProof: MISSING,
    collections: ["web"],
    site: "",
    app: "",
    payLink: "",
    invoice: MISSING,
    urlError: "",
    appError: "",
    policies: [false, false, false, false],
    grievanceName: "",
    grievanceEmail: "",
    grievanceError: false,
    confirm: false,
    cpvMode: "video",
    cpvDay: "",
    cpvTime: "",
    signed: [false, false, false],
    signing: 0,
    tests: 4,
    today: 2,
    live: 7,
  };
}

/** Header step (n / 6) for each screen id, as shown in the Figma frames. */
export function stepOf(screen: string): number {
  if (screen.startsWith("2.")) return 1;
  if (screen.startsWith("3.")) return 2;
  if (screen.startsWith("4.")) return 3;
  if (screen.startsWith("5.")) return 4;
  // Review and sign: review, any missing item, then the MSA e-sign.
  if (screen === "6.0" || screen.startsWith("6.0.") || screen === "6.E1" || screen.startsWith("7.")) return 5;
  // Verification and go-live: face, CPV, screening, decision, sandbox.
  return 6;
}

/**
 * How far through the whole flow a screen is, on a 0–6 scale (one unit per header step).
 * Error and edge states share the progress of the screen they belong to, via the longest matching prefix.
 */
const PROGRESS: Record<string, number> = {
  "2.0": 0.1,
  "2.1A": 0.35,
  "2.1B": 0.35,
  "2.2A": 0.6,
  "2.2B": 0.45,
  "2.2B.1": 0.55,
  "2.2B.F": 0.6,
  "2.2B.2": 0.55,
  "2.2B.E": 0.55,
  "2.2B.3": 0.7,
  "2.2B.4": 0.85,
  "2.2B.5": 0.85,
  "3.0": 1.15,
  "3.1": 1.45,
  "3.1.1": 1.6,
  "3.1.2": 1.6,
  "3.2": 1.75,
  "3.2.2": 1.9,
  "4.0": 2.15,
  "4.1": 2.45,
  "4.1.1": 2.85,
  "4.1.2": 2.6,
  "4.1.3": 2.7,
  "4.1.4": 2.85,
  "5.0": 3.15,
  "5.1": 3.7,
  "6.0": 4.2,
  "6.E1": 4.2,
  "7.0": 4.55,
  "7.2": 4.8,
  "7.3": 4.95,
  "6.8": 5.05,
  "6.8.1": 5.12,
  "6.8.2": 5.2,
  "6.5": 5.3,
  "6.6": 5.4,
  "6.1": 5.5,
  "6.2": 5.55,
  "6.3": 5.55,
  "6.4": 5.55,
  "6.E": 5.55,
  "6.7": 5.6,
  "8.0": 5.7,
  "8.1": 5.8,
  "8.2": 5.9,
  "8.3": 6,
  "8.E": 6,
};

/**
 * Where Back goes when there is no history (screen opened from the index or a ?screen= link).
 * Matched by longest prefix, so error and edge states fall back to the screen they belong to.
 */
const PARENT: Record<string, string> = {
  "2.1A": "2.0",
  "2.1B": "2.0",
  "2.2A": "2.0",
  "2.2B": "2.0",
  "2.2B.1": "2.2B",
  "2.2B.F": "2.2B.1",
  "2.2B.2": "2.2B",
  "2.2B.E": "2.2B",
  "2.2B.3": "2.2B",
  "2.2B.4": "2.2B.3",
  "2.2B.5": "2.2B.3",
  "3.0": "2.2A",
  "3.0.E": "3.0",
  "3.0.2": "2.2B.3",
  "3.1": "3.0",
  "3.2": "3.0",
  "3.2.1": "3.2",
  "3.2.2": "3.2",
  "3.2.E": "3.2",
  "4.0": "3.2",
  "4.1": "4.0",
  "5.0": "4.0",
  "5.0.E": "5.0",
  "5.1": "5.0",
  "6.0": "5.1",
  "6.E1": "6.0",
  "7.0": "6.0",
  "7.3": "7.0",
  "6.8": "7.3",
  "6.8.1": "6.8",
  "6.8.2": "6.8.1",
  "6.8.E": "6.8",
  "6.5": "6.8",
  "6.6": "6.5",
  "6.1": "6.6",
  "6.2": "6.1",
  "6.3": "6.2",
  "6.4": "6.2",
  "6.E": "6.2",
  "6.E2": "6.6",
  "6.7": "6.2",
  "8.0": "6.7",
  "8.1": "8.0",
  "8.2": "8.1",
  "8.3": "8.2",
  "8.E": "8.3",
  "8.E3": "8.1",
};

export function parentScreen(screen: string, entity?: Entity): string | null {
  let best = "";
  for (const k of Object.keys(PARENT)) if (screen.startsWith(k) && k.length > best.length) best = k;
  if (!best) return null;
  const to = PARENT[best];
  // Individuals skip the company documents and key-persons list.
  if (entity === "individual" && to === "2.2A") return "2.2B.3";
  if (entity === "individual" && to === "3.0") return "3.0.2";
  return to;
}

export function progressOf(screen: string): number {
  let best = "";
  for (const k of Object.keys(PROGRESS)) if (screen.startsWith(k) && k.length > best.length) best = k;
  return best ? PROGRESS[best] : stepOf(screen) - 1;
}

export const SCREENS: { stage: string; items: [string, string][] }[] = [
  {
    stage: "Stage 2 · PAN, GST and CIN",
    items: [
      ["2.0", "PAN entry"],
      ["2.0.G1", "Several GST numbers found"],
      ["2.0.G3", "GST and CIN selected"],
      ["2.0.G5", "Partnership: no CIN"],
      ["2.0.G6", "LLP: LLPIN instead of CIN"],
      ["2.0.G7", "Single GST and CIN"],
      ["2.0.E1", "Invalid PAN format"],
      ["2.0.E2", "PAN not found"],
      ["2.0.E3", "Entity type not supported"],
    ],
  },
  {
    stage: "Stage 2 · Branch A",
    items: [
      ["2.1A", "Corporate master review"],
      ["2.1A.E1", "MCA lookup failed"],
      ["2.1A.E2", "No GSTIN found"],
      ["2.1A.E3", "Company not active"],
      ["2.2A", "Mandatory documents"],
      ["2.2A.1", "LLP version"],
      ["2.2A.2", "Food: FSSAI required"],
      ["2.2A.3", "Healthcare: Drug licence"],
      ["2.2A.4", "Finance: RBI or SEBI"],
      ["2.2A.5", "Documents uploaded"],
      ["2.2A.E1", "Resolution not signed"],
      ["2.2A.E2", "Document not readable"],
    ],
  },
  {
    stage: "Stage 2 · Branch B",
    items: [
      ["2.1B", "Individual identity review"],
      ["2.1B.E1", "Name mismatch"],
      ["2.2B", "Address proof method"],
      ["2.2B.1", "DigiLocker consent"],
      ["2.2B.2", "Upload your document"],
      ["2.2B.3", "Proof of doing business"],
      ["2.2B.4", "Portfolio link"],
      ["2.2B.5", "Upload engagement proof"],
      ["2.2B.E1", "Document not readable"],
      ["2.2B.E2", "DigiLocker failed"],
      ["2.2B.E3", "No proof chosen"],
    ],
  },
  {
    stage: "Stage 3 · Stakeholders, CKYC, PEP",
    items: [
      ["3.0", "Key persons"],
      ["3.0.1", "Invite a beneficial owner"],
      ["3.0.2", "Individual applicant"],
      ["3.0.E1", "No one selected"],
      ["3.0.E2", "Director flagged"],
      ["3.1", "CKYC check"],
      ["3.1.1", "CKYC record found"],
      ["3.1.2", "Not found: upload proofs"],
      ["3.1.E1", "Registry unavailable"],
      ["3.1.E2", "Details do not match"],
      ["3.2", "PEP declaration"],
      ["3.2.1", "PEP: Yes"],
      ["3.2.2", "Closer review noted"],
      ["3.2.E1", "Declaration incomplete"],
    ],
  },
  {
    stage: "Stage 4 · Settlement bank",
    items: [
      ["4.0", "Account details"],
      ["4.0.1", "IFSC resolved"],
      ["4.0.E1", "IFSC not found"],
      ["4.0.E2", "Account numbers differ"],
      ["4.1", "Penny drop in progress"],
      ["4.1.1", "Verified"],
      ["4.1.2", "Name mismatch"],
      ["4.1.3", "Upload cheque or statement"],
      ["4.1.4", "Sent to manual review"],
      ["4.1.E1", "Deposit failed"],
      ["4.1.E2", "Proof not readable"],
    ],
  },
  {
    stage: "Stage 5 · Storefront",
    items: [
      ["5.0", "Collection method"],
      ["5.0.1", "Website link (inline)"],
      ["5.0.2", "App link (inline)"],
      ["5.0.3", "Payment links and QR (inline)"],
      ["5.0.E1", "Site unreachable"],
      ["5.0.E2", "Content differs from category"],
      ["5.1", "Policy acknowledgment"],
      ["5.1.1", "All confirmed"],
      ["5.1.E1", "Page not found on site"],
      ["5.1.E2", "Grievance officer missing"],
    ],
  },
  {
    stage: "Stage 6 · Review and sign",
    items: [
      ["6.0", "Review and submit"],
      ["6.0.1", "Edit business details"],
      ["6.0.2", "Edit PAN"],
      ["6.0.3", "Edit stakeholders"],
      ["6.0.4", "Edit settlement bank"],
      ["6.0.5", "Edit storefront"],
      ["6.E1", "Missing item before submit"],
      ["7.0", "E-sign documents"],
      ["7.1", "Aadhaar eSign popup"],
      ["7.2", "All documents signed"],
      ["7.3", "MSA signed"],
    ],
  },
  {
    stage: "Stage 7 · Face and CPV verification",
    items: [
      ["6.8", "Face verification: tips"],
      ["6.8.1", "Live selfie with prompts"],
      ["6.8.2", "Checking the selfie"],
      ["6.8.E1", "Camera blocked"],
      ["6.8.E2", "Face did not match"],
      ["6.5", "Book CPV (video call or visit)"],
      ["6.6", "CPV slot confirmed"],
      ["6.E2", "CPV missed"],
    ],
  },
  {
    stage: "Stage 7 · Screening and decision",
    items: [
      ["6.1", "Screening in progress"],
      ["6.2", "Submitted"],
      ["6.3", "Additional verification"],
      ["6.4", "Document deficiency"],
      ["6.E3", "Unable to proceed"],
      ["6.E4", "Application rejected"],
      ["6.7", "Approved"],
    ],
  },
  {
    stage: "Stage 8 · Sandbox and probation",
    items: [
      ["8.0", "Sandbox mode active"],
      ["8.1", "Test transactions"],
      ["8.1.1", "Test transaction 5 of 10"],
      ["8.2", "First live transactions"],
      ["8.2.1", "Live transaction 8 of 10"],
      ["8.3", "Probation complete"],
      ["8.E1", "Re-KYC reminder, 60 days"],
      ["8.E2", "Re-KYC reminder, 7 days"],
      ["8.E3", "Probation limit reached"],
    ],
  },
];

const up = (file: string, size: string): DocState => ({ status: "uploaded", file, size });

function withPan(s: FlowState, pan: string, selectFirst = true): FlowState {
  const r = lookupPan(pan);
  if (!r.ok) return { ...s, pan, panError: r.code, record: null };
  const rec = r.record;
  const pick = (opts: typeof rec.gsts) => (opts.length === 1 || selectFirst ? (opts.find((o) => !o.disabled)?.value ?? "") : "");
  return { ...s, pan, panError: "", record: rec, gst: pick(rec.gsts), reg: pick(rec.regs) };
}

/** A fully filled company application, used as the base for jumping to any screen. */
function filled(): FlowState {
  const s = withPan(initialState(), "AAACN1234Q");
  return {
    ...s,
    lob: "retail",
    docs: { coi: up("Certificate_of_incorporation.pdf", "1.2 MB"), board: up("Board_resolution_signed.pdf", "860 KB") },
    kycOwner: "sana",
    acct: "50100234564821",
    acct2: "50100234564821",
    ifsc: "HDFC0001234",
    holder: "NIMBUS FOODS PRIVATE LIMITED",
    site: "https://nimbusfoods.in",
    policies: [true, true, true, true],
  };
}

/** Builds the state needed to show any screen id directly (used by the screen index). */
export function presetFor(id: string): FlowState {
  let s = filled();
  const go = (screen: string, extra: Partial<FlowState> = {}): FlowState => ({ ...s, ...extra, screen, history: [] });
  const individual = () => withPan({ ...s, people: [], kycOwner: "" }, "AKPPS4821R");

  switch (id) {
    case "2.0":
      return go("2.0", { ...initialState(), screen: "2.0" });
    case "2.0.G1":
      s = withPan({ ...initialState() }, "AAACN1234Q", false);
      return go("2.0");
    case "2.0.G3":
      return go("2.0");
    case "2.0.G5":
      s = withPan({ ...initialState() }, "AAAFS5821K", false);
      return go("2.0");
    case "2.0.G6":
      s = withPan({ ...initialState() }, "AAAFS6120M", false);
      return go("2.0");
    case "2.0.G7":
      s = withPan({ ...initialState() }, "AABCN1234M");
      return go("2.0");
    case "2.0.E1":
      return go("2.0", { ...initialState(), pan: "AACN1234", panError: "E1" });
    case "2.0.E2":
      return go("2.0", { ...initialState(), pan: "AAACN0000Q", panError: "E2" });
    case "2.0.E3":
      return go("2.0", { ...initialState(), pan: "AAATN1234Q", panError: "E3" });
    case "2.1A":
      return go("2.0", { modal: "confirm-company" });
    case "2.1A.E1":
    case "2.1A.E2":
    case "2.1A.E3":
      return go(id);
    case "2.2A":
      return go("2.2A", { docs: {}, lob: "" });
    case "2.2A.1":
      s = withPan(s, "AAAFS6120M");
      return go("2.2A", { docs: {}, lob: "" });
    case "2.2A.2":
      return go("2.2A", { docs: {}, lob: "food" });
    case "2.2A.3":
      return go("2.2A", { docs: {}, lob: "health" });
    case "2.2A.4":
    case "2.2A.5":
      return go("2.2A", {
        lob: "finance",
        docs: { ...s.docs, rbi: up("RBI_registration_certificate.pdf", "2.1 MB") },
      });
    case "2.2A.E1":
      return go("2.2A.E1");
    case "2.2A.E2":
      return go("2.2A.E2");
    case "2.1B":
      s = individual();
      return go("2.0", { modal: "confirm-individual" });
    case "2.1B.E1":
      s = individual();
      return go("2.0", { modal: "confirm-individual", nameMismatch: true });
    case "2.2B":
    case "2.2B.1":
    case "2.2B.2":
    case "2.2B.3":
    case "2.2B.4":
    case "2.2B.5":
    case "2.2B.E2":
      s = individual();
      return go(id, id === "2.2B.4" ? { portfolio: "https://behance.net/rohitsharma", proof: "portfolio" } : {});
    case "2.2B.E1":
      s = individual();
      return go("2.2B.2", {
        addrMethod: "passport",
        addrDocs: { front: { status: "error", note: "Edges are cropped. Retake in good light." } },
      });
    case "2.2B.E3":
      s = individual();
      return go("2.2B.3", { proof: "", proofError: true });
    case "3.0":
      return go("3.0", { kycOwner: "sana" });
    case "3.0.1":
      return go("3.0", { kycOwner: "sana", modal: "invite" });
    case "3.0.2":
      s = individual();
      return go("3.0.2");
    case "3.0.E1":
      return go("3.0", { kycOwner: "", kycError: true });
    case "3.0.E2":
      return go("3.0.E2");
    case "3.1":
    case "3.1.1":
    case "3.1.E1":
      return go(id);
    case "3.1.2":
      return go("3.1.2", { poi: MISSING, poa: MISSING });
    case "3.1.E2":
      return go("3.1.2", { poi: { status: "error", note: "The name does not match your PAN." }, poa: MISSING });
    case "3.2":
      return go("3.2");
    case "3.2.1":
      return go("3.2.1", { pep: "yes", pepRole: "Member of a state legislative body" });
    case "3.2.2":
      return go("3.2.2", { pep: "yes" });
    case "3.2.E1":
      return go("3.2.1", { pep: "yes", pepRole: "", pepError: true });
    case "4.0":
      return go("4.0", { acct: "", acct2: "", ifsc: "" });
    case "4.0.1":
      return go("4.0");
    case "4.0.E1":
      return go("4.0", { ifsc: "HDFX0001234" });
    case "4.0.E2":
      return go("4.0", { acct2: "50100234564812" });
    case "4.1":
    case "4.1.1":
    case "4.1.4":
    case "4.1.E1":
      return go(id);
    case "4.1.2":
      return go("4.1.2", { modal: "bank-proof" });
    case "4.1.3":
      return go("4.1.3", { bankProof: MISSING });
    case "4.1.E2":
      return go("4.1.3", { bankProof: { status: "error", note: "The account number is cut off. Scan the full page." } });
    case "5.0":
      return go("5.0");
    case "5.0.1":
      return go("5.0", { collections: ["web"] });
    case "5.0.2":
      return go("5.0", { collections: ["web", "app"], app: "https://play.google.com/store/apps/details?id=in.nimbus" });
    case "5.0.3":
      return go("5.0", { collections: ["web", "links", "qr"] });
    case "5.0.E1":
      return go("5.0", { site: "http://nimbusfoods", urlError: "We could not open this page. Check that it is live and uses https." });
    case "5.0.E2":
      return go("5.0.E2");
    case "5.1":
      return go("5.1", { policies: [false, false, false, false] });
    case "5.1.1":
      return go("5.1");
    case "5.1.E1":
    case "5.1.E2":
      return go(id);
    case "6.0":
      return go("6.0");
    case "6.0.1":
      return go("6.0", { modal: "edit-business" });
    case "6.0.2":
      return go("6.0", { modal: "edit-pan" });
    case "6.0.3":
      return go("6.0", { modal: "edit-stakeholders" });
    case "6.0.4":
      return go("6.0", { modal: "edit-bank" });
    case "6.0.5":
      return go("6.0", { modal: "edit-storefront" });
    case "6.6":
      return go("6.6", { cpvMode: "video", cpvDay: "Tomorrow", cpvTime: "11:00 AM" });
    case "6.5":
      return go("6.5", { cpvDay: "", cpvTime: "" });
    case "7.0":
      return go("7.0", { signed: [false, false, false] });
    case "7.1":
      return go("7.0", { signed: [false, false, false], modal: "esign", signing: 0 });
    case "7.2":
      return go("7.0", { signed: [true, true, true] });
    case "8.1":
      return go("8.1", { tests: 4, today: 2 });
    case "8.1.1":
      return go("8.1", { tests: 5, today: 3 });
    case "8.2":
      return go("8.2", { live: 7 });
    case "8.2.1":
      return go("8.2", { live: 8 });
    default:
      return go(id);
  }
}

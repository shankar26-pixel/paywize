import type { SelectOption } from "@/components/ui/ds";

export type Entity = "company" | "firm" | "llp" | "individual";

export type PanRecord = {
  entity: Entity;
  name: string;
  displayName: string;
  gsts: SelectOption[];
  /** CIN for companies, LLPIN for LLPs, none for firms and individuals. */
  regs: SelectOption[];
  incorporated?: string;
  office?: string;
  dob?: string;
  /** Demo hooks for MCA outcomes after the merchant presses Continue. */
  mca?: "down" | "struck-off" | "no-gst";
};

const nimbusGsts: SelectOption[] = [
  { value: "27AAACN1234Q1Z5", label: "27AAACN1234Q1Z5", hint: "Maharashtra · Principal place" },
  { value: "29AAACN1234Q1Z3", label: "29AAACN1234Q1Z3", hint: "Karnataka · Additional place" },
  { value: "24AAACN1234Q2Z1", label: "24AAACN1234Q2Z1", hint: "Gujarat · Additional place", disabled: true, status: "Cancelled" },
];
const nimbusCins: SelectOption[] = [
  { value: "U74999KA2018PTC123456", label: "U74999KA2018PTC123456", hint: "Incorporated 2018 · Private limited" },
  {
    value: "U74999KA2012PLC061002",
    label: "U74999KA2012PLC061002",
    hint: "Earlier registration · Public limited",
    disabled: true,
    status: "Struck off",
  },
];

const company = (over: Partial<PanRecord> = {}): PanRecord => ({
  entity: "company",
  name: "NIMBUS FOODS PVT LTD",
  displayName: "Nimbus Foods Pvt Ltd",
  gsts: nimbusGsts,
  regs: nimbusCins,
  incorporated: "04 May 2018",
  office: "Indiranagar, Bengaluru 560038",
  ...over,
});

/** Demo PANs. Any other well-formed PAN is routed by its 4th character. */
export const PAN_DIRECTORY: Record<string, PanRecord> = {
  AAACN1234Q: company(),
  AABCN1234M: company({
    gsts: [{ value: "29AABCN1234M1Z7", label: "29AABCN1234M1Z7", hint: "Karnataka · Principal place" }],
    regs: [{ value: "U74999KA2018PTC123456", label: "U74999KA2018PTC123456", hint: "Incorporated 2018 · Private limited" }],
  }),
  AAAFS5821K: {
    entity: "firm",
    name: "SHARMA & SONS TRADERS",
    displayName: "Sharma & Sons Traders",
    gsts: [
      { value: "27AAAFS5821K1Z7", label: "27AAAFS5821K1Z7", hint: "Maharashtra · Principal place" },
      { value: "27AAAFS5821K2Z6", label: "27AAAFS5821K2Z6", hint: "Maharashtra · Additional place" },
    ],
    regs: [],
    incorporated: "12 Jan 2016",
    office: "Dadar West, Mumbai 400028",
  },
  AAAFS6120M: {
    entity: "llp",
    name: "SHARMA & CO LLP",
    displayName: "Sharma & Co LLP",
    gsts: [
      { value: "29AAAFS6120M1Z4", label: "29AAAFS6120M1Z4", hint: "Karnataka · Principal place" },
      { value: "33AAAFS6120M1Z0", label: "33AAAFS6120M1Z0", hint: "Tamil Nadu · Additional place" },
    ],
    regs: [
      { value: "AAB-1234", label: "AAB-1234", hint: "Incorporated 2019 · LLP" },
      { value: "AAA-0871", label: "AAA-0871", hint: "Earlier registration · LLP", disabled: true, status: "Struck off" },
    ],
    incorporated: "18 Jul 2019",
    office: "Koramangala, Bengaluru 560034",
  },
  AKPPS4821R: {
    entity: "individual",
    name: "ROHIT SHARMA",
    displayName: "Rohit Sharma",
    gsts: [{ value: "29ABCPR1234F1Z2", label: "29ABCPR1234F1Z2", hint: "Karnataka · Principal place" }],
    regs: [],
    dob: "14 Mar 1994",
  },
  AAACM1234D: company({ mca: "down" }),
  AAACG1234N: company({ mca: "no-gst", gsts: [] }),
  AAACZ1234S: company({ name: "ZENITH TRADING PVT LTD", displayName: "Zenith Trading Pvt Ltd", mca: "struck-off" }),
};

export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export type PanLookup =
  | { ok: true; record: PanRecord }
  | { ok: false; code: "E1" | "E2" | "E3" };

export function lookupPan(pan: string): PanLookup {
  if (!PAN_PATTERN.test(pan)) return { ok: false, code: "E1" };
  const known = PAN_DIRECTORY[pan];
  if (known) return { ok: true, record: known };
  if (pan.slice(5, 9) === "0000") return { ok: false, code: "E2" };
  const t = pan[3];
  if (t === "C") return { ok: true, record: company() };
  if (t === "F") return { ok: true, record: PAN_DIRECTORY.AAAFS5821K };
  if (t === "P") return { ok: true, record: PAN_DIRECTORY.AKPPS4821R };
  return { ok: false, code: "E3" };
}

export const PAN_ERRORS = {
  E1: "Enter a valid PAN. It has 10 characters, like AAACN1234Q.",
  E2: "We could not find an active PAN with this number. Check it and try again.",
  E3: "We cannot onboard this type of PAN yet. We support companies, firms, LLPs and individuals.",
} as const;

export const LINES_OF_BUSINESS: SelectOption[] = [
  { value: "retail", label: "Retail and e-commerce" },
  { value: "food", label: "Food and beverage" },
  { value: "health", label: "Healthcare and pharma" },
  { value: "finance", label: "Finance and lending" },
  { value: "education", label: "Education" },
  { value: "software", label: "Software and IT services" },
  { value: "travel", label: "Travel and hospitality" },
  { value: "services", label: "Professional services" },
];

export type DocSpec = { key: string; title: string; hint: string };

export function requiredDocs(entity: Entity): DocSpec[] {
  if (entity === "llp")
    return [
      { key: "llp", title: "LLP Agreement", hint: "PDF, JPG or PNG up to 5 MB" },
      { key: "loa", title: "Letter of Authority", hint: "Signed by the designated partners" },
    ];
  if (entity === "firm")
    return [
      { key: "deed", title: "Partnership deed", hint: "PDF, JPG or PNG up to 5 MB" },
      { key: "loa", title: "Letter of Authority", hint: "Signed by all partners" },
    ];
  return [
    { key: "coi", title: "Certificate of Incorporation", hint: "PDF, JPG or PNG up to 5 MB" },
    { key: "board", title: "Board resolution or Letter of Authority", hint: "Signed by the designated directors" },
  ];
}

export const LOB_DOC: Record<string, DocSpec & { subtitle: string }> = {
  food: { key: "fssai", title: "FSSAI licence", hint: "Valid and in the business name", subtitle: "Food businesses also need an FSSAI licence." },
  health: { key: "drug", title: "Drug licence", hint: "Issued by the state drug controller", subtitle: "Healthcare businesses also need a drug licence." },
  finance: {
    key: "rbi",
    title: "RBI or SEBI registration",
    hint: "Certificate of registration",
    subtitle: "Finance and lending businesses also need a regulator registration.",
  },
};

export const IFSC_BANKS: Record<string, { bank: string; short: string; branch: string }> = {
  HDFC: { bank: "HDFC Bank", short: "HDFC", branch: "Indiranagar" },
  SIBL: { bank: "South Indian Bank", short: "SIB", branch: "BTM Layout" },
  ICIC: { bank: "ICICI Bank", short: "ICICI", branch: "Koramangala" },
  SBIN: { bank: "State Bank of India", short: "SBI", branch: "MG Road" },
  UTIB: { bank: "Axis Bank", short: "Axis", branch: "HSR Layout" },
  KKBK: { bank: "Kotak Mahindra Bank", short: "Kotak", branch: "Whitefield" },
};

export const MSA_DOCS = [
  { title: "Master Services Agreement", file: "Paywize_MSA_v2.1.pdf" },
  { title: "Data Processing Addendum", file: "Data_processing_addendum.pdf" },
  { title: "Fee Schedule", file: "Fee_schedule_and_settlement_terms.pdf" },
];

export const POLICIES = [
  "Terms and conditions",
  "Privacy policy",
  "Refund, return and cancellation policy, with clear refund timeframes",
  "Contact us page with your registered address, a support email and the Grievance Officer details",
];

export const SUPPORT_EMAIL = "support@paywize.in";

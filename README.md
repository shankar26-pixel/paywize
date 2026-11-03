# Paywize merchant onboarding (v3)

Web onboarding flow from PAN entry to sandbox and go-live, built from the
"PG – Web v2" Figma file and the v2 Web Design System. Signup is out of scope.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3100. The **Screens** button (bottom right) jumps to any
screen or error state; `?screen=<id>` links straight to one, for example
`/?screen=4.1.2`.

## Demo data

| To see | Use |
|---|---|
| Several GST numbers and CINs | PAN `AAACN1234Q` |
| Single GST and CIN | PAN `AABCN1234M` |
| Partnership firm / LLP | PAN `AAAFS5821K` / `AAAFS6120M` |
| Individual | PAN `AKPPS4821R` |
| MCA down / no GSTIN / struck off | PAN `AAACM1234D` / `AAACG1234N` / `AAACZ1234S` |
| ₹1 deposit fails / name mismatch | Account number ending `0000` / `1111` |
| Wrong eSign code | `000000` |

## Where things live

- `src/flow/` – one file per stage, flow state and the screen index
- `src/flow/process.tsx` – live progress view and success animations
- `src/components/ui/ds.tsx` – design-system components
- `src/components/shell.tsx` – top bar, account menu, page layout

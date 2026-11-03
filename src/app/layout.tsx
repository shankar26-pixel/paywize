import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Paywize | Merchant onboarding",
  description: "Verify your business and go live on Paywize.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The Light/Dark choice from the account menu lives in a cookie, so the server renders the right
  // theme in the first HTML: no flash and no inline script. No cookie means follow the system.
  const saved = (await cookies()).get("pw-theme")?.value;
  const theme = saved === "light" || saved === "dark" ? saved : undefined;
  return (
    <html lang="en" data-theme={theme} className={`${figtree.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

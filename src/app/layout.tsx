import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Figtree, Playfair_Display, Plus_Jakarta_Sans, Poppins } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
// Sign up and sign in only: the brand panel and the wordmark.
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: "600", style: "italic" });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: ["600", "700"] });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: "500", style: "italic" });

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
    <html lang="en" data-theme={theme} className={`${figtree.variable} ${playfair.variable} ${jakarta.variable} ${poppins.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

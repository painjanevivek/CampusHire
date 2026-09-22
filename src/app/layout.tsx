import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { headers } from "next/headers";
import {
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
  Manrope,
} from "next/font/google";
import "./globals.css";
import { CookiePreferences } from "@/components/cookie-preferences";
import { ServiceBanner } from "@/components/service-banner";
import { ThemeSynchronizer } from "@/components/theme-toggle";

const display = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const interfaceFont = Manrope({
  subsets: ["latin"],
  variable: "--font-interface",
});

const monospace = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "CampusHire", template: "%s | CampusHire" },
  description: "Student-first campus recruitment and career readiness.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "CampusHire",
    description: "Accountable campus recruitment and career readiness.",
    type: "website",
    siteName: "CampusHire",
  },
  icons: { icon: "/icon.svg" },
};

export const dynamic = "force-dynamic";

const themeBootstrap = `(()=>{var r=document.documentElement,t=null;try{var s=localStorage.getItem("campushire-theme");if(s==="light"||s==="dark")t=s}catch(e){}if(!t){try{t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}catch(e){t="dark"}}r.dataset.theme=t})()`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} ${interfaceFont.variable} ${monospace.variable}`}>
        <Script id="campushire-theme-bootstrap" nonce={nonce} strategy="beforeInteractive">
          {themeBootstrap}
        </Script>
        <ThemeSynchronizer />
        <a className="skipLink" href="#main-content">Skip to main content</a>
        <Suspense fallback={null}><ServiceBanner /></Suspense>
        {children}
        <CookiePreferences />
      </body>
    </html>
  );
}

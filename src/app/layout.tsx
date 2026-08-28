import type { Metadata } from "next";
import {
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
  Montserrat,
} from "next/font/google";
import "./globals.css";
import { ServiceBanner } from "@/components/service-banner";

const display = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const interfaceFont = Montserrat({
  subsets: ["latin"],
  variable: "--font-interface",
});

const monospace = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "CampusHire AI", template: "%s | CampusHire AI" },
  description: "Student-first campus recruitment and career readiness.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "CampusHire AI",
    description: "Accountable campus recruitment and career readiness.",
    type: "website",
    siteName: "CampusHire AI",
  },
  icons: { icon: "/icon.svg" },
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${display.variable} ${body.variable} ${interfaceFont.variable} ${monospace.variable}`}>
        <a className="skipLink" href="#main-content">Skip to main content</a>
        <ServiceBanner />
        {children}
      </body>
    </html>
  );
}

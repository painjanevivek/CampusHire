import type { Metadata } from "next";
import {
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
  Montserrat,
} from "next/font/google";
import "./globals.css";

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
  title: { default: "CampusHire AI", template: "%s | CampusHire AI" },
  description: "Student-first campus recruitment and career readiness.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${interfaceFont.variable} ${monospace.variable}`}>
        <a className="skipLink" href="#main-content">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}

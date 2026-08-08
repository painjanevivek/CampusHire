import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CampusHire AI", template: "%s | CampusHire AI" },
  description: "Student-first campus recruitment and career readiness.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skipLink" href="#main-content">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}

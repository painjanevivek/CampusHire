"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, FileCheck2, Scale } from "lucide-react";

import { OpportunitySearch } from "@/components/search/opportunity-search";
import { trackProductEvent } from "@/lib/product-analytics";
import styles from "./editorial-landing.module.css";

export function EditorialLanding() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");

  function findOpportunities(values: { keyword: string; location: string }) {
    const params = new URLSearchParams();
    if (values.keyword) params.set("q", values.keyword);
    if (values.location) params.set("location", values.location);
    trackProductEvent("opportunity_view");
    router.push(`/opportunities?${params.toString()}`);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/" aria-label="CampusHire home">
            <span aria-hidden="true">C</span><strong>CampusHire</strong>
          </Link>
          <nav aria-label="Primary navigation">
            <Link aria-current="page" href="/">Home</Link>
            <Link href="/opportunities">Find opportunities</Link>
            <a href="#readiness">Placement readiness</a>
          </nav>
          <div className={styles.headerActions}>
            <Link href="/sign-in">Sign in</Link>
            <Link href="/admin/sign-in">Employers / TNP</Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className={styles.searchSection} aria-label="Opportunity search">
          <OpportunitySearch
            keyword={keyword}
            location={location}
            onKeywordChange={setKeyword}
            onLocationChange={setLocation}
            onSubmit={findOpportunities}
          />
        </section>

        <section className={styles.hero} aria-labelledby="landing-title">
          <p className={styles.eyebrow}>Campus placements, explained clearly</p>
          <h1 id="landing-title">Your next opportunity starts here.</h1>
          <p>Build a reviewed student profile, see the roles you qualify for, and know the one readiness step that matters next.</p>
          <Link href="/sign-up" onClick={() => trackProductEvent("profile_start")}>
            Create profile <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>

        <section className={styles.trust} id="readiness" aria-labelledby="trust-title">
          <header>
            <p>Why CampusHire</p>
            <h2 id="trust-title">Evidence before scores.</h2>
          </header>
          <div className={styles.trustGrid}>
            <article>
              <BadgeCheck aria-hidden="true" />
              <h3>Formal eligibility</h3>
              <p>Required rules are checked separately and shown line by line.</p>
            </article>
            <article>
              <Scale aria-hidden="true" />
              <h3>Role match</h3>
              <p>Reviewed skills and projects explain fit only after eligibility.</p>
            </article>
            <article>
              <FileCheck2 aria-hidden="true" />
              <h3>Your next action</h3>
              <p>One useful evidence gap becomes the next step in your roadmap.</p>
            </article>
          </div>
          <p className={styles.disclaimer}>A match score never decides formal eligibility.</p>
        </section>
      </main>

      <footer className={styles.footer}>
        <div><strong>CampusHire</strong><span>Student-first campus recruitment</span></div>
        <nav aria-label="Footer">
          <Link href="/privacy">Privacy and AI assistance</Link>
          <Link href="/sign-in">Student sign in</Link>
          <Link href="/admin/sign-in">TNP access</Link>
        </nav>
        <p>AI supports decisions. Deterministic rules and accountable people remain authoritative.</p>
      </footer>
    </div>
  );
}

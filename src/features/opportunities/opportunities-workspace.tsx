"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, Bookmark, CalendarDays, ChevronDown, MapPin, RotateCcw } from "lucide-react";

import { OpportunitySearch } from "@/components/search/opportunity-search";
import styles from "./opportunities-workspace.module.css";

type Opportunity = {
  id: string;
  mark: string;
  title: string;
  company: string;
  location: string;
  workMode: string;
  category: string;
  skills: string[];
  deadline: string;
  salary: string;
  match: number;
  summary: string;
};

const opportunities: Opportunity[] = [
  { id: "nexora-ai", mark: "N", title: "AI/ML Intern", company: "Nexora Labs", location: "Bengaluru", workMode: "Hybrid", category: "AI/ML", skills: ["Python", "TensorFlow", "Scikit-learn"], deadline: "25 May 2027", salary: "₹35,000 / month", match: 92, summary: "Build and evaluate practical machine-learning services with a small platform team." },
  { id: "contour-frontend", mark: "C", title: "Frontend Developer", company: "Contour Software", location: "Pune", workMode: "Hybrid", category: "Software", skills: ["React", "TypeScript", "Next.js"], deadline: "28 May 2027", salary: "₹8–10 LPA", match: 88, summary: "Create accessible, dependable product interfaces used by growing operations teams." },
  { id: "insite-data", mark: "I", title: "Data Analyst", company: "Insite Analytics", location: "Hyderabad", workMode: "On-site", category: "Data", skills: ["SQL", "Python", "Power BI"], deadline: "30 May 2027", salary: "₹7–9 LPA", match: 85, summary: "Turn operational data into trusted reports and decision-ready business insights." },
];

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className={styles.filter}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
      <ChevronDown size={15} aria-hidden="true" />
    </label>
  );
}

function RoleDetails({ opportunity }: { opportunity: Opportunity }) {
  return (
    <section className={styles.details} role="region" aria-label={`${opportunity.title} details`}>
      <div className={styles.detailTopline}>
        <span className={styles.companyMark} aria-hidden="true">{opportunity.mark}</span>
        <button type="button" aria-label={`Save ${opportunity.title}`}><Bookmark size={19} aria-hidden="true" /></button>
      </div>
      <p className={styles.company}>{opportunity.company}</p>
      <h2>{opportunity.title}</h2>
      <p className={styles.locationLine}><MapPin size={16} aria-hidden="true" /> {opportunity.location} · {opportunity.workMode}</p>
      <p className={styles.salary}>{opportunity.salary}</p>
      <Link className={styles.apply} href="/opportunities/demo">View role and apply</Link>
      <div className={styles.description}>
        <h3>About the role</h3>
        <p>{opportunity.summary}</p>
        <h3>Skills this role needs</h3>
        <ul>{opportunity.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
      </div>
      <section className={styles.eligibilityRail} aria-labelledby={`eligibility-${opportunity.id}`}>
        <p>Formal rule result</p>
        <h3 id={`eligibility-${opportunity.id}`}>Eligibility explained</h3>
        <strong><BadgeCheck size={17} aria-hidden="true" /> Formally eligible</strong>
        <span>Your reviewed education and backlog record meet this employer’s published requirements.</span>
      </section>
      <section className={styles.match} aria-label="Role match guidance">
        <div><span>Profile match</span><strong>{opportunity.match}%</strong></div>
        <p>Your reviewed evidence includes {opportunity.skills.slice(0, 2).join(" and ")}.</p>
      </section>
      <p className={styles.disclaimer}>Match is decision support, not hiring probability.</p>
    </section>
  );
}

export function OpportunitiesWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [location, setLocation] = useState(() => searchParams.get("location") ?? "");
  const [role, setRole] = useState("All roles");
  const [workMode, setWorkMode] = useState("All modes");
  const [skill, setSkill] = useState("All skills");
  const [selectedId, setSelectedId] = useState(opportunities[0].id);

  const matches = useMemo(() => opportunities.filter((opportunity) => {
    const searchable = `${opportunity.title} ${opportunity.company} ${opportunity.skills.join(" ")}`.toLowerCase();
    return (!query || searchable.includes(query.toLowerCase()))
      && (!location || opportunity.location.toLowerCase().includes(location.toLowerCase()))
      && (role === "All roles" || opportunity.category === role)
      && (workMode === "All modes" || opportunity.workMode === workMode)
      && (skill === "All skills" || opportunity.skills.includes(skill));
  }), [location, query, role, skill, workMode]);

  const selected = matches.find((item) => item.id === selectedId) ?? matches[0];

  function submitSearch(values: { keyword: string; location: string }) {
    setQuery(values.keyword);
    setLocation(values.location);
    const params = new URLSearchParams();
    if (values.keyword) params.set("q", values.keyword);
    if (values.location) params.set("location", values.location);
    router.replace(`/opportunities${params.size ? `?${params.toString()}` : ""}`);
  }

  function clearFilters() {
    setQuery(""); setLocation(""); setRole("All roles"); setWorkMode("All modes"); setSkill("All skills");
    setSelectedId(opportunities[0].id);
    router.replace("/opportunities");
  }

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.heading}>
        <div><p>Student opportunities</p><h1>Find your next opportunity</h1></div>
        <Link href="#saved-roles"><Bookmark size={17} aria-hidden="true" /> Saved roles</Link>
      </header>

      <OpportunitySearch keyword={query} location={location} onKeywordChange={setQuery} onLocationChange={setLocation} onSubmit={submitSearch} />

      <div className={styles.filters} aria-label="Opportunity filters">
        <FilterSelect label="Role" value={role} onChange={setRole} options={["All roles", "AI/ML", "Software", "Data"]} />
        <FilterSelect label="Work mode" value={workMode} onChange={setWorkMode} options={["All modes", "Hybrid", "On-site"]} />
        <FilterSelect label="Skill" value={skill} onChange={setSkill} options={["All skills", "Python", "React", "SQL"]} />
        <button type="button" className={styles.clear} onClick={clearFilters}><RotateCcw size={16} aria-hidden="true" /> Clear filters</button>
      </div>

      <div className={styles.contentGrid}>
        <section className={styles.results} aria-labelledby="results-title">
          <div className={styles.resultsHeader}><h2 id="results-title">{matches.length} opportunities</h2><span>Most relevant</span></div>
          <div className={styles.list}>
            {matches.map((opportunity) => {
              const isSelected = selected?.id === opportunity.id;
              return (
                <button key={opportunity.id} type="button" className={`${styles.card} ${isSelected ? styles.selected : ""}`} aria-label={`${opportunity.title} at ${opportunity.company}`} aria-selected={isSelected} onClick={() => setSelectedId(opportunity.id)}>
                  <span className={styles.companyMark} aria-hidden="true">{opportunity.mark}</span>
                  <span className={styles.identity}>
                    <strong>{opportunity.title}</strong><span>{opportunity.company}</span>
                    <span className={styles.meta}><span><MapPin size={14} aria-hidden="true" />{opportunity.location} · {opportunity.workMode}</span><span><CalendarDays size={14} aria-hidden="true" />Apply by {opportunity.deadline}</span></span>
                    <span className={styles.skills}>{opportunity.skills.map((item) => <i key={item}>{item}</i>)}</span>
                  </span>
                  <span className={styles.decision}><b><BadgeCheck size={15} aria-hidden="true" /> Formally eligible</b><strong>{opportunity.match}% match</strong></span>
                </button>
              );
            })}
            {!matches.length && <div className={styles.empty} role="status"><strong>No roles match these filters.</strong><p>Clear the filters to see every eligible opportunity.</p><button type="button" onClick={clearFilters}>Clear filters</button></div>}
          </div>
        </section>
        {selected ? <RoleDetails opportunity={selected} /> : null}
      </div>
    </main>
  );
}

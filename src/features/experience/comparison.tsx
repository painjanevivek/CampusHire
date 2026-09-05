"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/page-layout";
import { apiRequest } from "@/lib/api/client";
import type { Opportunity } from "@/features/recruitment/types";
import styles from "./experience.module.css";

const criteria: Array<[string, (role: Opportunity) => string]> = [
  ["Company", role => role.company_name], ["Role", role => role.title], ["Location", role => role.location],
  ["Work arrangement", role => role.work_mode], ["Employment type", role => role.employment_type],
  ["Compensation", role => role.salary_display ?? ""], ["Deadline", role => new Date(role.deadline_at).toLocaleString()],
  ["Requirements", role => [...role.requirements, ...role.skills].join(" · ")],
  ["Eligibility", role => `${role.eligibility.status.replaceAll("_", " ")}: ${role.eligibility.results.map(item => item.reason).join(" · ")}`],
];
export function Comparison() {
  const raw = useSearchParams().get("roles") ?? "";
  const ids = Array.from(new Set(raw.split(",").filter(id => /^[a-f0-9-]{36}$/i.test(id)))).slice(0, 3);
  const key = ids.join(",");
  const [roles, setRoles] = useState<Array<Opportunity | null>>([]);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      void Promise.all(key.split(",").filter(Boolean).map(id => apiRequest<Opportunity>(`/opportunities/${id}`, { signal: controller.signal, cache: "no-store" }).catch(() => null)))
        .then(data => { if (!controller.signal.aborted) { setRoles(data); setLoading(false); } });
    }, 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [key, attempt]);
  const value = (role: Opportunity | null, get: (role: Opportunity) => string) => role ? get(role) || "Not provided" : "Unavailable — this role may have closed, been removed, or failed to load.";
  return <PageContainer context="student" className={styles.stack}>
    <PageHeader eyebrow="Opportunity decisions" title="Compare roles, side by side." description="Two or three published roles. Eligibility remains separate from preparation and AI guidance." />
    <Link href="/opportunities">Back to opportunities</Link>
    {ids.length < 2 ? <p>Select at least two roles from the opportunities list.</p> : loading ? <p role="status">Loading current role details…</p> : <>
      {roles.some(role => !role) && <p role="status">Some roles are unavailable. <button className={styles.button} onClick={() => setAttempt(value => value + 1)}>Retry unavailable roles</button></p>}
      <div className={`${styles.tableWrap} ${styles.desktopComparison}`}><table className={styles.table}><caption>Current opportunity comparison</caption><thead><tr><th scope="col">Criterion</th>{ids.map((id, index) => <th scope="col" key={id}>{roles[index]?.title ?? `Role ${index + 1}`}</th>)}</tr></thead><tbody>{criteria.map(([label, get]) => <tr key={label}><th scope="row">{label}</th>{ids.map((id, index) => <td key={id}>{value(roles[index], get)}</td>)}</tr>)}</tbody></table></div>
      <div className={styles.mobileComparison}>{criteria.map(([label, get]) => <section className={styles.panel} key={label}><h2>{label}</h2>{ids.map((id, index) => <div key={id}><h3>{roles[index]?.title ?? `Role ${index + 1}`}</h3><p>{value(roles[index], get)}</p></div>)}</section>)}</div>
      <div className={styles.toolbar}>{roles.map(role => role && <Link className={styles.button} key={role.id} href={`/opportunities/${role.id}`}>Review {role.title}</Link>)}</div>
    </>}
  </PageContainer>;
}

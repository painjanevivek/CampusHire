"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  CircleAlert,
  FileCheck2,
  Plus,
  RefreshCcw,
  Send,
} from "lucide-react";

import { Alert, Badge, EmptyState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form-controls";
import { apiRequest, csrfRequest } from "@/lib/api/client";
import type { Company, Drive, PlacementRole, RuleDefinition, RuleSet } from "./types";
import styles from "./admin-drives.module.css";

const initialRule: RuleDefinition = { field: "degree", operator: "eq", value: "B.Tech", label: "Program eligibility" };

export function AdminDrives() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [roles, setRoles] = useState<PlacementRole[]>([]);
  const [ruleSets, setRuleSets] = useState<RuleSet[]>([]);
  const [selectedDrive, setSelectedDrive] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [rules, setRules] = useState<RuleDefinition[]>([initialRule]);
  const [panel, setPanel] = useState<"none" | "drive" | "role" | "rules">("none");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadRoot = useCallback(async () => {
    await Promise.resolve();
    setLoading(true); setError("");
    try {
      const [companyItems, driveItems] = await Promise.all([
        apiRequest<Company[]>("/admin/recruitment/companies", { cache: "no-store" }),
        apiRequest<Drive[]>("/admin/recruitment/drives", { cache: "no-store" }),
      ]);
      setCompanies(companyItems); setDrives(driveItems);
      setSelectedDrive((current) => current || driveItems[0]?.id || "");
    } catch { setError("Placement drives could not be loaded. No operational state was changed."); }
    finally { setLoading(false); }
  }, []);

  const loadRoles = useCallback(async (driveId: string) => {
    await Promise.resolve();
    if (!driveId) { setRoles([]); return; }
    try {
      const items = await apiRequest<PlacementRole[]>(`/admin/recruitment/drives/${driveId}/roles`, { cache: "no-store" });
      setRoles(items); setSelectedRole((current) => items.some((item) => item.id === current) ? current : items[0]?.id || "");
    } catch { setError("Roles for the selected drive could not be loaded."); }
  }, []);

  const loadRules = useCallback(async (roleId: string) => {
    await Promise.resolve();
    if (!roleId) { setRuleSets([]); return; }
    try { setRuleSets(await apiRequest<RuleSet[]>(`/admin/recruitment/roles/${roleId}/rule-sets`, { cache: "no-store" })); }
    catch { setError("Eligibility versions for the selected role could not be loaded."); }
  }, []);

  useEffect(() => {
    const pending = window.setTimeout(() => void loadRoot(), 0);
    return () => window.clearTimeout(pending);
  }, [loadRoot]);
  useEffect(() => {
    const pending = window.setTimeout(() => void loadRoles(selectedDrive), 0);
    return () => window.clearTimeout(pending);
  }, [loadRoles, selectedDrive]);
  useEffect(() => {
    const pending = window.setTimeout(() => void loadRules(selectedRole), 0);
    return () => window.clearTimeout(pending);
  }, [loadRules, selectedRole]);

  async function createDrive(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const data = new FormData(event.currentTarget);
    try {
      const created = await csrfRequest<Drive>("/admin/recruitment/drives", { method: "POST", body: JSON.stringify({ company_id: data.get("company_id"), title: data.get("title"), description: data.get("description"), location: data.get("location"), work_mode: data.get("work_mode"), opens_at: new Date(String(data.get("opens_at"))).toISOString(), deadline_at: new Date(String(data.get("deadline_at"))).toISOString() }) });
      setDrives((current) => [created, ...current]); setSelectedDrive(created.id); setPanel("none"); setNotice("Draft drive created. Add a role and reviewed eligibility rules before publishing.");
    } catch { setError("The drive was not created. Verify its company, application window, and required details."); }
    finally { setBusy(false); }
  }

  async function createRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedDrive) return; setBusy(true); setError(""); setNotice("");
    const data = new FormData(event.currentTarget);
    try {
      const created = await csrfRequest<PlacementRole>(`/admin/recruitment/drives/${selectedDrive}/roles`, { method: "POST", body: JSON.stringify({ title: data.get("title"), description: data.get("description"), employment_type: data.get("employment_type"), location: data.get("location"), work_mode: data.get("work_mode"), salary_display: data.get("salary_display") || null, skills: String(data.get("skills") || "").split(",").map((item) => item.trim()).filter(Boolean), requirements: String(data.get("requirements") || "").split("\n").map((item) => item.trim()).filter(Boolean) }) });
      setRoles((current) => [...current, created]); setSelectedRole(created.id); setPanel("none"); setNotice("Draft role created. Publish a deterministic rule version next."); void loadRoot();
    } catch { setError("The role was not created. Review required text, lists, and the selected draft drive."); }
    finally { setBusy(false); }
  }

  async function createRules(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedRole) return; setBusy(true); setError(""); setNotice("");
    try {
      const normalized = rules.map((rule) => ({ ...rule, value: ["gte", "lte"].includes(rule.operator) ? Number(rule.value) : rule.operator === "present" ? null : rule.value }));
      const created = await csrfRequest<RuleSet>(`/admin/recruitment/roles/${selectedRole}/rule-sets`, { method: "POST", body: JSON.stringify({ rules: normalized }) });
      setRuleSets((current) => [created, ...current]); setPanel("none"); setNotice(`Draft rule version ${created.version} created. Preview the rows, then publish it.`);
    } catch { setError("The rule version was not created. Every rule needs a supported field, operator, value, and clear label."); }
    finally { setBusy(false); }
  }

  async function postAction(path: string, success: string) {
    setBusy(true); setError(""); setNotice("");
    try { await csrfRequest(path, { method: "POST" }); setNotice(success); await loadRoot(); await loadRoles(selectedDrive); await loadRules(selectedRole); }
    catch { setError("The transition was rejected. Complete its prerequisites or refresh the current state."); }
    finally { setBusy(false); }
  }

  const activeDrive = drives.find((item) => item.id === selectedDrive);
  const activeRole = roles.find((item) => item.id === selectedRole);
  const publishedRules = ruleSets.find((item) => item.status === "published");

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}><div><p>Placement operations</p><h1>Drives and eligibility</h1><span>Draft deliberately, publish reviewed versions, and preserve every decision basis.</span></div><button type="button" className={styles.primary} disabled={!companies.length} onClick={() => setPanel("drive")}><Plus aria-hidden="true" />Create drive</button></header>
      {error && <Alert tone="error">{error} <button type="button" onClick={() => void loadRoot()}>Retry</button></Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}
      {!companies.length && !loading ? <Alert tone="warning">Create a company record before opening a placement drive.</Alert> : null}

      {panel === "drive" ? <form className={styles.editor} onSubmit={createDrive}><div className={styles.editorHeading}><p>Step 1</p><h2>New placement drive</h2></div><Select id="drive-company" name="company_id" label="Company" required>{companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Input id="drive-title" name="title" label="Drive title" required minLength={3} /><Input id="drive-location" name="location" label="Location" required /><Select id="drive-mode" name="work_mode" label="Work mode"><option value="on-site">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></Select><Input id="drive-opens" name="opens_at" label="Opens at" type="datetime-local" required /><Input id="drive-deadline" name="deadline_at" label="Deadline" type="datetime-local" required /><label className={styles.wide}><span>Description</span><textarea name="description" required minLength={10} rows={3} /></label><div className={styles.actions}><button type="button" onClick={() => setPanel("none")}>Cancel</button><button className={styles.primary} type="submit" disabled={busy}>{busy ? "Creating…" : "Create draft"}</button></div></form> : null}

      <div className={styles.workspace} aria-busy={loading}>
        <section className={styles.rail} aria-labelledby="drive-list"><div className={styles.sectionHeader}><h2 id="drive-list">Drives</h2><button type="button" onClick={() => void loadRoot()} aria-label="Refresh drives"><RefreshCcw aria-hidden="true" /></button></div>{loading ? <p className={styles.muted}>Loading drives…</p> : null}{!loading && !drives.length ? <EmptyState title="No drives yet"><span>Create the first draft after adding a company.</span></EmptyState> : null}<div className={styles.rows}>{drives.map((drive) => <button key={drive.id} type="button" className={drive.id === selectedDrive ? styles.selected : ""} onClick={() => setSelectedDrive(drive.id)}><span><strong>{drive.title}</strong><small>{drive.company_name} · {drive.role_count} roles</small></span><Badge tone={drive.status === "published" ? "success" : drive.status === "closed" ? "warning" : "neutral"}>{drive.status}</Badge><ChevronRight aria-hidden="true" /></button>)}</div></section>

        <section className={styles.detail} aria-label="Selected drive operations">
          {!activeDrive ? <EmptyState title="Select a drive"><span>Its roles, rule versions, and publication controls will appear here.</span></EmptyState> : <>
            <div className={styles.driveSummary}><div><p>{activeDrive.company_name}</p><h2>{activeDrive.title}</h2><span>{activeDrive.location} · {activeDrive.work_mode}</span></div><div><Badge tone={activeDrive.status === "published" ? "success" : "neutral"}>{activeDrive.status}</Badge><span><CalendarClock aria-hidden="true" />{new Date(activeDrive.deadline_at).toLocaleString()}</span></div></div>
            <div className={styles.commandBar}><button type="button" disabled={activeDrive.status !== "draft"} onClick={() => setPanel("role")}><Plus aria-hidden="true" />Add role</button><button type="button" disabled={busy || activeDrive.status !== "draft" || !roles.some((item) => item.status === "published")} onClick={() => void postAction(`/admin/recruitment/drives/${activeDrive.id}/actions/publish`, "Drive published. Students can now discover roles inside its active window.")}><Send aria-hidden="true" />Publish drive</button><button type="button" disabled={busy || activeDrive.status !== "published"} onClick={() => void postAction(`/admin/recruitment/drives/${activeDrive.id}/actions/close`, "Drive closed. New applications are no longer accepted.")}>Close drive</button></div>

            {panel === "role" ? <form className={styles.editor} onSubmit={createRole}><div className={styles.editorHeading}><p>Step 2</p><h2>Add a role</h2></div><Input id="role-title" name="title" label="Role title" required /><Input id="role-location" name="location" label="Location" required defaultValue={activeDrive.location} /><Select id="role-employment" name="employment_type" label="Employment"><option value="full-time">Full-time</option><option value="internship">Internship</option><option value="contract">Contract</option></Select><Select id="role-mode" name="work_mode" label="Work mode" defaultValue={activeDrive.work_mode}><option value="on-site">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></Select><Input id="role-salary" name="salary_display" label="Compensation (optional)" /><Input id="role-skills" name="skills" label="Skills" hint="Comma-separated" /><label className={styles.wide}><span>Description</span><textarea name="description" required minLength={10} rows={3} /></label><label className={styles.wide}><span>Requirements</span><textarea name="requirements" rows={3} placeholder="One requirement per line" /></label><div className={styles.actions}><button type="button" onClick={() => setPanel("none")}>Cancel</button><button className={styles.primary} type="submit" disabled={busy}>Create draft role</button></div></form> : null}

            <div className={styles.roleGrid}><div className={styles.roleList}><div className={styles.sectionHeader}><h3>Roles</h3></div>{roles.map((role) => <button key={role.id} type="button" className={role.id === selectedRole ? styles.selected : ""} onClick={() => setSelectedRole(role.id)}><span><strong>{role.title}</strong><small>{role.employment_type} · {role.work_mode}</small></span><Badge tone={role.status === "published" ? "success" : "neutral"}>{role.status}</Badge></button>)}</div>
              <div className={styles.rulesPanel}>{activeRole ? <><div className={styles.rulesTitle}><div><p>Selected role</p><h3>{activeRole.title}</h3></div><Badge tone={publishedRules ? "success" : "warning"}>{publishedRules ? `Rules v${publishedRules.version}` : "Rules required"}</Badge></div><div className={styles.ruleActions}><button type="button" disabled={activeRole.status !== "draft"} onClick={() => setPanel("rules")}><Plus aria-hidden="true" />New rule version</button><button type="button" disabled={busy || activeRole.status !== "draft" || !publishedRules} onClick={() => void postAction(`/admin/recruitment/roles/${activeRole.id}/publish`, "Role published and ready for its drive publication.")}><BadgeCheck aria-hidden="true" />Publish role</button></div>{ruleSets.map((set) => <article key={set.id} className={styles.ruleVersion}><header><strong>Version {set.version}</strong><Badge tone={set.status === "published" ? "success" : "neutral"}>{set.status}</Badge>{set.status === "draft" ? <button type="button" disabled={busy} onClick={() => void postAction(`/admin/recruitment/roles/${activeRole.id}/rule-sets/${set.id}/publish`, `Eligibility version ${set.version} published. Previous versions remain immutable.`)}>Publish</button> : null}</header><ul>{set.rules.map((rule, index) => <li key={`${rule.field}-${index}`}><FileCheck2 aria-hidden="true" /><span><strong>{rule.label}</strong><small>{rule.field} {rule.operator} {String(rule.value ?? "present")}</small></span></li>)}</ul></article>)}</> : <EmptyState title="Select a role"><span>Review or create its deterministic eligibility version.</span></EmptyState>}</div></div>
          </>}
        </section>
      </div>

      {panel === "rules" && activeRole ? <form className={styles.ruleEditor} onSubmit={createRules}><div className={styles.editorHeading}><p>Step 3</p><h2>Eligibility rule version for {activeRole.title}</h2><span>Missing facts automatically route to manual review.</span></div>{rules.map((rule, index) => <div className={styles.ruleRow} key={index}><label>Label<input value={rule.label} onChange={(event) => setRules((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} required /></label><label>Fact<select value={rule.field} onChange={(event) => setRules((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, field: event.target.value } : item))}><option value="degree">Degree</option><option value="branch">Branch</option><option value="department">Department</option><option value="graduation_year">Graduation year</option><option value="cgpa">CGPA</option><option value="active_backlogs">Active backlogs</option><option value="github">GitHub</option><option value="portfolio">Portfolio</option><option value="resume">Reviewed resume</option></select></label><label>Operator<select value={rule.operator} onChange={(event) => setRules((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, operator: event.target.value } : item))}><option value="eq">Equals</option><option value="gte">At least</option><option value="lte">At most</option><option value="present">Present</option></select></label><label>Value<input value={String(rule.value ?? "")} disabled={rule.operator === "present"} onChange={(event) => setRules((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} /></label><button type="button" disabled={rules.length === 1} onClick={() => setRules((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${rule.label}`}>Remove</button></div>)}<button className={styles.addRule} type="button" onClick={() => setRules((current) => [...current, { ...initialRule, label: "New requirement" }])}><Plus aria-hidden="true" />Add rule</button><Alert tone="warning"><CircleAlert aria-hidden="true" /> Preview carefully: once published, this version becomes immutable and applications retain it.</Alert><div className={styles.actions}><button type="button" onClick={() => setPanel("none")}>Cancel</button><button className={styles.primary} type="submit" disabled={busy}>Create draft version</button></div></form> : null}
    </main>
  );
}

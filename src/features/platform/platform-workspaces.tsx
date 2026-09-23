"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, ArrowRight, Building2, CheckCircle2, ChevronDown, Clock3, ShieldAlert, UserCog } from "lucide-react";

import { PageContainer, PageHeader } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Alert, Badge, RequestState } from "@/components/ui/feedback";
import { useResource } from "@/features/experience/use-resource";
import { ApiError, csrfRequest } from "@/lib/api/client";
import { OutcomeTimeline } from "@/features/recruitment/outcome-timeline";
import styles from "./platform-workspaces.module.css";

type DashboardSummary = {
  pending_institution_approvals: number;
  active_institutions: number;
  tnp_accounts: number;
  unresolved_service_items: number;
  overdue_escalations: number;
  reporting_freshness_at: string | null;
};
type Institution = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  timezone: string;
  staff_count: number;
  student_count: number;
  application_count: number;
  updated_at: string;
};
type InstitutionDetail = Institution & { domains: string[]; drive_count: number };
type InstitutionPage = { items: Institution[]; page: number; page_size: number; total: number };
type PlacementRecord = {
  id: string;
  student_name: string;
  student_email: string;
  status: string;
  role_snapshot: Record<string, unknown>;
  eligibility_snapshot: Record<string, unknown>;
  review_due_at: string | null;
  assignee_user_id: string | null;
  updated_at: string;
};
type PlacementRecordPage = { items: PlacementRecord[]; page: number; page_size: number; total: number };
type RegistrationRequest = {
  id: string;
  institution_name: string;
  institution_code: string;
  domain: string;
  admin_email: string;
  status: string;
  duplicate_detected: boolean;
  created_at: string;
};
type InstitutionProvisionHandoff = {
  institution_id: string;
  admin_invitation_id: string;
  admin_invitation_token: string;
  expires_at: string;
};
type StaffAccount = {
  id: string;
  institution_id: string;
  user_id: string;
  username: string | null;
  email: string;
  role: string;
  status: string;
  requires_terms_acceptance: boolean;
};
type ReportSummary = {
  institution_count: number;
  student_count: number;
  drive_count: number;
  application_count: number;
  applications_by_status: Record<string, number>;
  generated_at: string;
  provisional: boolean;
};
type HealthSummary = {
  status: "healthy" | "degraded";
  checked_at: string;
  queues: Array<{ service: string; pending: number; failed: number; oldest_outstanding_at: string | null }>;
};
type AuditPage = {
  items: Array<{
    id: string;
    event_type: string;
    resource_type: string | null;
    outcome: string;
    reason: string | null;
    actor_user_id: string | null;
    correlation_id: string | null;
    created_at: string;
  }>;
  total: number;
};
type PlatformSettings = {
  ai_provider: string;
  ai_model: string | null;
  ai_key_configured: boolean;
  email_configured: boolean;
  storage_backend: string;
  platform_notice: Record<string, unknown>;
  service_targets: Record<string, unknown>;
  feature_availability: Record<string, unknown>;
};

const roleLabels: Record<string, string> = {
  tnp_admin: "Officer",
  tnp_reviewer: "Reviewer",
  tnp_auditor: "Auditor",
};

function ResourceError({ message, retry }: { message: string; retry: () => void }) {
  return <RequestState state="error" title="This platform record is unavailable" onRetry={retry}>{message}</RequestState>;
}

export function PlatformDashboard() {
  const summary = useResource<DashboardSummary>("/platform/dashboard");
  return <PageContainer context="admin" className={styles.page}>
    <PageHeader eyebrow="Platform oversight" title="CampusHire, accountable at a glance." description="Service risk and institutional requests appear first. Placement decisions remain with each institution." />
    {summary.error ? <ResourceError message={summary.error} retry={summary.refresh} /> : null}
    {summary.loading ? <RequestState state="loading" title="Loading platform summary">Each signal is read without granting operational placement access.</RequestState> : null}
    {summary.data ? <>
      <section className={styles.priorityStrip} aria-label="Platform priorities">
        <article><span>Approval queue</span><strong>{summary.data.pending_institution_approvals}</strong><small>institution requests</small></article>
        <article><span>Service attention</span><strong>{summary.data.unresolved_service_items}</strong><small>unresolved items</small></article>
        <article><span>Overdue escalation</span><strong>{summary.data.overdue_escalations}</strong><small>staffing or support</small></article>
      </section>
      <section className={styles.quickActions} aria-labelledby="platform-actions-title">
        <div><p className="eyebrow">Quick actions</p><h2 id="platform-actions-title">Resolve platform work</h2></div>
        <nav aria-label="Platform quick actions">
          <Link href="/admin/institutions?view=requests"><Building2 aria-hidden="true" /><span><strong>Review institutions</strong><small>Approve verified requests</small></span><ArrowRight aria-hidden="true" /></Link>
          <Link href="/admin/accounts"><UserCog aria-hidden="true" /><span><strong>Issue T&amp;P access</strong><small>Choose an institution first</small></span><ArrowRight aria-hidden="true" /></Link>
          <Link href="/admin/system-health"><Activity aria-hidden="true" /><span><strong>Inspect service health</strong><small>See failures before worker detail</small></span><ArrowRight aria-hidden="true" /></Link>
        </nav>
      </section>
      <section className={styles.metrics} aria-label="Platform coverage">
        <article><span>Active institutions</span><strong>{summary.data.active_institutions.toLocaleString()}</strong></article>
        <article><span>T&amp;P accounts</span><strong>{summary.data.tnp_accounts.toLocaleString()}</strong></article>
        <article><span>Reporting freshness</span><strong className={styles.dateValue}>{summary.data.reporting_freshness_at ? new Date(summary.data.reporting_freshness_at).toLocaleString() : "No report yet"}</strong></article>
      </section>
    </> : null}
  </PageContainer>;
}

export function PlatformInstitutions() {
  const search = useSearchParams();
  const selectedId = search.get("selected");
  const query = search.get("q") ?? "";
  const page = useResource<InstitutionPage>(`/platform/institutions?page=1&page_size=50${query ? `&query=${encodeURIComponent(query)}` : ""}`);
  const requests = useResource<RegistrationRequest[]>("/platform/institution-registration-requests?status_filter=pending");
  const detail = useResource<InstitutionDetail>(selectedId ? `/platform/institutions/${selectedId}` : null);
  const placementRecords = useResource<PlacementRecordPage>(selectedId ? `/platform/institutions/${selectedId}/applications?page=1&page_size=10` : null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [outcomeApplicationId, setOutcomeApplicationId] = useState("");
  const [provisionHandoff, setProvisionHandoff] = useState<InstitutionProvisionHandoff | null>(null);

  async function provision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setMessage(""); setProvisionHandoff(null);
    try {
      const handoff = await csrfRequest<InstitutionProvisionHandoff>("/platform/institutions", {
        method: "POST",
        body: JSON.stringify({
          institution_code: String(data.get("institution_code") ?? "").trim(),
          institution_name: String(data.get("institution_name") ?? "").trim(),
          admin_email: String(data.get("admin_email") ?? "").trim(),
        }),
      });
      setProvisionHandoff(handoff);
      setMessage("Institution created. Transfer the one-time activation code through the approved authenticated channel.");
      form.reset(); page.refresh();
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "The institution could not be created.");
    } finally { setBusy(false); }
  }

  async function decide(requestId: string, decision: "approve" | "reject", reason?: string) {
    setBusy(true); setMessage("");
    try {
      await csrfRequest(`/platform/institution-registration-requests/${requestId}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, reason: reason || null }),
      });
      setMessage(`Institution request ${decision === "approve" ? "approved" : "rejected"}.`);
      requests.refresh(); page.refresh();
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "The institution request was not changed.");
    } finally { setBusy(false); }
  }

  async function changeStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail.data) return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setMessage("");
    try {
      await csrfRequest(`/platform/institutions/${detail.data.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          is_active: data.get("status") === "active",
          reason: data.get("reason"),
          expected_updated_at: detail.data.updated_at,
        }),
      });
      setMessage("Institution access changed and active sessions were invalidated.");
      detail.refresh(); page.refresh();
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "Institution access was not changed.");
    } finally { setBusy(false); }
  }

  return <PageContainer context="admin" className={styles.page}>
    <PageHeader eyebrow="Institution governance" title="Institutions" description="Approve onboarding, inspect configuration, and read placement records without changing placement decisions." />
    {message ? <Alert>{message}</Alert> : null}
    <section className={styles.registrationQueue} aria-labelledby="registration-requests-title">
      <header>
        <div><p className="eyebrow">Institution onboarding</p><h2 id="registration-requests-title">Registration requests</h2><p>Approve verified institutions here before their staff can access CampusHire.</p></div>
        <Badge tone={requests.data?.length ? "warning" : "neutral"}>{requests.data?.length ?? 0} pending</Badge>
      </header>
      {requests.data?.length ? <div className={styles.list}>
        {requests.data.map((request) => <article key={request.id}>
          <div><strong>{request.institution_name}</strong><small>{request.domain} · {request.admin_email}</small></div>
          {request.duplicate_detected ? <Badge tone="warning">Possible duplicate</Badge> : <Badge>Verified request</Badge>}
          <div className={styles.inlineActions}>
            <Button disabled={busy} onClick={() => void decide(request.id, "approve")}>Approve</Button>
            <details><summary>Reject</summary><form onSubmit={(event) => { event.preventDefault(); const reason = String(new FormData(event.currentTarget).get("reason") ?? ""); void decide(request.id, "reject", reason); }}><label>Reason<input name="reason" minLength={10} required /></label><Button variant="quiet" disabled={busy}>Confirm rejection</Button></form></details>
          </div>
        </article>)}
      </div> : <p className={styles.queueEmpty}>No pending institution requests. New registrations will appear here for your decision.</p>}
      <details className={styles.disclosure}>
        <summary>Provision an institution after offline verification</summary>
        <p>Use this only after the institution and administrator have been verified through the approved support procedure.</p>
        <form onSubmit={provision}>
          <label>Institution name<input name="institution_name" minLength={2} maxLength={200} required /></label>
          <label>Institution code<input name="institution_code" pattern="[a-z0-9-]+" minLength={2} maxLength={64} required /></label>
          <label>Initial T&amp;P administrator email<input name="admin_email" type="email" required /></label>
          <Button disabled={busy}>{busy ? "Creating institution…" : "Create institution"}</Button>
        </form>
      </details>
      {provisionHandoff ? <Alert>
        <strong>One-time administrator activation code</strong>
        <code>{provisionHandoff.admin_invitation_token}</code>
        <span>Expires {new Date(provisionHandoff.expires_at).toLocaleString()}. It will not be shown again; revoke and reissue it if the handoff is lost.</span>
      </Alert> : null}
    </section>
    <form className={styles.toolbar} action="/admin/institutions"><label>Search institutions<input name="q" defaultValue={query} placeholder="Name or code" /></label><Button>Search</Button></form>
    {page.loading ? <RequestState state="loading" title="Loading institutions">Reading platform-scoped summaries.</RequestState> : null}
    {page.error ? <ResourceError message={page.error} retry={page.refresh} /> : null}
    <div className={styles.split}>
      <section className={styles.list} aria-label="Institution directory">
        {page.data?.items.map((item) => <Link key={item.id} href={`/admin/institutions?selected=${item.id}`} className={styles.institutionRow} aria-current={selectedId === item.id ? "true" : undefined}>
          <div><strong>{item.name}</strong><small>{item.code} · {item.timezone}</small></div>
          <Badge tone={item.is_active ? "success" : "warning"}>{item.is_active ? "Active" : "Suspended"}</Badge>
          <span>{item.student_count.toLocaleString()} students</span><span>{item.application_count.toLocaleString()} applications</span>
        </Link>)}
      </section>
      {selectedId ? <aside className={styles.inspector} aria-label="Institution details">
        {detail.loading ? <p role="status">Loading institution details…</p> : null}
        {detail.data ? <>
          <header><p className="eyebrow">Read-only placement overview</p><h2>{detail.data.name}</h2><p>{detail.data.domains.join(", ") || "No approved domains"}</p></header>
          <dl className={styles.definitionList}><div><dt>Staff</dt><dd>{detail.data.staff_count}</dd></div><div><dt>Drives</dt><dd>{detail.data.drive_count}</dd></div><div><dt>Applications</dt><dd>{detail.data.application_count}</dd></div></dl>
          <Link href={`/admin/accounts?institution=${detail.data.id}`}>Manage T&amp;P access <ArrowRight aria-hidden="true" /></Link>
          <details className={styles.disclosure}><summary>Read-only placement records <Badge tone="neutral">{placementRecords.data?.total ?? detail.data.application_count}</Badge></summary>
            {placementRecords.loading ? <p role="status">Loading placement records…</p> : null}
            {placementRecords.error ? <ResourceError message={placementRecords.error} retry={placementRecords.refresh} /> : null}
            <div className={styles.list}>{placementRecords.data?.items.map((record) => <article key={record.id}><div><strong>{record.student_name}</strong><small>{String(record.role_snapshot.title ?? "Placement role")} · {String(record.role_snapshot.company_name ?? "Institution employer")}</small></div><Badge tone="neutral">{record.status.replaceAll("_", " ")}</Badge><details><summary>Record and reviewer details</summary><dl className={styles.definitionList}><div><dt>Student</dt><dd>{record.student_email}</dd></div><div><dt>Owner</dt><dd>{record.assignee_user_id ? "Assigned institution reviewer" : "Unassigned institution queue"}</dd></div><div><dt>Review due</dt><dd>{record.review_due_at ? new Date(record.review_due_at).toLocaleString() : "Not scheduled"}</dd></div><div><dt>Last update</dt><dd>{new Date(record.updated_at).toLocaleString()}</dd></div></dl><pre>{JSON.stringify(record.eligibility_snapshot, null, 2)}</pre><Button variant="quiet" type="button" onClick={() => setOutcomeApplicationId(record.id)}>Inspect outcome details</Button></details></article>)}</div>
            {outcomeApplicationId ? <OutcomeTimeline applicationId={outcomeApplicationId} endpoint={`/platform/institutions/${detail.data.id}/applications/${outcomeApplicationId}/outcomes`} timeZone={detail.data.timezone} /> : null}
            {placementRecords.data && !placementRecords.data.items.length ? <p>No placement applications recorded.</p> : null}
            {(placementRecords.data?.total ?? 0) > 10 ? <p>Showing the ten most recent records. Use Platform Reports for aggregate investigation.</p> : null}
          </details>
          <details className={styles.dangerDisclosure}><summary>{detail.data.is_active ? "Suspend institution" : "Restore institution"}</summary><p>Suspension blocks institution staff and Student sessions. Student placement records are retained.</p><form onSubmit={changeStatus}><input type="hidden" name="status" value={detail.data.is_active ? "suspended" : "active"} /><label>Audit reason<textarea name="reason" minLength={10} required /></label><Button disabled={busy}>{detail.data.is_active ? "Suspend access" : "Restore access"}</Button></form></details>
        </> : null}
      </aside> : <aside className={styles.inspector}><p>Select an institution to inspect configuration and read-only placement totals.</p></aside>}
    </div>
  </PageContainer>;
}

export function PlatformAccounts() {
  const params = useSearchParams();
  const router = useRouter();
  const institutions = useResource<InstitutionPage>("/platform/institutions?page=1&page_size=100");
  const selected = params.get("institution") ?? institutions.data?.items[0]?.id ?? "";
  const accounts = useResource<StaffAccount[]>(selected ? `/platform/institutions/${selected}/staff-accounts` : null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [recoveryAccount, setRecoveryAccount] = useState<StaffAccount | null>(null);
  const [recoveryHandoff, setRecoveryHandoff] = useState<{ username: string; code: string; minutes: number } | null>(null);
  const actionTriggerRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!(event.target instanceof Element) || event.target.closest("[data-account-action-menu]")) return;
      setOpenActionId(null);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || !openActionId) return;
      event.preventDefault();
      actionTriggerRefs.current.get(openActionId)?.focus();
      setOpenActionId(null);
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openActionId]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get("password") !== data.get("confirm_password")) { setMessage("Passwords do not match."); return; }
    setBusy(true); setMessage("");
    try {
      await csrfRequest(`/platform/institutions/${selected}/staff-accounts`, { method: "POST", body: JSON.stringify({ username: data.get("username"), password: data.get("password"), role: data.get("role"), reason: data.get("reason") }) });
      form.reset(); accounts.refresh(); setMessage("T&P access issued. The officer must accept current terms on first sign-in.");
    } catch (cause) { setMessage(cause instanceof ApiError ? cause.message : "T&P access could not be issued."); }
    finally { setBusy(false); }
  }

  async function assignExisting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setMessage("");
    try {
      await csrfRequest(`/platform/institutions/${selected}/staff-assignments`, {
        method: "POST",
        body: JSON.stringify({
          username: String(data.get("username") ?? "").trim(),
          role: data.get("role"),
          reason: data.get("reason"),
        }),
      });
      form.reset(); accounts.refresh();
      setMessage("Existing T&P account assigned to this institution. Its next sign-in can use this context.");
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "The existing account could not be assigned.");
    } finally { setBusy(false); }
  }

  async function changeStatus(event: FormEvent<HTMLFormElement>, account: StaffAccount) {
    event.preventDefault();
    const data = new FormData(event.currentTarget); setBusy(true); setMessage("");
    try {
      await csrfRequest(`/platform/institutions/${selected}/staff-accounts/${account.id}`, { method: "PATCH", body: JSON.stringify({ status: data.get("status"), role: data.get("role"), reason: data.get("reason") }) });
      accounts.refresh(); setOpenActionId(null); setMessage("T&P access updated and active sessions revoked where required.");
    } catch (cause) { setMessage(cause instanceof ApiError ? cause.message : "T&P access was not changed."); }
    finally { setBusy(false); }
  }

  async function issueStaffRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!recoveryAccount) return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setMessage(""); setRecoveryHandoff(null);
    try {
      const result = await csrfRequest<{ reset_code: string; expires_in_minutes: number }>(
        `/platform/staff-accounts/${recoveryAccount.user_id}/manual-recovery`,
        { method: "POST", body: JSON.stringify({
          identity_check_method: data.get("identity_check_method"),
          identity_check_reference: data.get("identity_check_reference"),
          reason: data.get("reason"),
        }) },
      );
      setRecoveryHandoff({ username: recoveryAccount.username ?? "T&P account", code: result.reset_code, minutes: result.expires_in_minutes });
      setRecoveryAccount(null);
      setMessage("One-time staff recovery code issued after the recorded identity check.");
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "Staff recovery could not be issued.");
    } finally { setBusy(false); }
  }

  return <PageContainer context="admin" className={styles.page}>
    <PageHeader eyebrow="Access governance" title="T&amp;P Accounts" description="The Platform Admin issues institution-scoped Officer, Reviewer, and Auditor access. Roles do not inherit placement powers." />
    {message ? <Alert>{message}</Alert> : null}
    <label className={styles.institutionSelect}>Institution<select value={selected} onChange={(event) => { setRecoveryAccount(null); setRecoveryHandoff(null); router.push(`/admin/accounts?institution=${event.target.value}`); }}><option value="">Select an institution</option>{institutions.data?.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    {selected ? <div className={styles.split}>
      <section className={styles.panel}><p className="eyebrow">Provision access</p><h2>Create a T&amp;P account</h2><form className={styles.form} onSubmit={create}><label>Username<input name="username" pattern="[A-Za-z][A-Za-z0-9._-]{2,63}" required /></label><label>Role<select name="role" defaultValue="tnp_reviewer"><option value="tnp_admin">Officer</option><option value="tnp_reviewer">Reviewer</option><option value="tnp_auditor">Auditor</option></select></label><label>Initial password<input name="password" type="password" minLength={12} required /></label><label>Confirm password<input name="confirm_password" type="password" minLength={12} required /></label><label>Audit reason<textarea name="reason" minLength={10} required /></label><Button disabled={busy}>{busy ? "Creating…" : "Issue access"}</Button></form><details className={styles.assignmentDisclosure}><summary>Assign an existing T&amp;P account to this institution</summary><p>Use this when one officer is responsible for more than one institution. This does not create another login.</p><form className={styles.form} onSubmit={assignExisting}><label>Existing username<input name="username" pattern="[A-Za-z][A-Za-z0-9._-]{2,63}" autoComplete="off" required /></label><label>Role at this institution<select name="role" defaultValue="tnp_reviewer"><option value="tnp_admin">Officer</option><option value="tnp_reviewer">Reviewer</option><option value="tnp_auditor">Auditor</option></select></label><label>Audit reason<textarea name="reason" minLength={10} required /></label><Button disabled={busy}>{busy ? "Assigning…" : "Assign account"}</Button></form></details></section>
      <section className={styles.list} aria-label="T&P account directory">{accounts.loading ? <p role="status">Loading T&amp;P accounts…</p> : null}{accounts.data?.map((account) => <article key={account.id}><div><strong>{account.username ?? account.email}</strong><small>{roleLabels[account.role] ?? account.role}</small></div><Badge tone={account.status === "active" ? "success" : "warning"}>{account.status}</Badge><div className={styles.actionMenu} data-account-action-menu>
        <button type="button" className={styles.actionTrigger} aria-haspopup="dialog" aria-expanded={openActionId === account.id} aria-controls={`account-actions-${account.id}`} ref={(element) => { if (element) actionTriggerRefs.current.set(account.id, element); else actionTriggerRefs.current.delete(account.id); }} onClick={() => setOpenActionId((current) => current === account.id ? null : account.id)}>Actions <ChevronDown aria-hidden="true" /></button>
        {openActionId === account.id ? <form id={`account-actions-${account.id}`} className={styles.actionPopover} role="dialog" aria-label={`Actions for ${account.username ?? account.email}`} onSubmit={(event) => void changeStatus(event, account)}><p>Update this institution-scoped account.</p><label>Role<select name="role" defaultValue={account.role}><option value="tnp_admin">Officer</option><option value="tnp_reviewer">Reviewer</option><option value="tnp_auditor">Auditor</option></select></label><label>Status<select name="status" defaultValue={account.status}><option value="active">Active</option><option value="suspended">Suspended</option><option value="revoked">Revoked</option></select></label><label>Audit reason<input name="reason" minLength={10} required /></label><div className={styles.menuActions}><Button variant="quiet" type="button" onClick={() => setOpenActionId(null)}>Cancel</Button><Button disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button></div><Button variant="quiet" type="button" onClick={() => { setRecoveryAccount(account); setOpenActionId(null); }}>Issue manual recovery code</Button></form> : null}
      </div></article>)}{accounts.data && !accounts.data.length ? <RequestState state="empty" title="No T&P accounts">Issue the first scoped account from the form.</RequestState> : null}</section>
    </div> : <RequestState state="empty" title="Choose an institution">T&amp;P access is always issued inside an institution boundary.</RequestState>}
    {recoveryAccount ? <section className={styles.panel}><h2>Recover {recoveryAccount.username ?? "T&P account"}</h2><p>Verify the officer through your approved institutional process before issuing a code. Do not record full ID numbers here.</p><form className={styles.form} onSubmit={issueStaffRecovery}><label>Identity check method<input name="identity_check_method" minLength={5} maxLength={100} required /></label><label>Verification reference<input name="identity_check_reference" minLength={5} maxLength={120} required /></label><label>Recovery audit reason<textarea name="reason" minLength={10} maxLength={500} required /></label><div className={styles.inlineActions}><Button disabled={busy}>Issue one-time code</Button><Button type="button" variant="quiet" onClick={() => setRecoveryAccount(null)}>Cancel</Button></div></form></section> : null}
    {recoveryHandoff ? <section className={styles.panel}><h2>One-time recovery code for {recoveryHandoff.username}</h2><p>Show this code only through an institution-approved secure handoff. The officer chooses their own replacement password. It expires in {recoveryHandoff.minutes} minutes.</p><code>{recoveryHandoff.code}</code><div><Button type="button" variant="quiet" onClick={() => setRecoveryHandoff(null)}>Done — hide code</Button></div></section> : null}
  </PageContainer>;
}

export function PlatformReports() {
  const report = useResource<ReportSummary>("/platform/reports/summary");
  const statusRows = useMemo(() => Object.entries(report.data?.applications_by_status ?? {}).sort(([left], [right]) => left.localeCompare(right)), [report.data]);
  return <PageContainer context="admin" className={styles.page}><PageHeader eyebrow="Cross-institution reporting" title="Platform reports" description="Aggregates are read-only and provisional until approved metric definitions and required information checks are met." />{report.error ? <ResourceError message={report.error} retry={report.refresh} /> : null}{report.data ? <><Alert tone="info">Generated {new Date(report.data.generated_at).toLocaleString()}. {report.data.provisional ? "Provisional records are not publication-ready." : "Approved for internal reporting."}</Alert><section className={styles.metrics}><article><span>Institutions</span><strong>{report.data.institution_count.toLocaleString()}</strong></article><article><span>Students</span><strong>{report.data.student_count.toLocaleString()}</strong></article><article><span>Drives</span><strong>{report.data.drive_count.toLocaleString()}</strong></article><article><span>Applications</span><strong>{report.data.application_count.toLocaleString()}</strong></article></section><section className={styles.panel}><h2>Application stages</h2><p>Stage counts are not verified outcome counts. Offer, acceptance, and joining remain separate records.</p><dl className={styles.statusRows}>{statusRows.map(([key, value]) => <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{value.toLocaleString()}</dd></div>)}</dl></section></> : <RequestState state="loading" title="Calculating platform report">Loading aggregate records independently.</RequestState>}</PageContainer>;
}

export function PlatformSystemHealth() {
  const health = useResource<HealthSummary>("/platform/system-health");
  return <PageContainer context="admin" className={styles.page}><PageHeader eyebrow="Service operations" title="System Health" description="Failures and oldest outstanding work appear first. Worker identifiers and lease data stay in technical detail." />{health.error ? <ResourceError message={health.error} retry={health.refresh} /> : null}{health.data ? <><Alert tone={health.data.status === "healthy" ? "success" : "warning"}>{health.data.status === "healthy" ? <CheckCircle2 aria-hidden="true" /> : <ShieldAlert aria-hidden="true" />} Platform services are {health.data.status}. Checked {new Date(health.data.checked_at).toLocaleString()}.</Alert><section className={styles.healthGrid}>{health.data.queues.map((queue) => <article key={queue.service} data-attention={queue.failed > 0}><header><Activity aria-hidden="true" /><h2>{queue.service.replaceAll("_", " ")}</h2><Badge tone={queue.failed ? "warning" : "success"}>{queue.failed ? "Attention" : "Clear"}</Badge></header><dl><div><dt>Failed</dt><dd>{queue.failed}</dd></div><div><dt>Pending</dt><dd>{queue.pending}</dd></div></dl><p><Clock3 aria-hidden="true" /> {queue.oldest_outstanding_at ? `Oldest: ${new Date(queue.oldest_outstanding_at).toLocaleString()}` : "No outstanding work"}</p><details><summary>Technical recovery guidance</summary><p>Use the recorded correlation ID in Audit before retrying work. A retry must remain idempotent and must not hide the original failure.</p></details></article>)}</section></> : <RequestState state="loading" title="Checking platform services">Core placement workflows remain independent of AI and background service health.</RequestState>}</PageContainer>;
}

export function PlatformAudit() {
  const events = useResource<AuditPage>("/platform/audit/events?page=1&page_size=50");
  return <PageContainer context="admin" className={styles.page}><PageHeader eyebrow="Platform accountability" title="Audit" description="Cross-institution sensitive actions are read-only. Actor and correlation identifiers are disclosed only when needed." />{events.error ? <ResourceError message={events.error} retry={events.refresh} /> : null}<section className={styles.list}>{events.data?.items.map((event) => <article key={event.id}><div><strong>{event.event_type.replaceAll(".", " · ")}</strong><small>{new Date(event.created_at).toLocaleString()} · {event.resource_type ?? "platform"}</small></div><Badge tone={event.outcome === "success" ? "success" : "warning"}>{event.outcome}</Badge><p>{event.reason ?? "No additional reason recorded."}</p><details><summary>Technical identifiers</summary><dl><div><dt>Actor</dt><dd><code>{event.actor_user_id ?? "System"}</code></dd></div><div><dt>Correlation</dt><dd><code>{event.correlation_id ?? "Not recorded"}</code></dd></div></dl></details></article>)}{events.loading ? <p role="status">Loading audited events…</p> : null}</section></PageContainer>;
}

export function PlatformSettingsWorkspace() {
  const settings = useResource<PlatformSettings>("/platform/settings");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); setBusy(true); setMessage("");
    try {
      await csrfRequest("/platform/settings", { method: "PATCH", body: JSON.stringify({ platform_notice: { active: data.get("notice_active") === "on", title: data.get("notice_title"), message: data.get("notice_message") } }) });
      settings.refresh(); setMessage("Platform notice saved and audited.");
    } catch (cause) { setMessage(cause instanceof ApiError ? cause.message : "Platform settings were not saved."); }
    finally { setBusy(false); }
  }
  const notice = settings.data?.platform_notice ?? {};
  return <PageContainer context="admin" className={styles.page}><PageHeader eyebrow="Platform configuration" title="Settings" description="Credentials remain write-only and server-side. This screen reports configuration status, never secret values." />{message ? <Alert>{message}</Alert> : null}{settings.data ? <div className={styles.split}><section className={styles.panel}><h2>Service configuration</h2><dl className={styles.definitionList}><div><dt>AI provider</dt><dd>{settings.data.ai_provider}</dd></div><div><dt>AI model</dt><dd>{settings.data.ai_model ?? "Not selected"}</dd></div><div><dt>AI key</dt><dd><Badge tone={settings.data.ai_key_configured ? "success" : "warning"}>{settings.data.ai_key_configured ? "Configured" : "Missing"}</Badge></dd></div><div><dt>Email</dt><dd>{settings.data.email_configured ? "Configured" : "Not configured"}</dd></div><div><dt>Private storage</dt><dd>{settings.data.storage_backend}</dd></div></dl><details><summary>Feature availability</summary><pre>{JSON.stringify(settings.data.feature_availability, null, 2)}</pre></details><details><summary>Default service targets</summary><pre>{JSON.stringify(settings.data.service_targets, null, 2)}</pre></details></section><section className={styles.panel}><p className="eyebrow">Platform notice</p><h2>Publish a service notice</h2><form className={styles.form} onSubmit={save}><label className={styles.checkbox}><input name="notice_active" type="checkbox" defaultChecked={notice.active === true} /> Notice is active</label><label>Title<input name="notice_title" defaultValue={typeof notice.title === "string" ? notice.title : ""} maxLength={120} /></label><label>Message<textarea name="notice_message" defaultValue={typeof notice.message === "string" ? notice.message : ""} maxLength={1000} /></label><Button disabled={busy}>{busy ? "Saving…" : "Save notice"}</Button></form></section></div> : <RequestState state="loading" title="Loading platform configuration">Secret values will not be returned.</RequestState>}</PageContainer>;
}

"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, ArrowRight, Building2, CheckCircle2, ChevronDown, FileText, Plus, ShieldAlert, UserPlus } from "lucide-react";

import { PageContainer, PageHeader } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert, Badge, RequestState } from "@/components/ui/feedback";
import { RecentMfaVerification } from "@/features/auth/recent-mfa-verification";
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
type AuditEvent = {
  id: string;
  event_type: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};
type AuditEventPage = { items: AuditEvent[]; page: number; page_size: number; total: number };
const roleLabels: Record<string, string> = {
  tnp_admin: "Officer",
  tnp_reviewer: "Reviewer",
  tnp_auditor: "Auditor",
};

function ResourceError({ message, retry }: { message: string; retry: () => void }) {
  return <RequestState state="error" title="This platform record is unavailable" onRetry={retry}>{message}</RequestState>;
}

function needsRecentMfa(cause: unknown): boolean {
  return cause instanceof ApiError && cause.code === "reauthentication_required";
}

function generateTemporaryPassword(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@";
  const random = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(random, (value) => alphabet[value & 63]).join("");
}

const activityLabels: Record<string, string> = {
  "staff_account.created": "T&P account created",
  "registration.institution.approved": "Institution approved",
  "institution.provisioned": "Institution added",
  "platform.institution.status_changed": "Institution access changed",
  "platform.notice.published": "Platform notice published",
  "platform.settings.updated": "Platform settings updated",
  "platform_admin.transferred": "Platform administrator changed",
  "auth.manual_recovery_issued": "Recovery access issued",
};

const relevantActivityTypes = new Set(Object.keys(activityLabels));

function activityTitle(eventType: string): string {
  return activityLabels[eventType] ?? eventType.replaceAll(".", " · ").replaceAll("_", " ");
}

function activityEntity(event: AuditEvent): string {
  const username = event.details.username;
  if (typeof username === "string" && username.trim()) return username;
  if (event.resource_type) return event.resource_type.replaceAll("_", " ");
  return "Platform";
}

export function PlatformDashboard() {
  const summary = useResource<DashboardSummary>("/platform/dashboard");
  const activity = useResource<AuditEventPage>("/platform/audit/events?page=1&page_size=20");
  const [showAllActivity, setShowAllActivity] = useState(false);
  const attentionCount = summary.data
    ? summary.data.pending_institution_approvals + summary.data.unresolved_service_items + summary.data.overdue_escalations
    : 0;
  const relevantActivity = activity.data?.items.filter(event => relevantActivityTypes.has(event.event_type)) ?? [];
  const visibleActivity = relevantActivity.slice(0, showAllActivity ? 20 : 5);

  return (
    <PageContainer context="admin" className={`${styles.page} ${styles.dashboardPage}`}>
      <header className={styles.dashboardHeader}>
        <h1>Platform overview</h1>
        <p>Monitor platform operations, institutional access, and outstanding work. Platform Admin manages access and service operations; institutions own placement and appeal decisions.</p>
      </header>

      {summary.error ? <ResourceError message={summary.error} retry={summary.refresh} /> : null}
      {summary.loading ? <RequestState state="loading" title="Loading platform summary">Reading the latest platform records.</RequestState> : null}
      {summary.data ? <>
        <section className={styles.dashboardStatus} data-attention={attentionCount > 0} aria-labelledby="platform-status-title">
          {attentionCount > 0 ? <ShieldAlert aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
          <div>
            <h2 id="platform-status-title">{attentionCount > 0 ? `${attentionCount.toLocaleString()} ${attentionCount === 1 ? "item needs" : "items need"} attention` : "Everything is up to date"}</h2>
            <p>{attentionCount > 0 ? "Review the highlighted queues and take the next action." : "No platform-admin actions currently require attention."}</p>
          </div>
          {attentionCount > 0 ? <a href="#platform-work-title">Review needs attention <ArrowRight aria-hidden="true" /></a> : null}
        </section>

        <section className={styles.dashboardMetrics} aria-label="Platform summary">
          <article data-attention={attentionCount > 0}>
            <span>Needs attention</span>
            <strong>{attentionCount.toLocaleString()} <small>· {attentionCount > 0 ? "Review now" : "All clear"}</small></strong>
          </article>
          <article>
            <span>Active institutions</span>
            <strong>{summary.data.active_institutions.toLocaleString()}</strong>
          </article>
          <article>
            <span>Active T&amp;P accounts</span>
            <strong>{summary.data.tnp_accounts.toLocaleString()}</strong>
          </article>
        </section>

        <div className={styles.dashboardColumns}>
          <div className={styles.dashboardMain}>
            <section className={styles.dashboardQueue} aria-labelledby="platform-work-title">
              <header className={styles.dashboardSectionHeader}>
                <h2 id="platform-work-title">Needs attention</h2>
                <p>Items requiring Platform Admin action.</p>
              </header>
              <div className={styles.dashboardQueueRows}>
                <Link href="/admin/institutions#registration-requests-title" className={styles.dashboardQueueRow} data-attention={summary.data.pending_institution_approvals > 0}>
                  <Building2 aria-hidden="true" />
                  <span className={styles.dashboardQueueCopy}>
                    <strong>Institution approvals</strong>
                    <small>{summary.data.pending_institution_approvals === 0 ? "No requests awaiting review" : `${summary.data.pending_institution_approvals.toLocaleString()} ${summary.data.pending_institution_approvals === 1 ? "request" : "requests"} awaiting review`}</small>
                    <span>Managed by Platform Admin</span>
                  </span>
                  <span className={styles.dashboardQueueCount} aria-label={`${summary.data.pending_institution_approvals} institution approvals pending`}>{summary.data.pending_institution_approvals.toLocaleString()}<small>{summary.data.pending_institution_approvals > 0 ? "Review now" : "No requests"}</small></span>
                  <ArrowRight aria-hidden="true" />
                </Link>
                <Link href="/admin/notices" className={styles.dashboardQueueRow} data-attention={summary.data.unresolved_service_items > 0}>
                  <Activity aria-hidden="true" />
                  <span className={styles.dashboardQueueCopy}>
                    <strong>Service issues</strong>
                    <small>{summary.data.unresolved_service_items === 0 ? "No open service issues" : `${summary.data.unresolved_service_items.toLocaleString()} open service ${summary.data.unresolved_service_items === 1 ? "issue" : "issues"}`}</small>
                    <span>Managed by Platform Admin</span>
                  </span>
                  <span className={styles.dashboardQueueCount} aria-label={`${summary.data.unresolved_service_items} unresolved service items`}>{summary.data.unresolved_service_items.toLocaleString()}<small>{summary.data.unresolved_service_items > 0 ? "Publish notice" : "No incidents"}</small></span>
                  <ArrowRight aria-hidden="true" />
                </Link>
                <Link href="/admin/institutions" className={styles.dashboardQueueRow} data-attention={summary.data.overdue_escalations > 0}>
                  <ShieldAlert aria-hidden="true" />
                  <span className={styles.dashboardQueueCopy}>
                    <strong>Overdue appeals</strong>
                    <small>{summary.data.overdue_escalations === 0 ? "None overdue" : `${summary.data.overdue_escalations.toLocaleString()} ${summary.data.overdue_escalations === 1 ? "appeal is" : "appeals are"} overdue`}</small>
                    <span>Resolved by institutions</span>
                  </span>
                  <span className={styles.dashboardQueueCount} aria-label={`${summary.data.overdue_escalations} overdue appeals`}>{summary.data.overdue_escalations.toLocaleString()}<small>{summary.data.overdue_escalations > 0 ? "Follow up" : "None overdue"}</small></span>
                  <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </section>

            <section className={styles.dashboardQuickActions} aria-labelledby="platform-quick-actions-title">
              <header><h2 id="platform-quick-actions-title">Quick actions</h2><p>Common platform administration tasks.</p></header>
              <nav aria-label="Platform quick actions">
                <Link href="/admin/institutions#add-institution"><Plus aria-hidden="true" />Add institution</Link>
                <Link href="/admin/accounts"><UserPlus aria-hidden="true" />Create T&amp;P account</Link>
                <Link href="/admin/reports"><FileText aria-hidden="true" />View reports</Link>
              </nav>
            </section>
          </div>

          <aside className={styles.dashboardAside} aria-label="Platform context">
            <section className={styles.dashboardCoverage} aria-labelledby="platform-coverage-title">
              <h2 id="platform-coverage-title">Platform coverage</h2>
              <dl>
                <div><dt>Active institutions</dt><dd>{summary.data.active_institutions.toLocaleString()}</dd></div>
                <div><dt>Active T&amp;P accounts</dt><dd>{summary.data.tnp_accounts.toLocaleString()}</dd></div>
              </dl>
              <nav aria-label="Manage platform coverage">
                <Link href="/admin/institutions">View institutions <ArrowRight aria-hidden="true" /></Link>
                <Link href="/admin/accounts">Manage T&amp;P accounts <ArrowRight aria-hidden="true" /></Link>
              </nav>
            </section>
            <section className={styles.dashboardActivity} aria-labelledby="platform-activity-title">
              <h2 id="platform-activity-title">Latest application activity</h2>
              {summary.data.reporting_freshness_at ? (
                <><p>Most recent application record update</p><time dateTime={summary.data.reporting_freshness_at}>{new Date(summary.data.reporting_freshness_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time></>
              ) : <p>No application activity recorded yet.</p>}
              <Link href="/admin/reports">Open reports <ArrowRight aria-hidden="true" /></Link>
            </section>
            <section className={styles.dashboardRecent} aria-labelledby="recent-activity-title" aria-label="Recent activity">
              <header><h2 id="recent-activity-title">Recent activity</h2><p>Latest recorded platform actions.</p></header>
              {activity.loading ? <p className={styles.dashboardRecentState} role="status">Loading recent activity…</p> : null}
              {activity.error ? <p className={styles.dashboardRecentState}>Recent activity is temporarily unavailable.</p> : null}
              {!activity.loading && !activity.error && visibleActivity.length === 0 ? <p className={styles.dashboardRecentState}>No recent platform actions recorded.</p> : null}
              {visibleActivity.length ? <ol>{visibleActivity.map((event) => <li key={event.id}>
                <strong>{activityTitle(event.event_type)}</strong>
                <span>{activityEntity(event)} · <time dateTime={event.created_at}>{new Date(event.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time></span>
              </li>)}</ol> : null}
              {relevantActivity.length > 5 ? <button type="button" onClick={() => setShowAllActivity(value => !value)}>{showAllActivity ? "Show recent activity only" : "View all activity"} <ArrowRight aria-hidden="true" /></button> : null}
            </section>
          </aside>
        </div>
      </> : null}
    </PageContainer>
  );
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
  const [needsVerification, setNeedsVerification] = useState(false);
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
      if (needsRecentMfa(cause)) {
        setNeedsVerification(true);
        setMessage("Confirm your current authenticator code, then submit the institution again.");
      } else {
        setMessage(cause instanceof ApiError ? cause.message : "The institution could not be created.");
      }
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
      if (needsRecentMfa(cause)) {
        setNeedsVerification(true);
        setMessage("Confirm your current authenticator code, then repeat the decision.");
      } else {
        setMessage(cause instanceof ApiError ? cause.message : "The institution request was not changed.");
      }
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
      if (needsRecentMfa(cause)) {
        setNeedsVerification(true);
        setMessage("Confirm your current authenticator code, then repeat the access change.");
      } else {
        setMessage(cause instanceof ApiError ? cause.message : "Institution access was not changed.");
      }
    } finally { setBusy(false); }
  }

  return <PageContainer context="admin" className={styles.page}>
    <PageHeader eyebrow="Institution governance" title="Institutions" description="Add verified institutions, inspect configuration, and read placement records without changing placement decisions." />
    {message ? <Alert>{message}</Alert> : null}
    {needsVerification ? <RecentMfaVerification onVerified={() => { setNeedsVerification(false); setMessage("Verification complete. Repeat your action."); }} /> : null}
    <section className={styles.registrationQueue} aria-labelledby="registration-requests-title">
      <header>
        <div><p className="eyebrow">Institution onboarding</p><h2 id="registration-requests-title">Add Institutes</h2><p>Approve verified requests or add an institute after offline verification.</p></div>
        <Badge tone={requests.data?.length ? "warning" : "neutral"}>{requests.data?.length ?? 0} pending</Badge>
      </header>
      <h3 className={styles.queueHeading}>Registration requests</h3>
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
      <details id="add-institution" className={styles.disclosure}>
        <summary>Add an institute</summary>
        <p>Use this only after the institution and administrator have been verified through the approved support procedure.</p>
        <form onSubmit={provision}>
          <label>Institution name<input name="institution_name" minLength={2} maxLength={200} required /></label>
          <label>Institution code<input name="institution_code" pattern="[a-z0-9][a-z0-9-]{1,30}[a-z0-9]" minLength={3} maxLength={32} required /></label>
          <label>Initial T&amp;P administrator email<input name="admin_email" type="email" required /></label>
          <Button disabled={busy}>{busy ? "Creating institution…" : "Create institution"}</Button>
        </form>
      </details>
      {provisionHandoff ? <section className={styles.activationHandoff} aria-labelledby="activation-handoff-title">
        <div>
          <p className="eyebrow">Secure handoff</p>
          <h3 id="activation-handoff-title">Administrator activation code</h3>
          <p>Share this code with the designated administrator through an approved secure channel. It is displayed only once.</p>
        </div>
        <code aria-label="Administrator activation code">{provisionHandoff.admin_invitation_token}</code>
        <p>Valid until <time dateTime={provisionHandoff.expires_at}>{new Date(provisionHandoff.expires_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time>. If the handoff is lost, revoke the invitation and issue a new code.</p>
        <Button type="button" variant="quiet" onClick={() => setProvisionHandoff(null)}>Done — hide code</Button>
      </section> : null}
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
  const [latestAccount, setLatestAccount] = useState<StaffAccount | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [accountHandoff, setAccountHandoff] = useState<{ username: string; password: string } | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [recoveryAccount, setRecoveryAccount] = useState<StaffAccount | null>(null);
  const [recoveryHandoff, setRecoveryHandoff] = useState<{ username: string; code: string; minutes: number } | null>(null);
  const actionTriggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const accountRows = useMemo(() => {
    const rows = (accounts.data ?? []).filter((account) => account.institution_id === selected);
    if (latestAccount?.institution_id !== selected || rows.some((account) => account.id === latestAccount.id)) return rows;
    return [latestAccount, ...rows];
  }, [accounts.data, latestAccount, selected]);

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

  async function copyTemporaryPassword() {
    try {
      await navigator.clipboard.writeText(password);
      setPasswordMessage("Temporary password copied. Share it through an approved secure channel.");
    } catch {
      setPasswordMessage("Copy is unavailable. Use the visibility control to check the password.");
    }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get("password") !== data.get("confirm_password")) { setMessage("Passwords do not match."); return; }
    setBusy(true); setMessage("");
    try {
      const created = await csrfRequest<StaffAccount>(`/platform/institutions/${selected}/staff-accounts`, { method: "POST", body: JSON.stringify({ username: String(data.get("username") ?? "").trim(), password: data.get("password"), role: data.get("role"), reason: data.get("reason") }) });
      setLatestAccount(created);
      setAccountHandoff({ username: created.username ?? String(data.get("username") ?? "").trim(), password: String(data.get("password") ?? "") });
      form.reset(); setPassword(""); setConfirmedPassword(""); setPasswordMessage(""); accounts.refresh(); setMessage("T&P account created. The officer must accept current terms on first sign-in.");
    } catch (cause) {
      if (needsRecentMfa(cause)) {
        setNeedsVerification(true);
        setMessage("");
      } else if (cause instanceof ApiError && cause.code === "staff_account_conflict") {
        setMessage("This username already exists. Use a different username, or assign the existing officer to this institution below.");
      } else {
        setMessage(cause instanceof ApiError ? cause.message : "The T&P account could not be created.");
      }
    }
    finally { setBusy(false); }
  }

  async function assignExisting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setMessage("");
    try {
      const assigned = await csrfRequest<StaffAccount>(`/platform/institutions/${selected}/staff-assignments`, {
        method: "POST",
        body: JSON.stringify({
          username: String(data.get("username") ?? "").trim(),
          role: data.get("role"),
          reason: data.get("reason"),
        }),
      });
      setLatestAccount(assigned);
      form.reset(); accounts.refresh();
      setMessage("Existing T&P account assigned to this institution. Its next sign-in can use this context.");
    } catch (cause) {
      if (needsRecentMfa(cause)) {
        setNeedsVerification(true);
        setMessage("");
      } else {
        setMessage(cause instanceof ApiError ? cause.message : "The existing account could not be assigned.");
      }
    } finally { setBusy(false); }
  }

  async function changeStatus(event: FormEvent<HTMLFormElement>, account: StaffAccount) {
    event.preventDefault();
    const data = new FormData(event.currentTarget); setBusy(true); setMessage("");
    try {
      await csrfRequest(`/platform/institutions/${selected}/staff-accounts/${account.id}`, { method: "PATCH", body: JSON.stringify({ status: data.get("status"), role: data.get("role"), reason: data.get("reason") }) });
      setLatestAccount(null); accounts.refresh(); setOpenActionId(null); setMessage("T&P access updated and active sessions revoked where required.");
    } catch (cause) {
      if (needsRecentMfa(cause)) {
        setNeedsVerification(true);
        setMessage("");
      } else {
        setMessage(cause instanceof ApiError ? cause.message : "T&P access was not changed.");
      }
    }
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
      if (needsRecentMfa(cause)) {
        setNeedsVerification(true);
        setMessage("");
      } else {
        setMessage(cause instanceof ApiError ? cause.message : "Staff recovery could not be issued.");
      }
    } finally { setBusy(false); }
  }

  return <PageContainer context="admin" className={`${styles.page} ${styles.accountsPage}`}>
    <PageHeader eyebrow="Access governance" title="T&amp;P Accounts" description="The Platform Admin issues institution-scoped Officer, Reviewer, and Auditor access. Roles do not inherit placement powers." />
    {message ? <Alert>{message}</Alert> : null}
    {needsVerification ? <RecentMfaVerification onVerified={() => { setNeedsVerification(false); setMessage("Re-authenticated. Your entries are ready; repeat the action."); }} /> : null}
    <div className={styles.accountsContext}><label className={styles.institutionSelect}>Institution<select value={selected} onChange={(event) => { setRecoveryAccount(null); setRecoveryHandoff(null); setAccountHandoff(null); router.push(`/admin/accounts?institution=${event.target.value}`); }}><option value="">Select an institution</option>{institutions.data?.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
    {selected ? <div className={`${styles.split} ${styles.accountsSplit}`}>
      <div className={styles.accountForms}>
        <section className={`${styles.panel} ${styles.accountsFormPanel}`} aria-labelledby="create-staff-title">
          <h2 id="create-staff-title">Create T&amp;P Account</h2>
          <form className={`${styles.form} ${styles.accountsForm}`} onSubmit={create} autoComplete="off">
            <label>Username<input name="username" pattern="[A-Za-z][A-Za-z0-9._-]{2,63}" maxLength={64} autoComplete="off" required /></label>
            <label>Role<select name="role" defaultValue="tnp_reviewer"><option value="tnp_admin">Officer</option><option value="tnp_reviewer">Reviewer</option><option value="tnp_auditor">Auditor</option></select></label>
            <div className={styles.passwordGroup} role="group" aria-labelledby="initial-sign-in-title">
              <h3 id="initial-sign-in-title" className={styles.passwordGroupTitle}>Initial sign-in</h3>
              <PasswordInput id="staff-initial-password" name="password" label="Temporary password" value={password} onChange={(event) => { setPassword(event.target.value); setPasswordMessage(""); }} autoComplete="new-password" minLength={12} maxLength={128} required />
              <PasswordInput id="staff-confirm-password" name="confirm_password" label="Confirm password" value={confirmedPassword} onChange={(event) => setConfirmedPassword(event.target.value)} autoComplete="new-password" minLength={12} maxLength={128} required />
              <div className={styles.passwordTools}><Button type="button" variant="quiet" onClick={() => { const generated = generateTemporaryPassword(); setPassword(generated); setConfirmedPassword(generated); setPasswordMessage("A strong temporary password was generated and confirmed."); }}>Generate</Button><Button type="button" variant="quiet" disabled={!password} onClick={() => void copyTemporaryPassword()}>Copy</Button></div>
              <p className={styles.fieldHint}>Ask the user to change this password after first sign-in. Share it through an approved secure channel.</p>
              {passwordMessage ? <p className={styles.fieldFeedback} role="status">{passwordMessage}</p> : null}
            </div>
            <label>Audit reason<textarea name="reason" minLength={10} maxLength={500} placeholder="e.g. Assigned as placement reviewer for the 2026 recruitment cycle" aria-describedby="create-audit-hint" required /><small id="create-audit-hint">Required · Briefly explain why this access is being issued.</small></label>
            <div className={styles.formActions}><Button disabled={busy || needsVerification}>{busy ? "Creating…" : "Create account"}</Button></div>
          </form>
          {accountHandoff ? <section className={styles.accountPasswordHandoff} aria-labelledby="account-handoff-title">
            <h3 id="account-handoff-title">Temporary password for {accountHandoff.username}</h3>
            <p>Share this password through an approved secure channel. It is displayed here until you hide it or leave this page.</p>
            <code>{accountHandoff.password}</code>
            <Button type="button" variant="quiet" onClick={() => setAccountHandoff(null)}>Done — hide password</Button>
          </section> : null}
        </section>
        <details className={`${styles.panel} ${styles.assignmentPanel}`}>
          <summary>Assign existing account <ChevronDown size={18} aria-hidden="true" /></summary>
          <p className={styles.panelDescription}>Use an existing T&amp;P login for this institution.</p>
          <form className={`${styles.form} ${styles.accountsForm}`} onSubmit={assignExisting} autoComplete="off">
            <label>Existing username<input name="username" pattern="[A-Za-z][A-Za-z0-9._-]{2,63}" maxLength={64} autoComplete="off" required /></label>
            <label>Role at this institution<select name="role" defaultValue="tnp_reviewer"><option value="tnp_admin">Officer</option><option value="tnp_reviewer">Reviewer</option><option value="tnp_auditor">Auditor</option></select></label>
            <label>Audit reason<textarea name="reason" minLength={10} maxLength={500} placeholder="e.g. Assigned to review applications for this institution" aria-describedby="assign-audit-hint" required /><small id="assign-audit-hint">Required · Briefly explain why this access is being issued.</small></label>
            <div className={styles.formActions}><Button disabled={busy || needsVerification}>{busy ? "Assigning…" : "Assign existing account"}</Button></div>
          </form>
        </details>
      </div>
      <section className={`${styles.list} ${styles.accountDirectory}`} aria-label="T&P account directory">
        <header className={styles.directoryHeader}><h2>T&amp;P Accounts <span aria-label={`${accountRows.length} ${accountRows.length === 1 ? "account" : "accounts"}`}>· {accountRows.length}</span></h2></header>
        {accounts.loading && !accountRows.length ? <p className={styles.directoryNotice} role="status">Loading T&amp;P accounts…</p> : null}
        {accounts.error ? <ResourceError message={accounts.error} retry={accounts.refresh} /> : null}
        {accountRows.map((account) => <article key={account.id}><div><strong>{account.username ?? account.email}</strong><small>{roleLabels[account.role] ?? account.role}</small></div><Badge tone={account.status === "active" ? "success" : "warning"}>{account.status}</Badge><div className={styles.actionMenu} data-account-action-menu>
        <button type="button" className={styles.actionTrigger} aria-haspopup="dialog" aria-expanded={openActionId === account.id} aria-controls={`account-actions-${account.id}`} ref={(element) => { if (element) actionTriggerRefs.current.set(account.id, element); else actionTriggerRefs.current.delete(account.id); }} onClick={() => setOpenActionId((current) => current === account.id ? null : account.id)}>Actions <ChevronDown aria-hidden="true" /></button>
        {openActionId === account.id ? <form id={`account-actions-${account.id}`} className={styles.actionPopover} role="dialog" aria-label={`Actions for ${account.username ?? account.email}`} onSubmit={(event) => void changeStatus(event, account)}><p>Update this institution-scoped account.</p><label>Role<select name="role" defaultValue={account.role}><option value="tnp_admin">Officer</option><option value="tnp_reviewer">Reviewer</option><option value="tnp_auditor">Auditor</option></select></label><label>Status<select name="status" defaultValue={account.status}><option value="active">Active</option><option value="suspended">Suspended</option><option value="revoked">Revoked</option></select></label><label>Audit reason<input name="reason" minLength={10} required /></label><div className={styles.menuActions}><Button variant="quiet" type="button" onClick={() => setOpenActionId(null)}>Cancel</Button><Button disabled={busy || needsVerification}>{busy ? "Saving…" : "Save changes"}</Button></div><Button variant="quiet" type="button" onClick={() => { setRecoveryAccount(account); setOpenActionId(null); }}>Issue manual recovery code</Button></form> : null}
      </div></article>)}{accounts.data && !accountRows.length && !accounts.error ? <p className={styles.directoryNotice}>No accounts are assigned to this institution yet.</p> : null}</section>
    </div> : <RequestState state="empty" title="Choose an institution">T&amp;P access is always issued inside an institution boundary.</RequestState>}
    {recoveryAccount ? <section className={styles.panel}><h2>Recover {recoveryAccount.username ?? "T&P account"}</h2><p>Verify the officer through your approved institutional process before issuing a code. Do not record full ID numbers here.</p><form className={styles.form} onSubmit={issueStaffRecovery}><label>Identity check method<input name="identity_check_method" minLength={5} maxLength={100} required /></label><label>Verification reference<input name="identity_check_reference" minLength={5} maxLength={120} required /></label><label>Recovery audit reason<textarea name="reason" minLength={10} maxLength={500} required /></label><div className={styles.inlineActions}><Button disabled={busy || needsVerification}>Issue one-time code</Button><Button type="button" variant="quiet" onClick={() => setRecoveryAccount(null)}>Cancel</Button></div></form></section> : null}
    {recoveryHandoff ? <section className={styles.panel}><h2>One-time recovery code for {recoveryHandoff.username}</h2><p>Show this code only through an institution-approved secure handoff. The officer chooses their own replacement password. It expires in {recoveryHandoff.minutes} minutes.</p><code>{recoveryHandoff.code}</code><div><Button type="button" variant="quiet" onClick={() => setRecoveryHandoff(null)}>Done — hide code</Button></div></section> : null}
  </PageContainer>;
}

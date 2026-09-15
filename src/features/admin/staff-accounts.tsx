"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ChevronDown, Ellipsis } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, Badge, RequestState } from "@/components/ui/feedback";
import { ApiError, apiRequest, csrfRequest } from "@/lib/api/client";
import type {
  MembershipPage,
  MembershipResponse,
  StaffAccountCreate,
  StaffAccountResponse,
  UserResponse,
} from "@/lib/api/generated/types.gen";

import styles from "./staff-accounts.module.css";

const staffRoles = ["tnp_admin", "tnp_reviewer", "tnp_auditor"] as const;
const roleLabels: Record<(typeof staffRoles)[number], string> = {
  tnp_admin: "T&P administrator",
  tnp_reviewer: "T&P reviewer",
  tnp_auditor: "T&P auditor",
};

export function StaffAccounts() {
  const [institutionId, setInstitutionId] = useState("");
  const [accounts, setAccounts] = useState<MembershipResponse[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "forbidden" | "error">("loading");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    setMessage("");
    try {
      const me = await apiRequest<UserResponse>("/auth/me", { cache: "no-store" });
      if (me.role !== "tnp_owner" || !me.institution_id) {
        setState("forbidden");
        return;
      }
      const pages = await Promise.all(
        staffRoles.map((role) =>
          apiRequest<MembershipPage>(
            `/institutions/${me.institution_id}/memberships?role=${role}&page=1&page_size=100`,
            { cache: "no-store" },
          ),
        ),
      );
      setInstitutionId(me.institution_id);
      setAccounts(
        pages
          .flatMap((page) => page.items)
          .sort((left, right) => (left.username ?? "").localeCompare(right.username ?? "")),
      );
      setState("ready");
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "T&P accounts could not be loaded.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  useEffect(() => {
    if (!openActionId) return;
    const closeOutside = (event: PointerEvent) => {
      const targetMenu = (event.target as Element | null)?.closest<HTMLElement>("[data-action-menu]");
      if (targetMenu?.dataset.actionMenu !== openActionId) setOpenActionId(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpenActionId(null);
      document.getElementById(`account-action-${openActionId}`)?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [openActionId]);

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    if (password !== String(data.get("confirm_password") ?? "")) {
      setMessage("Passwords do not match.");
      return;
    }
    const payload: StaffAccountCreate = {
      username: String(data.get("username") ?? ""),
      password,
      role: data.get("role") as StaffAccountCreate["role"],
      reason: String(data.get("reason") ?? ""),
    };
    setBusy(true);
    setMessage("");
    try {
      const created = await csrfRequest<StaffAccountResponse>(
        `/institutions/${institutionId}/staff-accounts`,
        { method: "POST", body: JSON.stringify(payload) },
      );
      form.reset();
      await load();
      setMessage(`${created.username} can now sign in through the T&P workspace.`);
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "The T&P account could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(event: FormEvent<HTMLFormElement>, membershipId: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setMessage("");
    try {
      await csrfRequest(`/institutions/${institutionId}/memberships/${membershipId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: data.get("status"), reason: data.get("reason") }),
      });
      setOpenActionId(null);
      await load();
      setMessage("T&P account access updated and recorded in Audit.");
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "The account access was not changed.");
    }
  }

  if (state === "loading") {
    return <main className={styles.page}><RequestState state="loading" title="Loading T&P accounts">Checking your institution-owner authority.</RequestState></main>;
  }
  if (state === "forbidden") {
    return <main className={styles.page}><RequestState state="error" title="Admin access required">Only the institution owner can create or manage T&P officer accounts.</RequestState></main>;
  }
  if (state === "error") {
    return <main className={styles.page}><RequestState state="error" title="T&P accounts are unavailable" onRetry={() => void load()}>{message}</RequestState></main>;
  }

  return (
    <main id="main-content" className={styles.page}>
      <header>
        <div>
          <p className="eyebrow">Institution-owner control</p>
          <h1>T&amp;P accounts</h1>
          <p>Create scoped officer credentials without relying on hosted email.</p>
        </div>
      </header>

      {message ? <Alert>{message}</Alert> : null}

      <section className={styles.createPanel} aria-labelledby="create-account-title">
        <div className={styles.explanation}>
          <p className="eyebrow">Account creation</p>
          <h2 id="create-account-title">Issue a T&amp;P officer account</h2>
          <p>Set a strong first password and share it privately. CampusHire never emails or returns the password.</p>
          <p>The officer accepts the Terms and Privacy Notice personally. An authenticator can be enabled later from Account settings.</p>
        </div>
        <form className={styles.form} onSubmit={createAccount}>
          <label>Officer username<input name="username" type="text" minLength={3} maxLength={64} pattern="[A-Za-z][A-Za-z0-9._-]{2,63}" autoComplete="off" required placeholder="placement.officer" /></label>
          <label>Role<select name="role" defaultValue="tnp_reviewer"><option value="tnp_admin">T&amp;P administrator</option><option value="tnp_reviewer">T&amp;P reviewer</option><option value="tnp_auditor">T&amp;P auditor</option></select></label>
          <div className={styles.passwords}>
            <label>Initial password<input name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required /></label>
            <label>Confirm password<input name="confirm_password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required /></label>
          </div>
          <label>Audit reason<textarea name="reason" minLength={10} maxLength={500} required placeholder="Why this officer needs access" /></label>
          <Button type="submit" disabled={busy}>{busy ? "Creating account…" : "Create T&P account"}</Button>
        </form>
      </section>

      <section className={styles.directory} aria-labelledby="staff-directory-title">
        <header><div><h2 id="staff-directory-title">Current T&amp;P access</h2><p>{accounts.length} officer account{accounts.length === 1 ? "" : "s"}</p></div><Badge>{accounts.length} accounts</Badge></header>
        {accounts.length ? (
          <div className={styles.accountList}>
            {accounts.map((account) => (
              <article key={account.id}>
                <div><strong>{account.username ?? "Username unavailable"}</strong><small>{roleLabels[account.role as keyof typeof roleLabels] ?? account.role}</small></div>
                <Badge tone={account.status === "active" ? "success" : "warning"}>{account.status}</Badge>
                <div className={styles.actionMenu} data-action-menu={account.id}>
                  <button
                    id={`account-action-${account.id}`}
                    className={styles.actionTrigger}
                    type="button"
                    aria-expanded={openActionId === account.id}
                    aria-controls={`account-action-panel-${account.id}`}
                    onClick={() => setOpenActionId((current) => current === account.id ? null : account.id)}
                  >
                    <Ellipsis aria-hidden="true" />Action<ChevronDown aria-hidden="true" />
                  </button>
                  {openActionId === account.id ? <form id={`account-action-panel-${account.id}`} aria-label={`Actions for ${account.username ?? "officer account"}`} onSubmit={(event) => void changeStatus(event, account.id)}>
                    <label>Status<select name="status" defaultValue={account.status}><option value="active">Active</option><option value="suspended">Suspended</option><option value="revoked">Revoked</option></select></label>
                    <label>Audit reason<input name="reason" minLength={10} maxLength={500} required placeholder="Reason for access change" /></label>
                    <Button type="submit" variant="quiet">Confirm change</Button>
                  </form> : null}
                </div>
              </article>
            ))}
          </div>
        ) : <RequestState state="empty" title="No T&P officers yet">Create the first scoped officer account above.</RequestState>}
      </section>
    </main>
  );
}

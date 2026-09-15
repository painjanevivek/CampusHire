"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookmarkCheck, MapPin } from "lucide-react";

import { Alert, RequestState } from "@/components/ui/feedback";
import { cachedApiRequest, csrfRequest } from "@/lib/api/client";
import type { Opportunity, OpportunityPage } from "@/features/recruitment/types";
import styles from "./profile-workspace.module.css";

export function SavedRoles() {
  const [roles, setRoles] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const page = await cachedApiRequest<OpportunityPage>("/opportunities?saved_only=true", { force });
      setRoles(page.items);
      setMessage("");
    } catch {
      setMessage("Saved roles could not be loaded. Your existing bookmarks are unchanged.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  async function removeRole(role: Opportunity) {
    try {
      await csrfRequest(`/opportunities/${role.id}/save`, { method: "POST" });
      setRoles((current) => current.filter((item) => item.id !== role.id));
    } catch {
      setMessage("This bookmark could not be removed. Try again.");
    }
  }

  return <section className={styles.savedRoles} aria-labelledby="saved-roles-title">
    <header><div><p>Saved roles</p><h2 id="saved-roles-title">Roles you want to revisit.</h2><span>Bookmarks stay in your account until you remove them.</span></div><Link href="/opportunities?saved_only=true">Open saved roles</Link></header>
    {message ? <Alert tone="warning">{message} <button type="button" onClick={() => void load(true)}>Retry</button></Alert> : null}
    {loading ? <RequestState state="loading" title="Loading saved roles">Reading your bookmarks.</RequestState> : null}
    {!loading && !message && !roles.length ? <RequestState state="empty" title="No saved roles yet">Use the bookmark on any opportunity to keep it here.</RequestState> : null}
    {!loading && roles.length ? <div className={styles.savedRoleList}>{roles.map((role) => <article key={role.id}><div className={styles.savedRoleMark} aria-hidden="true">{role.company_name.slice(0, 1)}</div><div><p>{role.company_name}</p><h3><Link href={`/opportunities/${role.id}`}>{role.title}</Link></h3><span><MapPin aria-hidden="true" />{role.location} · {role.work_mode}</span></div><button type="button" onClick={() => void removeRole(role)} aria-label={`Remove ${role.title} from saved roles`}><BookmarkCheck aria-hidden="true" />Remove</button></article>)}</div> : null}
  </section>;
}

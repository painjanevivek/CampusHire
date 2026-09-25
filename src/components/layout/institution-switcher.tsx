"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiRequest, csrfRequest } from "@/lib/api/client";
import styles from "./admin-workspace.module.css";

type MembershipChoice = {
  id: string;
  institution_id: string;
  institution_name: string;
  role: string;
};

export function InstitutionSwitcher({ institutionId }: { institutionId?: string | null }) {
  const router = useRouter();
  const [choices, setChoices] = useState<MembershipChoice[]>([]);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void apiRequest<MembershipChoice[]>("/auth/memberships", {
      cache: "no-store",
      signal: controller.signal,
    }).then((result) => {
      setError("");
      setChoices(result);
      setSelected(result.find((item) => item.institution_id === institutionId)?.id ?? "");
    }).catch((cause) => {
      if (controller.signal.aborted || (cause instanceof DOMException && cause.name === "AbortError")) return;
      setError("Institution data couldn't refresh.");
    });
    return () => controller.abort();
  }, [institutionId, refreshKey]);

  async function switchInstitution(membershipId: string) {
    if (!membershipId || membershipId === selected) return;
    setBusy(true);
    setError("");
    try {
      await csrfRequest("/auth/active-membership", {
        method: "POST",
        body: JSON.stringify({ membership_id: membershipId }),
      });
      setSelected(membershipId);
      router.replace("/tnp/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Institution could not be changed.");
    } finally {
      setBusy(false);
    }
  }

  if (!choices.length && !error) return null;
  return <div className={styles.institutionContext}>
    {choices.length > 1 ? <label>
      <span>Current institution</span>
      <select aria-label="Current institution" value={selected} disabled={busy} onChange={(event) => void switchInstitution(event.target.value)}>
        {choices.map((item) => <option key={item.id} value={item.id}>{item.institution_name}</option>)}
      </select>
    </label> : choices.length === 1 ? <p><span>Institution</span><strong>{choices[0].institution_name}</strong></p> : null}
    {error ? <div className={styles.institutionError} role="status"><span>{error}</span><button type="button" onClick={() => { setError(""); setRefreshKey((current) => current + 1); }}>Retry</button></div> : null}
  </div>;
}

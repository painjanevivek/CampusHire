"use client";

import { useCallback, useEffect, useState } from "react";

import { Alert } from "@/components/ui/feedback";
import type { DashboardApiResponse } from "@/features/engagement/types";
import { cachedApiRequest } from "@/lib/api/client";
import { safeInternalHref } from "@/lib/navigation";
import {
  StudentDashboard,
  type StudentDashboardData,
} from "./student-dashboard";
import styles from "./student-dashboard.module.css";

function toDashboardData(response: DashboardApiResponse): StudentDashboardData {
  return {
    studentName: response.student_name,
    readiness: response.readiness,
    state: response.state,
    nextAction: {
      ...response.next_action,
      href: safeInternalHref(response.next_action.href),
    },
    evidence: response.evidence,
    opportunities: response.opportunities.map((item) => ({
      company: item.company,
      role: item.role,
      location: item.location,
      eligibility: "Eligible",
      match: item.match,
      href: safeInternalHref(item.href, "/opportunities"),
    })),
  };
}

export function ConnectedStudentDashboard() {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (force = false) => {
    await Promise.resolve();
    setError("");
    try {
      setData(
        toDashboardData(
          await cachedApiRequest<DashboardApiResponse>("/dashboard", { force }),
        ),
      );
    } catch {
      setError(
        "Your readiness workspace could not be refreshed. Your saved profile and applications are unchanged.",
      );
    }
  }, []);

  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  if (!data)
    return (
      <main id="main-content" className={styles.loadingState} aria-busy="true">
        <h1>Your readiness workspace</h1>
        {error ? (
          <Alert tone="error">
            {error}{" "}
            <button type="button" onClick={() => void load(true)}>
              Retry
            </button>
          </Alert>
        ) : (
          <>
            <p>Checking your reviewed profile…</p>
            <span>Profile · resume · roadmap · eligible roles</span>
          </>
        )}
      </main>
    );
  return <StudentDashboard data={data} />;
}

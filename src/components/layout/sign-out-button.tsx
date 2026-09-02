"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { csrfRequest } from "@/lib/api/client";
import styles from "./sign-out-button.module.css";

export function clearCampusHireBrowserState() {
  for (const storageName of ["localStorage", "sessionStorage"] as const) {
    try {
      const storage = window[storageName];
      const campusHireKeys: string[] = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key?.startsWith("campushire.")) campusHireKeys.push(key);
      }
      for (const key of campusHireKeys) {
        try {
          storage.removeItem(key);
        } catch {
          // Continue clearing other application-owned keys before redirecting.
        }
      }
    } catch {
      // Storage can be unavailable under hardened browser privacy settings.
    }
  }
}

export function SignOutButton({ destination }: { destination: "/sign-in" | "/admin/sign-in" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await csrfRequest<void>("/auth/sign-out", { method: "POST" });
    } catch {
      setError("Sign out failed. Your session is still active.");
      setPending(false);
      return;
    }
    clearCampusHireBrowserState();
    router.replace(destination);
    router.refresh();
  }

  return (
    <div className={styles.root}>
      <button type="button" onClick={() => void signOut()} disabled={pending} aria-label="Sign out">
        <LogOut aria-hidden="true" />
        <span className="srOnly">{pending ? "Signing out" : "Sign out"}</span>
      </button>
      {error ? <span className={styles.error} role="alert">{error}</span> : null}
    </div>
  );
}

"use client";

import Image from "next/image";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Camera, UserRound } from "lucide-react";
import { ApiError, cachedApiRequest, csrfRequest } from "@/lib/api/client";
import type { ProfilePhotoResponse } from "@/lib/api/generated/types.gen";
import styles from "./profile-photo.module.css";

const PhotoContext = createContext<{ photo: string | null; update: (photo: string | null) => void }>({ photo: null, update: () => {} });

export function ProfilePhotoProvider({ children }: { children: ReactNode }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const revision = useRef(0);
  useEffect(() => {
    let active = true;
    const current = revision.current;
    void cachedApiRequest<ProfilePhotoResponse>("/profile/photo").then(result => {
      if (active && revision.current === current) setPhoto(result.data_url ?? null);
    }).catch(() => {}); // An unavailable optional photo must not block navigation.
    return () => { active = false; };
  }, []);
  return <PhotoContext.Provider value={{ photo, update: value => { revision.current += 1; setPhoto(value); } }}>{children}</PhotoContext.Provider>;
}

export function ProfileAvatar() {
  const { photo } = useContext(PhotoContext);
  return photo ? <Image src={photo} width={96} height={96} unoptimized alt="" className={styles.image} /> : <UserRound aria-hidden="true" />;
}

export function ProfilePhotoUpload() {
  const { photo, update } = useContext(PhotoContext);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function upload(file?: File) {
    if (!file || busy) return;
    setError(""); setMessage("");
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError("Choose a JPEG or PNG photo smaller than 2 MB.");
      if (input.current) input.current.value = "";
      return;
    }
    setBusy(true);
    try {
      const body = new FormData(); body.append("file", file);
      const result = await csrfRequest<ProfilePhotoResponse>("/profile/photo", { method: "PUT", body });
      update(result.data_url ?? null); setMessage("Profile photo updated.");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Your photo could not be saved. Try again.");
    } finally { setBusy(false); if (input.current) input.current.value = ""; }
  }

  async function remove() {
    setBusy(true); setError(""); setMessage("");
    try {
      await csrfRequest<void>("/profile/photo", { method: "DELETE" });
      update(null); setMessage("Profile photo removed.");
    } catch { setError("Your photo could not be removed. Try again."); }
    finally { setBusy(false); }
  }

  return <div className={styles.editor}>
    <div className={styles.avatar} role="img" aria-label="Your profile photo"><ProfileAvatar /></div>
    <div className={styles.controls}>
      <input ref={input} className="srOnly" tabIndex={-1} type="file" accept="image/jpeg,image/png" aria-label="Choose profile photo" disabled={busy} onChange={event => void upload(event.target.files?.[0])} />
      <button type="button" disabled={busy} onClick={() => input.current?.click()}><Camera size={16} aria-hidden="true" />{busy ? "Saving…" : photo ? "Change photo" : "Upload photo"}</button>
      {photo && <button type="button" disabled={busy} onClick={() => void remove()}>Remove photo</button>}
    </div>
    <p>Optional · JPEG or PNG, up to 2 MB and 8 megapixels. Visible only in your account, not used for hiring decisions.</p>
    {message && <p role="status">{message}</p>}{error && <p role="alert">{error}</p>}
  </div>;
}

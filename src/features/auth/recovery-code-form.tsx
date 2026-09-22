"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import { PasswordResetForm } from "./password-reset-form";

export function RecoveryCodeForm() {
  const [code, setCode] = useState("");

  function continueWithCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = String(data.get("code") ?? "").trim();
    if (value.length >= 20 && value.length <= 200 && /^[A-Za-z0-9_-]+$/.test(value)) {
      setCode(value);
    }
  }

  if (code) return <PasswordResetForm token={code} />;
  return <form className="authForm" onSubmit={continueWithCode}>
    <Input id="recovery-code" name="code" label="One-time recovery code" autoComplete="off" minLength={20} maxLength={200} pattern="[A-Za-z0-9_-]+" required hint="Use the code given to you after your placement office verifies your identity." />
    <Button type="submit">Continue</Button>
  </form>;
}

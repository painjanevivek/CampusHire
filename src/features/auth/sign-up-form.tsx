"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form-controls";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiError, apiRequest, csrfRequest } from "@/lib/api/client";
import type { RegistrationStartResponse, SignupInstitution } from "@/lib/api/generated/types.gen";

export function SignUpForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [institutions, setInstitutions] = useState<SignupInstitution[]>([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(true);
  const [institutionsError, setInstitutionsError] = useState("");
  const [invitationOpen, setInvitationOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void apiRequest<SignupInstitution[]>("/auth/signup/institutions", {
      signal: controller.signal,
    })
      .then(setInstitutions)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setInstitutionsError(
            cause instanceof ApiError ? cause.message : "College options could not be loaded. Try again.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setInstitutionsLoading(false);
      });

    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    const repeatedPassword = String(data.get("re_enter_password") ?? "");

    setError("");
    setNotice("");
    setPasswordError("");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (password !== repeatedPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const result = await csrfRequest<RegistrationStartResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: data.get("name"),
          surname: data.get("surname"),
          dob: data.get("dob"),
          email: data.get("email"),
          institution_id: data.get("institution_id"),
          invitation_code: String(data.get("invitation_code") ?? "").trim() || null,
          password,
          re_enter_password: repeatedPassword,
          terms_version: "2026-08-28",
          privacy_version: "2026-08-28",
        }),
      });
      if (result.next_path) {
        router.push(result.next_path);
        return;
      }
      if (result.status === "approval_pending") {
        setNotice(result.message);
      } else {
        setError(result.message);
      }
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Registration could not be started.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="authForm studentSignUpForm" onSubmit={submit}>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <div className="signUpFieldPair">
        <Input
          id="name"
          name="name"
          label="Name"
          autoComplete="given-name"
          minLength={1}
          maxLength={100}
          required
        />
        <Input
          id="surname"
          name="surname"
          label="Surname"
          autoComplete="family-name"
          minLength={1}
          maxLength={100}
          required
        />
      </div>

      <Input id="dob" name="dob" type="date" label="DOB" autoComplete="bday" required />
      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        hint="Any valid email address works. Your selected college reviews access before activation."
        required
      />
      <Select
        id="institution_id"
        name="institution_id"
        label="College"
        hint={institutionsLoading
          ? "Loading available colleges…"
          : "Choose the college where you want placement access. A valid invitation code can activate your account now."
        }
        required
        disabled={institutionsLoading || Boolean(institutionsError) || institutions.length === 0}
      >
        <option value="">{institutionsLoading ? "Loading colleges…" : "Select your college"}</option>
        {institutions.map((institution) => (
          <option key={institution.id} value={institution.id}>{institution.name}</option>
        ))}
      </Select>
      {institutionsError ? <Alert tone="error">{institutionsError}</Alert> : null}
      {!institutionsLoading && !institutionsError && institutions.length === 0 ? (
        <Alert tone="info">No colleges are available for registration yet.</Alert>
      ) : null}
      <div className="signUpInvitation">
        <button
          className="signUpInvitationTrigger"
          type="button"
          aria-expanded={invitationOpen}
          aria-controls="signup-invitation-panel"
          onClick={() => setInvitationOpen((open) => !open)}
        >
          <span>
            <strong>Have an invitation code?</strong>
            <small>Optional · use a code from your placement office to activate now.</small>
          </span>
          <ChevronDown aria-hidden="true" className={invitationOpen ? "isOpen" : undefined} />
        </button>
        <div
          className={`signUpInvitationPanel${invitationOpen ? " isOpen" : ""}`}
          id="signup-invitation-panel"
          aria-hidden={!invitationOpen}
          inert={!invitationOpen}
        >
          <div className="signUpInvitationInner">
            <Input
              id="invitation_code"
              name="invitation_code"
              label="Invitation code (optional)"
              autoComplete="off"
              minLength={20}
              maxLength={200}
              hint="The code must be issued for the email address above."
            />
          </div>
        </div>
      </div>

      <div className="signUpFieldPair">
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
        />
        <PasswordInput
          id="re_enter_password"
          name="re_enter_password"
          label="Re-enter password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
          error={passwordError}
          onChange={() => passwordError && setPasswordError("")}
        />
      </div>

      <label className="signUpConsent">
        <input name="accept" type="checkbox" required />
        <span>I accept the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Notice</Link>.</span>
      </label>
      <Button
        type="submit"
        disabled={busy || institutionsLoading || Boolean(institutionsError) || institutions.length === 0}
        aria-busy={busy}
      >
        Sign Up
      </Button>
    </form>
  );
}

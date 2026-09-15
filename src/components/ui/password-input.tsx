"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export function PasswordInput({ id, label, hint, error, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const messageId = `${id}-${error ? "error" : "hint"}`;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="passwordInputControl">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={hint || error ? messageId : undefined}
          {...props}
        />
        <button
          className="passwordVisibilityButton"
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </div>
      {(error || hint) ? (
        <small
          id={messageId}
          className={error ? "fieldError" : undefined}
          role={error ? "alert" : undefined}
        >
          {error ?? hint}
        </small>
      ) : null}
    </div>
  );
}

import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export function Input({ id, label, hint, error, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const messageId = `${id}-${error ? "error" : "hint"}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={Boolean(error)} aria-describedby={hint || error ? messageId : undefined} {...props} />
      {(error || hint) && <small id={messageId} className={error ? "fieldError" : undefined} role={error ? "alert" : undefined}>{error ?? hint}</small>}
    </div>
  );
}

export function Select({ id, label, hint, error, children, ...props }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const messageId = `${id}-${error ? "error" : "hint"}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} aria-invalid={Boolean(error)} aria-describedby={hint || error ? messageId : undefined} {...props}>{children}</select>
      {(error || hint) && <small id={messageId} className={error ? "fieldError" : undefined} role={error ? "alert" : undefined}>{error ?? hint}</small>}
    </div>
  );
}

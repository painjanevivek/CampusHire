"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function Dialog({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    if (!open && ref.current?.open) ref.current.close();
  }, [open]);
  return (
    <dialog ref={ref} aria-labelledby="dialog-title" onClose={onClose} onCancel={onClose}>
      <div className="dialogHeader"><h2 id="dialog-title">{title}</h2><button className="iconButton" aria-label="Close dialog" onClick={onClose}>×</button></div>
      {children}
    </dialog>
  );
}

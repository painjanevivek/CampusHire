"use client";

import { useEffect } from "react";

export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);
  return <div className="toast" role="status"><span>{message}</span><button aria-label="Dismiss notification" onClick={onDismiss}>×</button></div>;
}

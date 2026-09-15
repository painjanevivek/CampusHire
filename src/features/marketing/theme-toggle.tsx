"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

import styles from "./editorial-landing.module.css";

type Theme = "dark" | "light";

const storageKey = "campushire-theme";
const themeListeners = new Set<() => void>();

function getThemeSnapshot(): Theme {
  const storedTheme = window.localStorage.getItem(storageKey);
  if (storedTheme === "dark" || storedTheme === "light") return storedTheme;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function subscribeToTheme(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia?.("(prefers-color-scheme: light)");
  const handleExternalChange = () => onStoreChange();

  themeListeners.add(onStoreChange);
  mediaQuery?.addEventListener("change", handleExternalChange);
  window.addEventListener("storage", handleExternalChange);

  return () => {
    themeListeners.delete(onStoreChange);
    mediaQuery?.removeEventListener("change", handleExternalChange);
    window.removeEventListener("storage", handleExternalChange);
  };
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(storageKey, theme);
  themeListeners.forEach((listener) => listener());
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      aria-label={`Switch to ${nextTheme} mode`}
      className={styles.themeToggle}
      onClick={() => {
        applyTheme(nextTheme);
      }}
      title={`Switch to ${nextTheme} mode`}
      type="button"
    >
      {theme === "dark" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
    </button>
  );
}

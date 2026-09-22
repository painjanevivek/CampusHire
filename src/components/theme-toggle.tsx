"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";

import styles from "./theme-toggle.module.css";

type Theme = "dark" | "light";

const storageKey = "campushire-theme";
const themeListeners = new Set<() => void>();

function getThemeSnapshot(): Theme {
  try {
    const storedTheme = window.localStorage.getItem(storageKey);
    if (storedTheme === "dark" || storedTheme === "light") return storedTheme;
  } catch {
    // Use the system preference when browser storage is unavailable.
  }
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
  try {
    window.localStorage.setItem(storageKey, theme);
  } catch {
    // The active page still changes theme when browser storage is unavailable.
  }
  themeListeners.forEach((listener) => listener());
}

export function ThemeSynchronizer() {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => "dark");

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return null;
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
      className={styles.toggle}
      onClick={() => applyTheme(nextTheme)}
      title={`Switch to ${nextTheme} mode`}
      type="button"
    >
      {theme === "dark" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
    </button>
  );
}

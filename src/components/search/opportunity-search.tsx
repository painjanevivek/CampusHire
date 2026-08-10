"use client";

import type { FormEvent } from "react";
import { MapPin, Search } from "lucide-react";

import styles from "./opportunity-search.module.css";

type SearchValues = { keyword: string; location: string };

export function OpportunitySearch({
  keyword,
  location,
  onKeywordChange,
  onLocationChange,
  onSubmit,
  actionLabel = "Find opportunities",
}: {
  keyword: string;
  location: string;
  onKeywordChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSubmit: (values: SearchValues) => void;
  actionLabel?: string;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ keyword: keyword.trim(), location: location.trim() });
  }

  return (
    <form className={styles.form} role="search" onSubmit={submit}>
      <label className={styles.field}>
        <span>Job title, keywords, or company</span>
        <span className={styles.control}>
          <Search size={21} aria-hidden="true" />
          <input
            type="search"
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="Job title, keywords, or company"
          />
        </span>
      </label>
      <label className={`${styles.field} ${styles.location}`}>
        <span>City, state, or remote</span>
        <span className={styles.control}>
          <MapPin size={21} aria-hidden="true" />
          <input
            value={location}
            onChange={(event) => onLocationChange(event.target.value)}
            placeholder="City, state, or remote"
          />
        </span>
      </label>
      <button type="submit" disabled={!keyword.trim() && !location.trim()}>
        {actionLabel}
      </button>
    </form>
  );
}

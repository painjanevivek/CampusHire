import Link from "next/link";

import styles from "./placement-access-unavailable.module.css";

function ordinalStudyYear(year: number): string {
  const suffix = year % 100 >= 11 && year % 100 <= 13
    ? "th"
    : year % 10 === 1
      ? "st"
      : year % 10 === 2
        ? "nd"
        : year % 10 === 3
          ? "rd"
          : "th";
  return `${year}${suffix} Year`;
}

export function PlacementAccessUnavailable({
  studyYear,
  verificationRequired,
}: {
  studyYear: number | null;
  verificationRequired: boolean;
}) {
  return (
    <main className={styles.message} id="main-content">
      <p className={styles.eyebrow}>Student access</p>
      <h1>Placement Access Currently Unavailable</h1>
      <p>
        CampusHire placement services are available to third-year and final-year students.
      </p>
      {studyYear !== null ? (
        <p>Current academic year: {ordinalStudyYear(studyYear)}</p>
      ) : (
        <p>Review your student profile details or contact your placement office.</p>
      )}
      {verificationRequired ? (
        <p>Your student PRN is awaiting verification by the institution placement office.</p>
      ) : null}
      <Link href="/profile">Review your profile</Link>
    </main>
  );
}

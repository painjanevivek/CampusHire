"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";

import { PageContainer, PageHeader } from "@/components/layout/page-layout";
import { RequestState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { apiPath, apiRequest } from "@/lib/api/client";
import type {
  PlatformApplicationEvidence,
  PlatformDriveApplicantPage,
  PlatformDriveGroup,
  PlatformDriveGroupPage,
  PlatformDriveInstitutionBreakdown,
  PlatformInstitutionPage,
  PlatformReportSummary,
} from "@/lib/api/generated/types.gen";
import styles from "./platform-reports.module.css";

type ReportSummary = PlatformReportSummary;
type InstitutionBreakdown = PlatformDriveInstitutionBreakdown;
type DriveGroup = PlatformDriveGroup;
type GroupPage = PlatformDriveGroupPage;
type InstitutionPage = PlatformInstitutionPage;
type ApplicantPage = PlatformDriveApplicantPage;
type Evidence = PlatformApplicationEvidence;

function useReportResource<T>(path: string | null) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    path: string | null; data: T | null; error: string; loading: boolean;
  }>({ path: null, data: null, error: "", loading: false });
  useEffect(() => {
    const controller = new AbortController();
    if (!path) return () => controller.abort();
    void apiRequest<T>(path, { signal: controller.signal, cache: "no-store" })
      .then((data) => { if (!controller.signal.aborted) setState({ path, data, error: "", loading: false }); })
      .catch(() => { if (!controller.signal.aborted) setState({
        path, data: null, error: "The recorded state could not be loaded. Try again.", loading: false,
      }); });
    return () => controller.abort();
  }, [path, revision]);
  return {
    data: state.path === path ? state.data : null,
    error: state.path === path ? state.error : "",
    loading: Boolean(path && (state.path !== path || state.loading)),
    refresh: () => setRevision((current) => current + 1),
  };
}

function groupParameters(group: DriveGroup, institutionId?: string, driveId?: string) {
  const params = new URLSearchParams({
    company_name: group.company_name,
    drive_title: group.drive_title,
    cycle_year: String(group.cycle_year),
  });
  if (institutionId) params.set("institution_id", institutionId);
  if (driveId) params.set("drive_id", driveId);
  return params;
}

function Snapshot({ title, values }: { title: string; values: Record<string, unknown> }) {
  const entries = Object.entries(values).filter(([, value]) => value !== null && value !== "");
  return <section className={styles.snapshot}>
    <h4>{title}</h4>
    {entries.length ? <dl>{entries.map(([key, value]) => <div key={key}>
      <dt>{key.replaceAll("_", " ")}</dt>
      <dd>{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
    </div>)}</dl> : <p>No submitted data recorded.</p>}
  </section>;
}

export function PlatformReports() {
  const summary = useReportResource<ReportSummary>("/platform/reports/summary");
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [directoryInstitutionId, setDirectoryInstitutionId] = useState("");
  const institutions = useReportResource<InstitutionPage>("/platform/institutions?page=1&page_size=100");
  const [groupPage, setGroupPage] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState<DriveGroup | null>(null);
  const [institutionId, setInstitutionId] = useState("");
  const [driveId, setDriveId] = useState("");
  const [applicantPage, setApplicantPage] = useState(1);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const groupsPath = useMemo(() => {
    const params = new URLSearchParams({
      active_only: String(activeOnly), page: String(groupPage), page_size: "20",
    });
    if (query) params.set("query", query);
    if (directoryInstitutionId) params.set("institution_id", directoryInstitutionId);
    return `/platform/reports/drive-groups?${params}`;
  }, [activeOnly, directoryInstitutionId, groupPage, query]);
  const groups = useReportResource<GroupPage>(groupsPath);
  const applicantsPath = selectedGroup
    ? `/platform/reports/drive-applicants?${groupParameters(selectedGroup, institutionId || undefined, driveId || undefined)}&page=${applicantPage}&page_size=50`
    : null;
  const applicants = useReportResource<ApplicantPage>(applicantsPath);
  const evidence = useReportResource<Evidence>(selectedApplicationId
    ? `/platform/reports/applications/${selectedApplicationId}` : null);

  function selectGroup(group: DriveGroup) {
    setSelectedGroup(group);
    setInstitutionId("");
    setDriveId("");
    setApplicantPage(1);
    setSelectedApplicationId("");
    setDownloadError("");
  }

  async function download(institution?: InstitutionBreakdown, specificDriveId?: string) {
    if (!selectedGroup) return;
    setDownloading(true);
    setDownloadError("");
    try {
      const params = groupParameters(selectedGroup, institution?.institution_id, specificDriveId);
      const response = await fetch(apiPath(`/platform/reports/drive-applicants.csv?${params}`), {
        credentials: "include", cache: "no-store", redirect: "error",
      });
      if (!response.ok) throw new Error(`Export unavailable (${response.status}).`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `campushire-applicants-${selectedGroup.cycle_year}${specificDriveId ? "-drive" : institution ? "-institution" : "-all"}.csv`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Export unavailable. Try again.");
    } finally {
      setDownloading(false);
    }
  }

  return <PageContainer context="admin" className={styles.page}>
    <PageHeader eyebrow="Cross-institution reporting" title="Placement reports"
      description="Explore current drives, see each college&apos;s applicants, and inspect submitted application records." />
    <div className={styles.metrics} aria-label="Platform totals">
      {[
        ["Institutions", summary.data?.institution_count],
        ["Students", summary.data?.student_count],
        ["Drives", summary.data?.drive_count],
        ["Applications", summary.data?.application_count],
      ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value?.toLocaleString() ?? "—"}</strong></div>)}
    </div>
    {summary.error ? <p role="alert">Platform totals could not be loaded. <Button type="button" variant="quiet" onClick={summary.refresh}>Retry</Button></p> : null}
    <section className={styles.panel} aria-labelledby="drives-heading">
      <div className={styles.panelHeader}>
        <div><p className={styles.eyebrow}>Drive directory</p><h2 id="drives-heading">Drives across colleges</h2>
          <p>Matching company and drive titles are grouped for reporting. Each institution keeps its own drive and applications.</p></div>
        <span className={styles.count}>{groups.data?.total ?? 0} groups</span>
      </div>
      <form className={styles.filters} onSubmit={(event) => { event.preventDefault(); setQuery(searchText.trim()); setGroupPage(1); setSelectedGroup(null); }}>
        <label><span>Company or drive</span><div className={styles.search}><Search aria-hidden="true" /><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search drives" /></div></label>
        <label><span>College</span><select value={directoryInstitutionId} onChange={(event) => { setDirectoryInstitutionId(event.target.value); setGroupPage(1); setSelectedGroup(null); }}><option value="">All colleges</option>{institutions.data?.items.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}</select></label>
        <label><span>Drive status</span><select value={activeOnly ? "active" : "all"} onChange={(event) => { setActiveOnly(event.target.value === "active"); setGroupPage(1); setSelectedGroup(null); }}><option value="active">Ongoing</option><option value="all">All drives</option></select></label>
        <Button type="submit">Search</Button>
      </form>
      {institutions.error ? <p role="alert" className={styles.filterError}>College options could not be loaded. <Button type="button" variant="quiet" onClick={institutions.refresh}>Retry</Button></p> : null}
      {groups.error ? <RequestState state="error" title="Drive reports unavailable" onRetry={groups.refresh}>{groups.error}</RequestState> : null}
      {groups.loading && !groups.data ? <RequestState state="loading" title="Loading drives">Reading institution drive records.</RequestState> : null}
      {groups.data && !groups.data.items.length ? <RequestState state="empty" title="No matching drives">Try another search or include all drives.</RequestState> : null}
      <div className={styles.groupList}>{groups.data?.items.map((group) => <button
        type="button" key={`${group.company_name}-${group.drive_title}-${group.cycle_year}`}
        className={styles.groupButton} aria-pressed={selectedGroup?.company_name === group.company_name && selectedGroup.drive_title === group.drive_title && selectedGroup.cycle_year === group.cycle_year}
        onClick={() => selectGroup(group)}>
        <span><strong>{group.company_name}</strong><small>{group.drive_title} · {group.cycle_year}</small></span>
        <span><strong>{group.institutions.length}</strong><small>colleges</small></span>
        <span><strong>{group.student_count}</strong><small>students</small></span>
        <span><strong>{group.application_count}</strong><small>applications</small></span>
      </button>)}</div>
      {groups.data && groups.data.total > groups.data.page_size ? <div className={styles.pagination}><Button type="button" variant="quiet" disabled={groupPage === 1} onClick={() => setGroupPage(groupPage - 1)}>Previous</Button><span>Page {groupPage} of {Math.ceil(groups.data.total / groups.data.page_size)}</span><Button type="button" variant="quiet" disabled={groupPage * groups.data.page_size >= groups.data.total} onClick={() => setGroupPage(groupPage + 1)}>Next</Button></div> : null}
    </section>
    {selectedGroup ? <div className={styles.detailColumns}>
    <section className={styles.panel} aria-labelledby="selected-drive-heading">
      <div className={styles.panelHeader}><div><p className={styles.eyebrow}>Selected drive</p><h2 id="selected-drive-heading">{selectedGroup.company_name} · {selectedGroup.drive_title}</h2><p>{selectedGroup.student_count} distinct students across {selectedGroup.institutions.length} {selectedGroup.institutions.length === 1 ? "college" : "colleges"}.</p></div>
        <Button type="button" variant="quiet" disabled={downloading} onClick={() => void download()}><Download aria-hidden="true" /> Download all applicants</Button></div>
      <div className={styles.institutionList} aria-label="Applicants by institution">{selectedGroup.institutions.map((institution) => <div key={institution.institution_id}>
        <button type="button" aria-label={`Open ${institution.institution_name} applicants`} aria-pressed={institutionId === institution.institution_id} onClick={() => { setInstitutionId(institution.institution_id); setDriveId(institution.drive_ids.length === 1 ? institution.drive_ids[0] : ""); setApplicantPage(1); setSelectedApplicationId(""); }}><span className={styles.institutionName}><strong>{institution.institution_name}</strong><small>{institution.drives.length === 1 ? "Deadline" : "Next deadline"} {new Date(Math.min(...institution.drives.map((drive) => new Date(drive.deadline_at).getTime()))).toLocaleDateString()}</small></span><span>{institution.student_count} students · {institution.application_count} applications</span><span className={styles.chartTrack} aria-hidden="true"><span style={{ width: `${institution.application_count / Math.max(1, ...selectedGroup.institutions.map((item) => item.application_count)) * 100}%` }} /></span></button>
        <Button type="button" variant="quiet" disabled={downloading} onClick={() => void download(institution)} aria-label={`Download ${institution.institution_name} applicants`}><Download aria-hidden="true" /> CSV</Button>
      </div>)}</div>
      {downloadError ? <p role="alert">{downloadError}</p> : null}
      <div className={styles.applicantHeading}><div><h3>{institutionId ? selectedGroup.institutions.find((item) => item.institution_id === institutionId)?.institution_name : "All applicants"}</h3><p>Submitted applications for this drive. A student may have applied to multiple roles.</p></div>{institutionId ? <Button type="button" variant="quiet" onClick={() => { setInstitutionId(""); setDriveId(""); setApplicantPage(1); setSelectedApplicationId(""); }}>Show all colleges</Button> : null}</div>
      {institutionId && (selectedGroup.institutions.find((item) => item.institution_id === institutionId)?.drives.length ?? 0) > 1 ? <div className={styles.driveFilter}>
        <label>Institution drive <select value={driveId} onChange={(event) => { setDriveId(event.target.value); setApplicantPage(1); setSelectedApplicationId(""); }}><option value="">All matching drives</option>{selectedGroup.institutions.find((item) => item.institution_id === institutionId)?.drives.map((drive, index) => <option key={drive.id} value={drive.id}>Drive {index + 1} · opened {new Date(drive.opens_at).toLocaleDateString()}</option>)}</select></label>
        {driveId ? <Button type="button" variant="quiet" disabled={downloading} onClick={() => void download(selectedGroup.institutions.find((item) => item.institution_id === institutionId), driveId)}><Download aria-hidden="true" /> Download this drive</Button> : null}
      </div> : null}
      {applicants.error ? <RequestState state="error" title="Applicant list unavailable" onRetry={applicants.refresh}>{applicants.error}</RequestState> : null}
      {applicants.loading && !applicants.data ? <RequestState state="loading" title="Loading applicants">Reading submitted records.</RequestState> : null}
      {applicants.data && !applicants.data.items.length ? <p className={styles.empty}>No applications for this selection.</p> : null}
      <div className={styles.applicantList}>{applicants.data?.items.map((item) => <button type="button" key={item.application_id} onClick={() => setSelectedApplicationId(item.application_id)} aria-pressed={selectedApplicationId === item.application_id}>
        <span><strong>{item.student_name}</strong><small>{item.institution_name} · {item.role_title}</small></span>
        <span><strong>{item.prn ?? "PRN unavailable"}</strong><small>{item.prn_verified ? "Verified PRN" : "PRN not verified"}</small></span>
        <span><strong>{item.application_status.replaceAll("_", " ")}</strong><small>{new Date(item.submitted_at).toLocaleDateString()}</small></span>
      </button>)}</div>
      {applicants.data && applicants.data.total > applicants.data.page_size ? <div className={styles.pagination}><Button type="button" variant="quiet" disabled={applicantPage === 1} onClick={() => setApplicantPage(applicantPage - 1)}>Previous</Button><span>Page {applicantPage} of {Math.ceil(applicants.data.total / applicants.data.page_size)}</span><Button type="button" variant="quiet" disabled={applicantPage * applicants.data.page_size >= applicants.data.total} onClick={() => setApplicantPage(applicantPage + 1)}>Next</Button></div> : null}
    </section>
    {selectedApplicationId ? <section className={styles.panel} aria-labelledby="evidence-heading">
      <div className={styles.panelHeader}><div><p className={styles.eyebrow}>Application record</p><h2 id="evidence-heading">{evidence.data?.applicant.student_name ?? "Submitted evidence"}</h2><p>Submission snapshots are retained with the application. Restricted disclosure answers remain with the institution&apos;s authorized officers.</p></div><Button type="button" variant="quiet" onClick={() => setSelectedApplicationId("")}>Close</Button></div>
      {evidence.error ? <RequestState state="error" title="Record unavailable" onRetry={evidence.refresh}>{evidence.error}</RequestState> : null}
      {evidence.loading && !evidence.data ? <RequestState state="loading" title="Loading application record">Reading submitted evidence.</RequestState> : null}
      {evidence.data ? <div className={styles.snapshots}>
        <Snapshot title="Profile at submission" values={evidence.data.profile_snapshot} />
        <Snapshot title="Resume selection" values={evidence.data.resume_snapshot} />
        <Snapshot title="Student facts" values={evidence.data.facts_snapshot} />
        <Snapshot title="Eligibility result" values={evidence.data.eligibility_snapshot} />
        <Snapshot title="Application form" values={evidence.data.application_form_snapshot} />
        <Snapshot title="Acknowledgment" values={evidence.data.acknowledgment_snapshot} />
      </div> : null}
    </section> : null}
    </div> : null}
  </PageContainer>;
}

"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  CircleAlert,
  FileCheck2,
  FileSearch,
  Pencil,
  Plus,
  RefreshCcw,
  Send,
  Trash2,
} from "lucide-react";

import { Alert, Badge, EmptyState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form-controls";
import { apiRequest, csrfRequest } from "@/lib/api/client";
import type {
  Company,
  Drive,
  Eligibility,
  ExtractionProposal,
  PlacementRole,
  PolicyDocument,
  RuleDefinition,
  RuleSet,
} from "./types";
import styles from "./admin-drives.module.css";

const initialRule: RuleDefinition = {
  field: "degree",
  operator: "eq",
  value: "B.Tech",
  label: "Program eligibility",
};

function toDateTimeLocal(value: string): string {
  const date = new Date(value);
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
}

export function AdminDrives() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [roles, setRoles] = useState<PlacementRole[]>([]);
  const [ruleSets, setRuleSets] = useState<RuleSet[]>([]);
  const [extractions, setExtractions] = useState<ExtractionProposal[]>([]);
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [policyLoadUnavailable, setPolicyLoadUnavailable] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [rules, setRules] = useState<RuleDefinition[]>([initialRule]);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);
  const [panel, setPanel] = useState<
    "none" | "drive" | "edit-drive" | "role" | "rules" | "extract"
  >("none");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [eligibilityPreview, setEligibilityPreview] = useState<Eligibility | null>(null);

  const loadRoot = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    setPolicyLoadUnavailable(false);
    try {
      const [companyItems, driveItems, policyItems] = await Promise.all([
        apiRequest<Company[]>("/admin/recruitment/companies", {
          cache: "no-store",
        }),
        apiRequest<Drive[]>("/admin/recruitment/drives", { cache: "no-store" }),
        apiRequest<PolicyDocument[]>("/admin/intelligence/policies", {
          cache: "no-store",
        }).catch(() => {
          setPolicyLoadUnavailable(true);
          return [];
        }),
      ]);
      setCompanies(companyItems);
      setDrives(driveItems);
      setPolicies(policyItems.filter((policy) => policy.status === "approved"));
      setSelectedDrive((current) => current || driveItems[0]?.id || "");
    } catch {
      setError(
        "Placement drives could not be loaded. Nothing was changed.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoles = useCallback(async (driveId: string) => {
    await Promise.resolve();
    if (!driveId) {
      setRoles([]);
      return;
    }
    try {
      const items = await apiRequest<PlacementRole[]>(
        `/admin/recruitment/drives/${driveId}/roles`,
        { cache: "no-store" },
      );
      setRoles(items);
      setSelectedRole((current) =>
        items.some((item) => item.id === current)
          ? current
          : items[0]?.id || "",
      );
    } catch {
      setError("Roles for the selected drive could not be loaded.");
    }
  }, []);

  const loadRules = useCallback(async (roleId: string) => {
    await Promise.resolve();
    if (!roleId) {
      setRuleSets([]);
      return;
    }
    try {
      const [sets, proposals] = await Promise.all([
        apiRequest<RuleSet[]>(`/admin/recruitment/roles/${roleId}/rule-sets`, {
          cache: "no-store",
        }),
        apiRequest<ExtractionProposal[]>(
          `/admin/intelligence/roles/${roleId}/extractions`,
          { cache: "no-store" },
        ),
      ]);
      setRuleSets(sets);
      setExtractions(proposals);
    } catch {
      setError(
        "Eligibility versions for the selected role could not be loaded.",
      );
    }
  }, []);

  useEffect(() => {
    const pending = window.setTimeout(() => void loadRoot(), 0);
    return () => window.clearTimeout(pending);
  }, [loadRoot]);
  useEffect(() => {
    const pending = window.setTimeout(() => void loadRoles(selectedDrive), 0);
    return () => window.clearTimeout(pending);
  }, [loadRoles, selectedDrive]);
  useEffect(() => {
    const pending = window.setTimeout(() => void loadRules(selectedRole), 0);
    return () => window.clearTimeout(pending);
  }, [loadRules, selectedRole]);

  async function saveDrive(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const data = new FormData(event.currentTarget);
    const editingDrive =
      panel === "edit-drive"
        ? drives.find((drive) => drive.id === selectedDrive)
        : undefined;
    try {
      const saved = await csrfRequest<Drive>(
        editingDrive
          ? `/admin/recruitment/drives/${editingDrive.id}`
          : "/admin/recruitment/drives",
        {
          method: editingDrive ? "PATCH" : "POST",
          body: JSON.stringify({
            company_id: data.get("company_id"),
            title: data.get("title"),
            description: data.get("description"),
            location: data.get("location"),
            work_mode: data.get("work_mode"),
            opens_at: new Date(String(data.get("opens_at"))).toISOString(),
            deadline_at: new Date(String(data.get("deadline_at"))).toISOString(),
          }),
        },
      );
      setDrives((current) =>
        editingDrive
          ? current.map((drive) => (drive.id === saved.id ? saved : drive))
          : [saved, ...current],
      );
      setSelectedDrive(saved.id);
      setPanel("none");
      setNotice(
        editingDrive
          ? "Draft drive updated."
          : "Draft drive created. Add a role and reviewed eligibility rules before publishing.",
      );
    } catch {
      setError(
        editingDrive
          ? "The draft was not updated. Verify its company, application window, and required details."
          : "The drive was not created. Verify its company, application window, and required details.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteDraft(drive: Drive) {
    if (busy || drive.status !== "draft") return;
    if (
      !window.confirm(
        `Delete the draft “${drive.title}”? This also removes its draft roles and eligibility setup. This cannot be undone.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await csrfRequest<void>(`/admin/recruitment/drives/${drive.id}`, {
        method: "DELETE",
      });
      const remaining = drives.filter((item) => item.id !== drive.id);
      setDrives(remaining);
      setSelectedDrive(remaining[0]?.id ?? "");
      setSelectedRole("");
      setRoles([]);
      setRuleSets([]);
      setExtractions([]);
      setPanel("none");
      setNotice("Draft drive deleted.");
    } catch {
      setError(
        "The draft was not deleted. Refresh the drive and confirm it has not been published.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function createRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDrive) return;
    setBusy(true);
    setError("");
    setNotice("");
    const data = new FormData(event.currentTarget);
    try {
      const created = await csrfRequest<PlacementRole>(
        `/admin/recruitment/drives/${selectedDrive}/roles`,
        {
          method: "POST",
          body: JSON.stringify({
            title: data.get("title"),
            description: data.get("description"),
            employment_type: data.get("employment_type"),
            location: data.get("location"),
            work_mode: data.get("work_mode"),
            salary_display: data.get("salary_display") || null,
            skills: String(data.get("skills") || "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            requirements: String(data.get("requirements") || "")
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean),
          }),
        },
      );
      setRoles((current) => [...current, created]);
      setSelectedRole(created.id);
      setPanel("none");
      setNotice(
        "Draft role created. Publish a rule version next.",
      );
      void loadRoot();
    } catch {
      setError(
        "The role was not created. Review required text, lists, and the selected draft drive.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function createRules(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRole) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const normalized = rules.map((rule) => ({
        ...rule,
        value: ["gte", "lte"].includes(rule.operator)
          ? Number(rule.value)
          : rule.operator === "present"
            ? null
            : rule.value,
      }));
      const created = await csrfRequest<RuleSet>(
        `/admin/recruitment/roles/${selectedRole}/rule-sets`,
        {
          method: "POST",
          body: JSON.stringify({
            rules: normalized,
            policy_ids: selectedPolicyIds,
          }),
        },
      );
      setRuleSets((current) => [created, ...current]);
      setSelectedPolicyIds([]);
      setPanel("none");
      setNotice(
        `Draft rule version ${created.version} created. Preview the rows, then publish it.`,
      );
    } catch {
      setError(
        "The rule version was not created. Every rule needs a supported field, operator, value, and clear label.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function createExtraction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRole) return;
    setBusy(true);
    setError("");
    setNotice("");
    const sourceText = String(
      new FormData(event.currentTarget).get("source_text") || "",
    );
    try {
      const created = await csrfRequest<ExtractionProposal>(
        `/admin/intelligence/roles/${selectedRole}/extractions`,
        { method: "POST", body: JSON.stringify({ source_text: sourceText }) },
      );
      setExtractions((current) => [created, ...current]);
      setPanel("none");
      setNotice(
        "A draft of the role details is ready. It cannot change the role until an administrator reviews it.",
      );
    } catch {
      setError(
        "The role brief could not be staged. Use a draft role and provide the complete source text.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function reviewExtraction(
    proposal: ExtractionProposal,
    action: "approve" | "reject",
  ) {
    const reason = window
      .prompt(`Reason required to ${action} this extraction proposal`)
      ?.trim();
    if (!reason) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await csrfRequest(
        `/admin/intelligence/extractions/${proposal.id}/review`,
        { method: "POST", body: JSON.stringify({ action, reason }) },
      );
      setNotice(
        action === "approve"
          ? "Reviewed requirements were applied to the draft role."
          : "The proposal was rejected without changing the role.",
      );
      await loadRoles(selectedDrive);
      await loadRules(selectedRole);
    } catch {
      setError(
        "The proposal decision was rejected. The role may already be published or the proposal finalized.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function postAction(path: string, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await csrfRequest(path, { method: "POST" });
      setNotice(success);
      await loadRoot();
      await loadRoles(selectedDrive);
      await loadRules(selectedRole);
    } catch {
      setError(
        "This status change was not allowed. Finish the required earlier steps or refresh the page.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function previewEligibility(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRole) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      setEligibilityPreview(await csrfRequest<Eligibility>(
        `/admin/recruitment/roles/${selectedRole}/eligibility-preview`,
        {
          method: "POST",
          body: JSON.stringify({
            degree: form.get("degree") || null,
            cgpa: form.get("cgpa") ? Number(form.get("cgpa")) : null,
            active_backlogs: form.get("active_backlogs") ? Number(form.get("active_backlogs")) : null,
          }),
        },
      ));
    } catch {
      setError("The rule check could not run. Review the draft rules and student details.");
    } finally {
      setBusy(false);
    }
  }

  const activeDrive = drives.find((item) => item.id === selectedDrive);
  const editingDrive = panel === "edit-drive" ? activeDrive : undefined;
  const activeRole = roles.find((item) => item.id === selectedRole);
  const publishedRules = ruleSets.find((item) => item.status === "published");

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p>Placement operations</p>
          <h1>Drives and eligibility</h1>
          <span>
            Draft deliberately, publish reviewed versions, and preserve every
            decision basis.
          </span>
        </div>
        <button
          type="button"
          className={styles.primary}
          disabled={!companies.length}
          onClick={() => setPanel("drive")}
        >
          <Plus aria-hidden="true" />
          Create drive
        </button>
      </header>
      {error && (
        <Alert tone="error">
          {error}{" "}
          <button type="button" onClick={() => void loadRoot()}>
            Retry
          </button>
        </Alert>
      )}
      {notice && <Alert tone="success">{notice}</Alert>}
      {!companies.length && !loading ? (
        <Alert tone="warning">
          Create a company record before opening a placement drive.
        </Alert>
      ) : null}

      {panel === "drive" || editingDrive ? (
        <form
          key={editingDrive?.id ?? "new-drive"}
          className={styles.editor}
          onSubmit={saveDrive}
        >
          <div className={styles.editorHeading}>
            <p>{editingDrive ? "Draft settings" : "Step 1"}</p>
            <h2>{editingDrive ? "Edit draft drive" : "New placement drive"}</h2>
            {editingDrive ? (
              <span>Changes apply only to this unpublished draft.</span>
            ) : null}
          </div>
          <Select
            id="drive-company"
            name="company_id"
            label="Company"
            defaultValue={editingDrive?.company_id}
            required
          >
            {companies.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Input
            id="drive-title"
            name="title"
            label="Drive title"
            defaultValue={editingDrive?.title}
            required
            minLength={3}
          />
          <Input
            id="drive-location"
            name="location"
            label="Location"
            defaultValue={editingDrive?.location}
            required
          />
          <Select
            id="drive-mode"
            name="work_mode"
            label="Work mode"
            defaultValue={editingDrive?.work_mode ?? "on-site"}
          >
            <option value="on-site">On-site</option>
            <option value="hybrid">Hybrid</option>
            <option value="remote">Remote</option>
          </Select>
          <Input
            id="drive-opens"
            name="opens_at"
            label="Opens at"
            type="datetime-local"
            defaultValue={
              editingDrive ? toDateTimeLocal(editingDrive.opens_at) : undefined
            }
            required
          />
          <Input
            id="drive-deadline"
            name="deadline_at"
            label="Deadline"
            type="datetime-local"
            defaultValue={
              editingDrive ? toDateTimeLocal(editingDrive.deadline_at) : undefined
            }
            required
          />
          <label className={styles.wide}>
            <span>Description</span>
            <textarea
              name="description"
              defaultValue={editingDrive?.description}
              required
              minLength={10}
              rows={3}
            />
          </label>
          <div className={styles.actions}>
            <button type="button" onClick={() => setPanel("none")}>
              Cancel
            </button>
            <button className={styles.primary} type="submit" disabled={busy}>
              {busy
                ? editingDrive
                  ? "Saving…"
                  : "Creating…"
                : editingDrive
                  ? "Save changes"
                  : "Create draft"}
            </button>
          </div>
        </form>
      ) : null}

      <div className={styles.workspace} aria-busy={loading}>
        <section className={styles.rail} aria-labelledby="drive-list">
          <div className={styles.sectionHeader}>
            <h2 id="drive-list">Drives</h2>
            <button
              type="button"
              onClick={() => void loadRoot()}
              aria-label="Refresh drives"
            >
              <RefreshCcw aria-hidden="true" />
            </button>
          </div>
          {loading ? <p className={styles.muted}>Loading drives…</p> : null}
          {!loading && !drives.length ? (
            <EmptyState title="No drives yet">
              <span>Create the first draft after adding a company.</span>
            </EmptyState>
          ) : null}
          <div className={styles.rows}>
            {drives.map((drive) => (
              <button
                key={drive.id}
                type="button"
                className={drive.id === selectedDrive ? styles.selected : ""}
                onClick={() => setSelectedDrive(drive.id)}
              >
                <span>
                  <strong>{drive.title}</strong>
                  <small>
                    {drive.company_name} · {drive.role_count} roles
                  </small>
                </span>
                <Badge
                  tone={
                    drive.status === "published"
                      ? "success"
                      : drive.status === "closed"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {drive.status}
                </Badge>
                <ChevronRight aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <section
          className={styles.detail}
          aria-label="Selected drive operations"
        >
          {!activeDrive ? (
            <EmptyState title="Select a drive">
              <span>
                Its roles, rule versions, and publication controls will appear
                here.
              </span>
            </EmptyState>
          ) : (
            <>
              <div className={styles.driveSummary}>
                <div>
                  <p>{activeDrive.company_name}</p>
                  <h2>{activeDrive.title}</h2>
                  <span>
                    {activeDrive.location} · {activeDrive.work_mode}
                  </span>
                </div>
                <div>
                  <Badge
                    tone={
                      activeDrive.status === "published" ? "success" : "neutral"
                    }
                  >
                    {activeDrive.status}
                  </Badge>
                  <span>
                    <CalendarClock aria-hidden="true" />
                    {new Date(activeDrive.deadline_at).toLocaleString()}
                  </span>
                </div>
              </div>
              {activeDrive.status === "draft" ? (
                <Alert tone="warning">
                  <CircleAlert aria-hidden="true" />
                  {roles.length === 0
                    ? "Not visible to students. Add a role, publish an eligibility rule version, publish the role, then publish this drive."
                    : roles.some((item) => item.status === "published")
                      ? "Ready for student visibility. Publish the drive; it will appear only during its active application window."
                      : "Not visible to students. Publish an eligibility rule version and the role before publishing this drive."}
                </Alert>
              ) : null}
              <div className={styles.commandBar}>
                {activeDrive.status === "draft" ? (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setPanel("edit-drive")}
                    >
                      <Pencil aria-hidden="true" />
                      Edit draft
                    </button>
                    <button
                      type="button"
                      className={styles.danger}
                      disabled={busy}
                      onClick={() => void deleteDraft(activeDrive)}
                    >
                      <Trash2 aria-hidden="true" />
                      Delete draft
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  disabled={activeDrive.status !== "draft"}
                  onClick={() => setPanel("role")}
                >
                  <Plus aria-hidden="true" />
                  Add role
                </button>
                <button
                  type="button"
                  disabled={
                    busy ||
                    activeDrive.status !== "draft" ||
                    !roles.some((item) => item.status === "published")
                  }
                  onClick={() =>
                    void postAction(
                      `/admin/recruitment/drives/${activeDrive.id}/actions/publish`,
                      "Drive published. Students can now discover roles inside its active window.",
                    )
                  }
                >
                  <Send aria-hidden="true" />
                  Publish drive
                </button>
                <button
                  type="button"
                  disabled={busy || activeDrive.status !== "published"}
                  onClick={() =>
                    void postAction(
                      `/admin/recruitment/drives/${activeDrive.id}/actions/close`,
                      "Drive closed. New applications are no longer accepted.",
                    )
                  }
                >
                  Close drive
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void postAction(
                    `/admin/recruitment/drives/${activeDrive.id}/duplicate`,
                    "Drive duplicated as a draft with draft role and rule copies.",
                  )}
                >
                  Duplicate draft
                </button>
              </div>

              {panel === "role" ? (
                <form className={styles.editor} onSubmit={createRole}>
                  <div className={styles.editorHeading}>
                    <p>Step 2</p>
                    <h2>Add a role</h2>
                  </div>
                  <Input
                    id="role-title"
                    name="title"
                    label="Role title"
                    required
                  />
                  <Input
                    id="role-location"
                    name="location"
                    label="Location"
                    required
                    defaultValue={activeDrive.location}
                  />
                  <Select
                    id="role-employment"
                    name="employment_type"
                    label="Employment"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract</option>
                  </Select>
                  <Select
                    id="role-mode"
                    name="work_mode"
                    label="Work mode"
                    defaultValue={activeDrive.work_mode}
                  >
                    <option value="on-site">On-site</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="remote">Remote</option>
                  </Select>
                  <Input
                    id="role-salary"
                    name="salary_display"
                    label="Compensation (optional)"
                  />
                  <Input
                    id="role-skills"
                    name="skills"
                    label="Skills"
                    hint="Comma-separated"
                  />
                  <label className={styles.wide}>
                    <span>Description</span>
                    <textarea
                      name="description"
                      required
                      minLength={10}
                      rows={3}
                    />
                  </label>
                  <label className={styles.wide}>
                    <span>Requirements</span>
                    <textarea
                      name="requirements"
                      rows={3}
                      placeholder="One requirement per line"
                    />
                  </label>
                  <div className={styles.actions}>
                    <button type="button" onClick={() => setPanel("none")}>
                      Cancel
                    </button>
                    <button
                      className={styles.primary}
                      type="submit"
                      disabled={busy}
                    >
                      Create draft role
                    </button>
                  </div>
                </form>
              ) : null}

              <div className={styles.roleGrid}>
                <div className={styles.roleList}>
                  <div className={styles.sectionHeader}>
                    <h3>Roles</h3>
                  </div>
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      className={
                        role.id === selectedRole ? styles.selected : ""
                      }
                      onClick={() => setSelectedRole(role.id)}
                    >
                      <span>
                        <strong>{role.title}</strong>
                        <small>
                          {role.employment_type} · {role.work_mode}
                        </small>
                      </span>
                      <Badge
                        tone={
                          role.status === "published" ? "success" : "neutral"
                        }
                      >
                        {role.status}
                      </Badge>
                    </button>
                  ))}
                </div>
                <div className={styles.rulesPanel}>
                  {activeRole ? (
                    <>
                      <div className={styles.rulesTitle}>
                        <div>
                          <p>Selected role</p>
                          <h3>{activeRole.title}</h3>
                        </div>
                        <Badge tone={publishedRules ? "success" : "warning"}>
                          {publishedRules
                            ? `Rules v${publishedRules.version}`
                            : "Rules required"}
                        </Badge>
                      </div>
                      <div className={styles.ruleActions}>
                        <button
                          type="button"
                          disabled={activeRole.status !== "draft"}
                          onClick={() => setPanel("extract")}
                        >
                          <FileSearch aria-hidden="true" />
                          Review role brief
                        </button>
                        <button
                          type="button"
                          disabled={activeRole.status !== "draft"}
                          onClick={() => setPanel("rules")}
                        >
                          <Plus aria-hidden="true" />
                          New rule version
                        </button>
                        <button
                          type="button"
                          disabled={
                            busy ||
                            activeRole.status !== "draft" ||
                            !publishedRules
                          }
                          onClick={() =>
                            void postAction(
                              `/admin/recruitment/roles/${activeRole.id}/publish`,
                              "Role published and ready for its drive publication.",
                            )
                          }
                        >
                          <BadgeCheck aria-hidden="true" />
                          Publish role
                        </button>
                      </div>
                      <details className={styles.rulePreview}>
                        <summary>Preview eligibility with synthetic facts</summary>
                        <form onSubmit={previewEligibility}>
                          <Input id="preview-degree" name="degree" label="Degree" defaultValue="B.Tech" />
                          <Input id="preview-cgpa" name="cgpa" label="CGPA" type="number" min="0" max="10" step="0.1" />
                          <Input id="preview-backlogs" name="active_backlogs" label="Active backlogs" type="number" min="0" max="100" />
                          <button type="submit" disabled={busy}>Test these rules</button>
                        </form>
                        {eligibilityPreview ? <div role="status" className={styles.previewResult}><Badge tone={eligibilityPreview.status === "eligible" ? "success" : "warning"}>{eligibilityPreview.status.replaceAll("_", " ")}</Badge><span>Rule version {eligibilityPreview.rule_version ?? "unavailable"}</span>{eligibilityPreview.missing_evidence.length ? <p>Manual review required for: {eligibilityPreview.missing_evidence.join(", ")}.</p> : null}</div> : null}
                      </details>
                      {extractions.map((proposal) => (
                        <article
                          key={proposal.id}
                          className={styles.ruleVersion}
                        >
                          <header>
                            <strong>
                              Role extraction · {proposal.prompt_version}
                            </strong>
                            <Badge
                              tone={
                                proposal.status === "approved"
                                  ? "success"
                                  : proposal.status === "rejected"
                                    ? "warning"
                                    : "neutral"
                              }
                            >
                              {proposal.status}
                            </Badge>
                            {proposal.status === "draft" ? (
                              <span className={styles.inlineActions}>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    void reviewExtraction(proposal, "reject")
                                  }
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    void reviewExtraction(proposal, "approve")
                                  }
                                >
                                  Approve
                                </button>
                              </span>
                            ) : null}
                          </header>
                          <ul>
                            {proposal.proposed_requirements.map(
                              (requirement) => (
                                <li key={requirement}>
                                  <FileSearch aria-hidden="true" />
                                  <span>
                                    <strong>{requirement}</strong>
                                    <small>
                                      Proposed · human review required
                                    </small>
                                  </span>
                                </li>
                              ),
                            )}
                          </ul>
                        </article>
                      ))}
                      {ruleSets.map((set) => (
                        <article key={set.id} className={styles.ruleVersion}>
                          <header>
                            <strong>Version {set.version}</strong>
                            <Badge
                              tone={
                                set.status === "published"
                                  ? "success"
                                  : "neutral"
                              }
                            >
                              {set.status}
                            </Badge>
                            {set.status === "draft" ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void postAction(
                                    `/admin/recruitment/roles/${activeRole.id}/rule-sets/${set.id}/publish`,
                                    `Eligibility version ${set.version} published. Previous versions stay locked.`,
                                  )
                                }
                              >
                                Publish
                              </button>
                            ) : null}
                          </header>
                          <ul>
                            {set.rules.map((rule, index) => (
                              <li key={`${rule.field}-${index}`}>
                                <FileCheck2 aria-hidden="true" />
                                <span>
                                  <strong>{rule.label}</strong>
                                  <small>
                                    {rule.field} {rule.operator}{" "}
                                    {String(rule.value ?? "present")}
                                  </small>
                                </span>
                              </li>
                            ))}
                          </ul>
                          {set.policy_references?.length ? (
                            <p className={styles.policyReferences}>
                              Policy evidence: {set.policy_references.map((policy) =>
                                `${policy.title} v${policy.version}`).join(", ")}
                            </p>
                          ) : null}
                        </article>
                      ))}
                    </>
                  ) : (
                    <EmptyState title="Select a role">
                      <span>
                        Review or create its eligibility rules.
                      </span>
                    </EmptyState>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {panel === "extract" && activeRole ? (
        <form className={styles.ruleEditor} onSubmit={createExtraction}>
          <div className={styles.editorHeading}>
            <p>Reviewed AI boundary</p>
            <h2>Stage the source brief for {activeRole.title}</h2>
            <span>
              CampusHire suggests organized requirements from this text. Nothing
              changes until a human approves the proposal.
            </span>
          </div>
          <label className={styles.wide}>
            <span>Official role brief</span>
            <textarea
              name="source_text"
              rows={8}
              required
              minLength={20}
              placeholder="Paste the reviewed role description or policy excerpt"
            />
          </label>
          <Alert tone="warning">
            <CircleAlert aria-hidden="true" /> Remove personal data before
            submission. Unreviewed output cannot publish or affect eligibility.
          </Alert>
          <div className={styles.actions}>
            <button type="button" onClick={() => setPanel("none")}>
              Cancel
            </button>
            <button className={styles.primary} type="submit" disabled={busy}>
              {busy ? "Staging…" : "Create review proposal"}
            </button>
          </div>
        </form>
      ) : null}

      {panel === "rules" && activeRole ? (
        <form className={styles.ruleEditor} onSubmit={createRules}>
          <div className={styles.editorHeading}>
            <p>Step 3</p>
            <h2>Eligibility rule version for {activeRole.title}</h2>
            <span>Missing facts automatically route to manual review.</span>
          </div>
          {rules.map((rule, index) => (
            <div className={styles.ruleRow} key={index}>
              <label>
                Label
                <input
                  value={rule.label}
                  onChange={(event) =>
                    setRules((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, label: event.target.value }
                          : item,
                      ),
                    )
                  }
                  required
                />
              </label>
              <label>
                Fact
                <select
                  value={rule.field}
                  onChange={(event) =>
                    setRules((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, field: event.target.value }
                          : item,
                      ),
                    )
                  }
                >
                  <option value="degree">Degree</option>
                  <option value="branch">Branch</option>
                  <option value="department">Department</option>
                  <option value="graduation_year">Graduation year</option>
                  <option value="cgpa">CGPA</option>
                  <option value="active_backlogs">Active backlogs</option>
                  <option value="github">GitHub</option>
                  <option value="portfolio">Portfolio</option>
                  <option value="resume">Reviewed resume</option>
                </select>
              </label>
              <label>
                Operator
                <select
                  value={rule.operator}
                  onChange={(event) =>
                    setRules((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, operator: event.target.value }
                          : item,
                      ),
                    )
                  }
                >
                  <option value="eq">Equals</option>
                  <option value="gte">At least</option>
                  <option value="lte">At most</option>
                  <option value="present">Present</option>
                </select>
              </label>
              <label>
                Value
                <input
                  value={String(rule.value ?? "")}
                  disabled={rule.operator === "present"}
                  onChange={(event) =>
                    setRules((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, value: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </label>
              <button
                type="button"
                disabled={rules.length === 1}
                onClick={() =>
                  setRules((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
                aria-label={`Remove ${rule.label}`}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            className={styles.addRule}
            type="button"
            onClick={() =>
              setRules((current) => [
                ...current,
                { ...initialRule, label: "New requirement" },
              ])
            }
          >
            <Plus aria-hidden="true" />
            Add rule
          </button>
          <fieldset className={styles.policyEvidence}>
            <legend>Approved policy evidence</legend>
            <p>
              Attach the exact approved versions used to prepare these rules.
              The references are locked when this rule version is created.
            </p>
            {policyLoadUnavailable ? (
              <Alert tone="warning">
                Approved policy evidence could not be verified. Refresh before
                creating a rule version that depends on policy evidence.
              </Alert>
            ) : policies.length ? (
              policies.map((policy) => (
                <label key={policy.id}>
                  <input
                    type="checkbox"
                    checked={selectedPolicyIds.includes(policy.id)}
                    onChange={(event) => setSelectedPolicyIds((current) =>
                      event.target.checked
                        ? [...current, policy.id]
                        : current.filter((id) => id !== policy.id))}
                  />
                  <span>
                    <strong>{policy.title} · version {policy.version}</strong>
                    <small>{policy.source_reference}</small>
                  </span>
                </label>
              ))
            ) : (
              <Alert tone="warning">
                No approved policy version is available. Publish reviewed policy
                evidence before attaching it to this rule version.
              </Alert>
            )}
          </fieldset>
          <Alert tone="warning">
            <CircleAlert aria-hidden="true" /> Preview carefully: once
            published, this version is locked and applications keep
            it.
          </Alert>
          <div className={styles.actions}>
            <button type="button" onClick={() => setPanel("none")}>
              Cancel
            </button>
            <button className={styles.primary} type="submit" disabled={busy}>
              Create draft version
            </button>
          </div>
        </form>
      ) : null}
    </main>
  );
}

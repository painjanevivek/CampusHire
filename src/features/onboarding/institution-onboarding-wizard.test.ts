import { describe, expect, it } from "vitest";

import { hydrateInstitutionOnboardingDraft } from "./institution-onboarding-wizard";

describe("institution onboarding server recovery", () => {
  it("restores nested academic, cycle, roster, policy, and invitation values", () => {
    const draft = hydrateInstitutionOnboardingDraft({
      institution_id: "institution-a",
      institution_name: "CampusHire Institute",
      institution_active: false,
      revision: 8,
      current_step: 7,
      completed_steps: [1, 2, 3, 4, 5, 6],
      step_data: {
        "1": { administrator: { administrator_name: "Asha Patil" } },
        "2": { institution: { official_name: "CampusHire Institute of Technology", domain: "campushire.edu" } },
        "3": { campuses: [{ name: "Main", programs: [{ name: "B.Tech", branches: ["CSE", "ECE"], graduating_batches: [2026, 2027] }] }] },
        "4": { placement_cycle: { name: "2026 placements", starts_on: "2026-07-01", ends_on: "2027-06-30", participating_cohorts: ["2026", "2027"] } },
        "5": { roster: { roster_import_id: "import-a", invitation_mode: "roster_only" } },
        "6": { policies: { eligibility_template_names: ["Engineering"], policy_names: ["Placement policy"], approval_roles: ["tnp_owner"] } },
        "7": { review: { invite_team_emails: ["team@campushire.edu"] } },
      },
      activated_at: null,
    });

    expect(draft).toMatchObject({
      administrator_name: "Asha Patil",
      official_name: "CampusHire Institute of Technology",
      domain: "campushire.edu",
      campus_name: "Main",
      program_name: "B.Tech",
      branches: "CSE, ECE",
      batches: "2026, 2027",
      cycle_name: "2026 placements",
      starts_on: "2026-07-01",
      ends_on: "2027-06-30",
      cohorts: "2026, 2027",
      roster_import_id: "import-a",
      invitation_mode: "roster_only",
      eligibility_templates: "Engineering",
      policy_names: "Placement policy",
      approval_roles: "tnp_owner",
      invite_team_emails: "team@campushire.edu",
    });
  });
});

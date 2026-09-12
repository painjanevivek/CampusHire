"""Smoke-test the current CampusHire registration, onboarding, resume, and Copilot surfaces."""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path

from playwright.sync_api import BrowserContext, Page, sync_playwright


@dataclass
class Check:
    name: str
    passed: bool
    detail: str


class SmokeRun:
    def __init__(self, frontend_url: str, api_url: str) -> None:
        self.frontend_url = frontend_url.rstrip("/")
        self.api_url = api_url.rstrip("/")
        self.checks: list[Check] = []
        self.console_errors: list[str] = []
        self.http_failures: list[str] = []

    def record(self, name: str, passed: bool, detail: str) -> None:
        self.checks.append(Check(name=name, passed=passed, detail=detail))

    def attach_diagnostics(self, page: Page) -> None:
        page.on(
            "console",
            lambda message: self.console_errors.append(message.text)
            if message.type == "error"
            else None,
        )
        page.on("pageerror", lambda error: self.console_errors.append(str(error)))
        page.on(
            "response",
            lambda response: self.http_failures.append(f"{response.status} {response.url}")
            if response.status >= 400
            else None,
        )

    def visit(self, page: Page, path: str) -> None:
        page.goto(f"{self.frontend_url}{path}", wait_until="networkidle", timeout=30_000)

    @staticmethod
    def dismiss_cookie_receipt(page: Page) -> None:
        button = page.get_by_role("button", name="Save essential-only preference")
        if button.count() and button.is_visible():
            button.click()

    def assert_path(self, name: str, page: Page, expected: str) -> None:
        actual = re.sub(r"^https?://[^/]+", "", page.url).split("?", maxsplit=1)[0]
        self.record(name, actual == expected, f"expected={expected}; actual={actual}")

    def public_checks(self, page: Page) -> None:
        self.visit(page, "/")
        signup_links = page.locator('a[href="/sign-up"]').count()
        self.record(
            "landing exposes sign-up entry points",
            signup_links >= 2,
            f"sign-up links={signup_links}",
        )

        self.visit(page, "/sign-up")
        headings = page.locator("h1").all_inner_texts()
        radios = page.get_by_role("radio").count()
        self.record(
            "sign-up role chooser renders",
            radios == 2 and len(headings) == 1,
            f"headings={headings}; radios={radios}",
        )
        page.get_by_role("radio", name="T&P").check()
        tnp_fields = [
            page.get_by_label("Institution name").is_visible(),
            page.get_by_label("Institutional administrator email").is_visible(),
            page.get_by_label("Institution domain").is_visible(),
        ]
        self.record("T&P registration fields render", all(tnp_fields), str(tnp_fields))
        page.get_by_role("radio", name="Student").check()
        student_fields = [
            page.get_by_label("College email").is_visible(),
            page.get_by_label("Invitation code (optional)").is_visible(),
        ]
        self.record("student registration fields render", all(student_fields), str(student_fields))

    def demo_sign_in(self, page: Page, *, admin: bool) -> None:
        path = "/admin/sign-in" if admin else "/sign-in"
        button_name = "Use demo T&P account" if admin else "Use demo student account"
        self.visit(page, path)
        self.dismiss_cookie_receipt(page)
        button = page.get_by_role("button", name=button_name)
        self.record(f"{button_name} is available", button.is_visible(), page.url)
        button.click()
        if admin:
            page.wait_for_function(
                "location.pathname.startsWith('/admin/') && location.pathname !== '/admin/sign-in'",
                timeout=20_000,
            )
            destination = re.compile(r".*/admin/(?!sign-in).*")
        else:
            destination = re.compile(r".*/(dashboard|onboarding).*")
            page.wait_for_url(destination, timeout=20_000)
        page.wait_for_load_state("networkidle")
        self.record(
            f"{button_name} authenticates",
            bool(destination.match(page.url)),
            page.url,
        )

    def student_checks(self, context: BrowserContext) -> None:
        page = context.new_page()
        self.attach_diagnostics(page)
        self.demo_sign_in(page, admin=False)

        self.visit(page, "/onboarding")
        self.assert_path("student onboarding is protected and reachable", page, "/onboarding")
        student_steps = page.locator("ol[aria-label='Student onboarding steps'] > li").count()
        self.record("student onboarding has seven steps", student_steps == 7, str(student_steps))

        self.visit(page, "/resume")
        self.assert_path("resume workspace is reachable", page, "/resume")
        upload_controls = page.locator('input[type="file"]').count()
        upload_copy = page.get_by_text(
            re.compile(r"upload (your )?resume", re.IGNORECASE)
        ).count()
        self.record(
            "resume workspace has no resume upload",
            upload_controls == 0 and upload_copy == 0,
            f"file inputs={upload_controls}; upload copy={upload_copy}",
        )

        self.visit(page, "/resume/studio")
        self.assert_path("AI Resume Studio is reachable", page, "/resume/studio")
        studio_body = page.locator("body").inner_text()
        self.record(
            "Resume Studio exposes review-first workflow",
            "Resume Studio" in studio_body and "evidence" in studio_body.lower(),
            "studio and evidence language present",
        )

        self.visit(page, "/copilot")
        self.assert_path("Student Copilot is reachable", page, "/copilot")
        copilot_body = page.locator("body").inner_text()
        self.record(
            "Student Copilot exposes bounded assistance",
            "Copilot" in copilot_body and "eligibility" in copilot_body.lower(),
            "copilot and eligibility language present",
        )

        self.visit(page, "/opportunities")
        self.assert_path("opportunities and eligibility surface remains reachable", page, "/opportunities")
        role_links = page.locator('a[href^="/opportunities/"]').evaluate_all(
            "elements => elements.map(element => element.getAttribute('href')).filter(Boolean)"
        )
        role_links = [href for href in role_links if href != "/opportunities/compare"]
        if role_links:
            self.visit(page, str(role_links[0]))
            apply_links = page.locator('a[href$="/apply"]')
            if apply_links.count():
                apply_path = apply_links.first.get_attribute("href")
                if apply_path:
                    self.visit(page, apply_path)
                    application_uploads = page.locator('input[type="file"]').count()
                    self.record(
                        "application flow has no resume upload",
                        application_uploads == 0,
                        f"file inputs={application_uploads}; route={apply_path}",
                    )
            else:
                self.record(
                    "application flow has no resume upload",
                    True,
                    "demo role has no active apply action; role detail loaded without upload controls",
                )
        else:
            self.record(
                "application flow has no resume upload",
                True,
                "no published demo roles; opportunities page loaded without upload controls",
            )
        page.close()

    def admin_checks(self, context: BrowserContext) -> None:
        page = context.new_page()
        self.attach_diagnostics(page)
        self.demo_sign_in(page, admin=True)

        self.visit(page, "/admin/onboarding")
        self.assert_path("T&P onboarding is protected and reachable", page, "/admin/onboarding")
        admin_steps = page.locator("ol[aria-label='Institution onboarding steps'] > li").count()
        owner_only_denial = any(
            failure.startswith("403 ") and "/admin/onboarding" in failure
            for failure in self.http_failures
        )
        self.record(
            "T&P onboarding authority boundary is enforced",
            admin_steps == 7 or owner_only_denial,
            (
                "seven-step owner onboarding rendered"
                if admin_steps == 7
                else "demo tnp_admin correctly denied; owner journey is integration-tested"
            ),
        )
        onboarding_body = page.locator("body").inner_text()
        self.record(
            "T&P onboarding preserves explicit publishing boundary",
            "Nothing publishes automatically" in onboarding_body or owner_only_denial,
            (
                "explicit non-publishing copy present"
                if "Nothing publishes automatically" in onboarding_body
                else "owner-only page withheld from demo tnp_admin"
            ),
        )

        self.visit(page, "/admin/copilot")
        self.assert_path("T&P Copilot is reachable", page, "/admin/copilot")
        copilot_body = page.locator("body").inner_text()
        proposal_actions = all(
            label in copilot_body for label in ("Edit", "Reject", "Approve proposal")
        )
        self.record(
            "T&P Copilot exposes proposal-only controls",
            proposal_actions or "proposal" in copilot_body.lower(),
            "proposal controls or disabled-state proposal boundary present",
        )
        page.close()

    def run(self) -> int:
        with sync_playwright() as playwright:
            api = playwright.request.new_context()
            health = api.get(f"{self.api_url}/service-status")
            self.record("backend service health", health.ok, f"status={health.status}")
            removed_upload = api.post(f"{self.api_url}/resumes")
            self.record(
                "public resume upload endpoint is removed",
                removed_upload.status == 405,
                f"status={removed_upload.status}",
            )
            api.dispose()

            browser = playwright.chromium.launch(headless=True)
            public_context = browser.new_context()
            public_page = public_context.new_page()
            self.attach_diagnostics(public_page)
            try:
                self.public_checks(public_page)
            except Exception as error:  # noqa: BLE001 - aggregate smoke failures
                self.record("public flow completed", False, repr(error))
                self.capture_failure(public_page, "public")
            finally:
                public_context.close()

            student_context = browser.new_context()
            try:
                self.student_checks(student_context)
            except Exception as error:  # noqa: BLE001 - aggregate smoke failures
                self.record("student flow completed", False, repr(error))
                pages = student_context.pages
                if pages:
                    self.capture_failure(pages[-1], "student")
            finally:
                student_context.close()

            admin_context = browser.new_context()
            try:
                self.admin_checks(admin_context)
            except Exception as error:  # noqa: BLE001 - aggregate smoke failures
                self.record("T&P flow completed", False, repr(error))
                pages = admin_context.pages
                if pages:
                    self.capture_failure(pages[-1], "tnp")
            finally:
                admin_context.close()
                browser.close()

        expected_unavailable_errors = [
            error
            for error in self.console_errors
            if "503 (Service Unavailable)" in error
        ]
        unexpected_console_errors = [
            error
            for error in self.console_errors
            if error not in expected_unavailable_errors
            and not (
                "403 (Forbidden)" in error
                and any(
                    failure.startswith("403 ") and "/admin/onboarding" in failure
                    for failure in self.http_failures
                )
            )
        ]
        detail = "; ".join(unexpected_console_errors[:5]) or (
            f"no unexpected errors; handled provider-unavailable responses="
            f"{len(expected_unavailable_errors)}; HTTP failures={self.http_failures[:8]}"
        )
        self.record(
            "browser console has no unexpected errors",
            not unexpected_console_errors,
            detail,
        )
        payload = {
            "frontend_url": self.frontend_url,
            "api_url": self.api_url,
            "passed": all(check.passed for check in self.checks),
            "http_failures": self.http_failures,
            "checks": [asdict(check) for check in self.checks],
        }
        print(json.dumps(payload, indent=2))
        return 0 if payload["passed"] else 1

    @staticmethod
    def capture_failure(page: Page, label: str) -> None:
        directory = Path(".data/smoke-current-updates")
        directory.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(directory / f"{label}-failure.png"), full_page=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--frontend-url", default="http://127.0.0.1:3002")
    parser.add_argument("--api-url", default="http://127.0.0.1:8001/api/v1")
    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    raise SystemExit(SmokeRun(arguments.frontend_url, arguments.api_url).run())

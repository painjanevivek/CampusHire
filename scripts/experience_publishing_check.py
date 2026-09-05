"""Publish a duplicated synthetic drive using only the actual local UI."""
import json
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect
from performance_matrix import authenticate_demo


def run():
    base = "http://127.0.0.1:3001"
    result = {"passed": False, "checks": [], "errors": [], "scope": "Local synthetic demo data"}
    output = Path(".data/experience-publishing")
    output.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            state = authenticate_demo(browser, base_url=base, sign_in_route="/admin/sign-in", button_name="Use demo T&P account", destination_prefix="/admin/")
            context = browser.new_context(storage_state=state, viewport={"width":1440,"height":900}, reduced_motion="reduce")
            page = context.new_page()
            result["responses"] = []
            page.on("response", lambda r: result["responses"].append({"path":urlsplit(r.url).path,"status":r.status}) if r.request.method == "POST" else None)
            page.goto(base + "/admin/drives", wait_until="networkidle")
            with page.expect_response(lambda r: "/duplicate" in r.url and r.request.method == "POST") as created:
                page.get_by_role("button", name="Duplicate draft", exact=True).click()
            assert created.value.ok
            drive = created.value.json()
            result["synthetic_drive_id"] = drive["id"]
            page.goto(base + "/admin/drives?drive_id=" + drive["id"] + "&step=3", wait_until="networkidle")
            # Duplicating keeps roles and rules draft; only explicit publication enables them.
            page.get_by_role("button", name="Publish", exact=True).first.click()
            expect(page.get_by_role("button", name="Publish role", exact=True)).to_be_enabled()
            page.get_by_role("button", name="Publish role", exact=True).click()
            page.wait_for_load_state("networkidle")
            page.get_by_role("button", name="5. Preview and publish", exact=False).click()
            confirm = page.get_by_role("button", name="Confirm and publish drive", exact=True)
            expect(confirm).to_be_enabled()
            page.reload(wait_until="networkidle")
            expect(page.get_by_role("heading", name="Step 5: Preview and publish", exact=True)).to_be_visible()
            result["checks"].append("Server draft, published rules, role, and selected step survive reload")
            page.screenshot(path=str(output / "publication-preview.png"), full_page=True)
            with page.expect_response(lambda r: "/actions/publish" in r.url and r.request.method == "POST") as published:
                confirm.click()
            assert published.value.ok, published.value.text()
            expect(page.get_by_text("Drive publication saved. Existing application snapshots are unchanged.", exact=True)).to_be_visible()
            result["checks"].append("Officer previews and explicitly publishes a valid synthetic drive")
            result["passed"] = True
        except Exception as error:
            result["errors"].append(str(error))
            if "page" in locals(): page.screenshot(path=str(output / "failure.png"), full_page=True)
        finally:
            browser.close()
    (output / "results.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result))
    if not result["passed"]: raise SystemExit(1)


if __name__ == "__main__": run()

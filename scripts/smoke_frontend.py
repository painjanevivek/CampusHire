import os
from pathlib import Path

from playwright.sync_api import sync_playwright


def main() -> None:
    artifact_dir = Path("artifacts")
    artifact_dir.mkdir(exist_ok=True)
    base_url = f"http://127.0.0.1:{os.getenv('CAMPUSHIRE_SMOKE_PORT', '3199')}"
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        errors: list[str] = []
        page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
        page.goto(base_url, wait_until="networkidle")
        page.screenshot(path=str(artifact_dir / "phase-1-home.png"), full_page=True)
        heading = page.locator("h1")
        assert heading.is_visible(), f"Missing h1 on {page.url}: {page.title()}"
        assert "Turn preparation into a placement plan" in (heading.text_content() or "")
        assert page.get_by_role("link", name="Create student profile").get_attribute("href") == "/sign-up"
        assert page.locator("main#main-content").count() == 1
        page.set_viewport_size({"width": 375, "height": 812})
        page.reload(wait_until="networkidle")
        assert page.locator("body").evaluate("el => el.scrollWidth <= el.clientWidth")
        page.goto(f"{base_url}/sign-up", wait_until="networkidle")
        page.screenshot(path=str(artifact_dir / "phase-2-sign-up.png"), full_page=True)
        assert "Start with one secure account" in (page.locator("h1").text_content() or "")
        assert page.get_by_label("College email").get_attribute("type") == "email"
        assert page.get_by_label("Password").get_attribute("minlength") == "12"
        page.goto(f"{base_url}/admin/sign-in", wait_until="networkidle")
        assert page.get_by_text("Administrator access is invitation-only.").is_visible()
        page.goto(f"{base_url}/onboarding", wait_until="networkidle")
        page.screenshot(path=str(artifact_dir / "phase-3-onboarding.png"), full_page=True)
        assert "Build a profile companies can understand" in (page.locator("h1").text_content() or "")
        assert page.get_by_text("Profile setup · 1 of 6").is_visible()
        assert page.locator("input[name='full_name']").is_visible()
        page.set_viewport_size({"width": 375, "height": 812})
        page.reload(wait_until="networkidle")
        assert page.locator("body").evaluate("el => el.scrollWidth <= el.clientWidth")
        page.goto(f"{base_url}/resume", wait_until="networkidle")
        assert "Turn one PDF into a reviewed profile" in (page.locator("h1").text_content() or "")
        assert page.locator("input[type='file'][accept*='pdf']").count() == 1
        assert not errors, f"Browser console errors: {errors}"
        browser.close()


if __name__ == "__main__":
    main()

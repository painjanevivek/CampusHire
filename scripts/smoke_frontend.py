from pathlib import Path

from playwright.sync_api import sync_playwright


def main() -> None:
    artifact_dir = Path("artifacts")
    artifact_dir.mkdir(exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        errors: list[str] = []
        page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
        page.goto("http://127.0.0.1:3100", wait_until="networkidle")
        page.screenshot(path=str(artifact_dir / "phase-1-home.png"), full_page=True)
        heading = page.locator("h1")
        assert heading.is_visible(), f"Missing h1 on {page.url}: {page.title()}"
        assert "Turn preparation into a placement plan" in (heading.text_content() or "")
        assert page.get_by_role("link", name="Create student profile").get_attribute("href") == "/sign-up"
        assert page.locator("main#main-content").count() == 1
        page.set_viewport_size({"width": 375, "height": 812})
        page.reload(wait_until="networkidle")
        assert page.locator("body").evaluate("el => el.scrollWidth <= el.clientWidth")
        assert not errors, f"Browser console errors: {errors}"
        browser.close()


if __name__ == "__main__":
    main()

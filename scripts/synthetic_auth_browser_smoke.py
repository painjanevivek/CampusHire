"""Smoke-test public auth entry points without student data or an API server."""

from playwright.sync_api import sync_playwright


def main() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            expected = {
                "/sign-up": ("Create your CampusHire account.", "invitation_code"),
                "/forgot-password": ("Reset your password securely.", "email"),
                "/reset-password": ("Enter your recovery code.", "code"),
            }
            for path, (heading, field) in expected.items():
                response = page.goto(
                    f"http://127.0.0.1:3002{path}",
                    wait_until="domcontentloaded",
                    timeout=60_000,
                )
                page.wait_for_load_state("networkidle")
                assert response is not None and response.status == 200, path
                assert page.get_by_role("heading", name=heading).is_visible(), path
                assert page.locator(f'input[name="{field}"]').is_visible(), path
                print(f"PASS {path}: heading and {field} field are visible")

            page.goto(
                "http://127.0.0.1:3002/forgot-password",
                wait_until="domcontentloaded",
                timeout=60_000,
            )
            page.wait_for_load_state("networkidle")
            page.get_by_role("link", name="Have a one-time recovery code?").click()
            page.wait_for_timeout(1000)
            assert page.url.endswith("/reset-password")
            print("PASS /forgot-password to /reset-password recovery-code navigation")
        finally:
            browser.close()


if __name__ == "__main__":
    main()

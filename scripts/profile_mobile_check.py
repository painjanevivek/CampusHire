"""Scoped local-only student account UX check; never records session material."""

import argparse
import json
import struct
import zlib
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright


def fixture_png() -> bytes:
    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))
    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(b"\x00\x25\x57\xd6")) + chunk(b"IEND", b""))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:3001")
    parser.add_argument("--output", type=Path, default=Path("docs/evidence/profile-navigation"))
    parser.add_argument("--exercise-photo", action="store_true",
                        help="Temporarily upload/remove a synthetic image if demo account has no photo.")
    parser.add_argument("--cleanup-test-photo", action="store_true", help="Remove a previous 1-pixel synthetic check image before rerunning.")
    args = parser.parse_args()
    if urlsplit(args.base_url).hostname not in {"127.0.0.1", "localhost"}:
        raise RuntimeError("This runner only supports local synthetic demo environments.")
    args.output.mkdir(parents=True, exist_ok=True)
    results = {"checks": [], "photo_round_trip": "not run", "console_errors": []}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
        page = context.new_page()
        page.on("pageerror", lambda error: results["console_errors"].append(str(error)))
        page.goto(args.base_url + "/sign-in")
        page.get_by_role("button", name="Save essential-only preference", exact=True).click()
        page.get_by_role("button", name="Use demo student account", exact=True).click()
        page.wait_for_url("**/dashboard", timeout=30000)
        page.wait_for_load_state("networkidle")
        expect(page.get_by_role("button", name="Open activation checklist")).to_have_count(0)
        profile_button = page.get_by_role("button", name="Open profile menu", exact=True)
        profile_button.focus()
        page.keyboard.press("Enter")
        expect(page.get_by_role("link", name="Profile", exact=True)).to_be_focused()
        page.keyboard.press("Escape")
        expect(profile_button).to_be_focused()
        profile_button.click()
        page.get_by_role("link", name="Settings", exact=True).click()
        page.wait_for_url("**/profile#account-settings")
        page.wait_for_load_state("networkidle")
        expect(page.locator("#account-settings")).to_be_in_viewport()
        page.goto(args.base_url + "/profile")
        page.wait_for_load_state("networkidle")
        expect(page.get_by_text("Profile completion", exact=True)).to_be_visible()
        expect(page.get_by_label("Open activation checklist")).to_be_visible()

        if args.cleanup_test_photo:
            saved = page.get_by_role("button", name="Open profile menu").locator("img")
            if saved.count():
                assert saved.evaluate("e => e.naturalWidth === 1 && e.naturalHeight === 1"), "Not the synthetic 1-pixel image; preserved."
                page.get_by_role("button", name="Remove photo", exact=True).click()
                expect(page.get_by_text("Profile photo removed.", exact=True)).to_be_visible()

        if args.exercise_photo:
            if page.get_by_role("button", name="Remove photo", exact=True).count():
                results["photo_round_trip"] = "skipped: existing photo preserved"
            else:
                try:
                    page.get_by_label("Choose profile photo").set_input_files(
                        {"name": "synthetic-check.png", "mimeType": "image/png", "buffer": fixture_png()})
                    expect(page.get_by_text("Profile photo updated.", exact=True)).to_be_visible(timeout=15000)
                    expect(page.get_by_role("button", name="Open profile menu").locator("img")).to_be_visible()
                    page.reload()
                    page.wait_for_load_state("networkidle")
                    expect(page.get_by_role("button", name="Change photo", exact=True)).to_be_visible()
                    results["photo_round_trip"] = "upload, header update, persistence after reload passed"
                finally:
                    remove = page.get_by_role("button", name="Remove photo", exact=True)
                    if remove.count():
                        remove.click()
                        expect(page.get_by_text("Profile photo removed.", exact=True)).to_be_visible()
                        results["photo_cleanup"] = "synthetic photo removed"

        for width, height in [(390, 844), (768, 1024), (1440, 900), (1920, 1080), (320, 800)]:
            page.set_viewport_size({"width": width, "height": height})
            page.goto(args.base_url + "/profile")
            page.wait_for_load_state("networkidle")
            check = page.evaluate("""() => ({width: innerWidth, height: innerHeight,
              overflow: document.documentElement.scrollWidth > innerWidth,
              headerButtons: [...document.querySelectorAll('header button')].filter(e => e.getClientRects().length).map(e => ({label:e.getAttribute('aria-label'),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))})""")
            assert not check["overflow"], check
            page.evaluate(Path("node_modules/axe-core/axe.min.js").read_text(encoding="utf-8"))
            check["axe_violations"] = page.evaluate("""async () => (await axe.run(document, {runOnly:{type:'tag', values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v => ({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))""")
            page.screenshot(path=str(args.output / f"profile-{width}.png"), full_page=True)
            page.get_by_role("button", name="Open profile menu", exact=True).click()
            expect(page.get_by_role("link", name="Profile", exact=True)).to_be_visible()
            page.screenshot(path=str(args.output / f"menu-{width}.png"))
            page.keyboard.press("Escape")
            page.get_by_role("button", name="Open updates", exact=False).click()
            expect(page.get_by_role("region", name="Placement updates")).to_be_visible()
            bounds = page.get_by_role("region", name="Placement updates").bounding_box()
            assert bounds and bounds["x"] >= 0 and bounds["x"] + bounds["width"] <= width, bounds
            page.keyboard.press("Escape")
            page.get_by_role("contentinfo").scroll_into_view_if_needed()
            expect(page.get_by_role("contentinfo").get_by_role("link", name="Help center")).to_be_visible()
            results["checks"].append(check)
        page.get_by_role("button", name="Open student navigation", exact=True).click()
        expect(page.get_by_role("link", name="Home", exact=True)).to_be_focused()
        page.get_by_role("link", name="Home", exact=True).click()
        page.wait_for_url("**/dashboard")
        expect(page.get_by_role("button", name="Open student navigation", exact=True)).to_have_attribute("aria-expanded", "false")
        results["mobile_navigation"] = "focus, navigate to Home, and close passed"
        page.get_by_role("button", name="Open profile menu", exact=True).click()
        page.get_by_role("button", name="Sign out", exact=True).click()
        page.wait_for_url("**/sign-in")
        results["sign_out"] = "profile menu sign-out passed for the test session"
        results["browser"] = browser.version
        results["reduced_motion"] = True
        context.close()
        browser.close()
    (args.output / "results.json").write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()

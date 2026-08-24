from __future__ import annotations

import argparse
import json
import re
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright


@dataclass(frozen=True)
class PageCheck:
    browser: str
    route: str
    viewport: str
    main_landmarks: int
    headings: int
    interactive_elements: int
    horizontal_overflow: bool
    overflowing_elements: list[dict[str, Any]]
    axe_violations: list[dict[str, Any]]
    focused_element: str
    focus_indicator_visible: bool
    keyboard_expected_elements: int
    keyboard_reachable_elements: int
    keyboard_traversal_passed: bool
    keyboard_mode: str
    local_https_bridge_requests: int
    mocked_api_requests: int
    expected_degraded_console_errors: int
    unexpected_console_errors: list[str]
    passed: bool


VIEWPORTS = {
    "mobile-360x800": {"width": 360, "height": 800},
    "tablet-768x1024": {"width": 768, "height": 1024},
    "desktop-1440x900": {"width": 1440, "height": 900},
}
BROWSERS = ("chromium", "firefox", "webkit")
FOCUSABLE_SELECTOR = (
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), '
    'textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'
)
PUBLIC_ROUTES = ["/", "/sign-in", "/sign-up", "/privacy", "/offline", "/unauthorized"]
STUDENT_ROUTES = [
    "/dashboard",
    "/opportunities",
    "/resume",
    "/resume/builder",
    "/roadmap",
    "/onboarding",
]
ADMIN_ROUTES = ["/admin/operations", "/admin/applications", "/admin/drives"]


def slug(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return normalized or "root"


def prepare_page(context: BrowserContext, axe_source: str) -> tuple[Page, list[str]]:
    page = context.new_page()
    console_errors: list[str] = []
    page.on(
        "console",
        lambda message: console_errors.append(message.text)
        if message.type == "error"
        else None,
    )
    page.add_init_script(axe_source)
    return page, console_errors


def configure_degraded_api(context: BrowserContext) -> list[str]:
    """Replace the unavailable API with an explicit, deterministic resilience state."""
    requests: list[str] = []

    def unavailable(route: Any) -> None:
        requests.append(route.request.url)
        route.fulfill(
            status=503,
            content_type="application/json",
            body=json.dumps(
                {
                    "detail": {
                        "code": "synthetic_api_unavailable",
                        "message": "Synthetic accessibility resilience state.",
                    }
                }
            ),
        )

    context.route("**/api/v1/**", unavailable)
    return requests


def configure_local_https_bridge(context: BrowserContext, base_url: str) -> list[str]:
    """Serve CSP-upgraded loopback assets from the local HTTP test server."""
    parsed = urlsplit(base_url)
    if parsed.scheme != "http" or parsed.hostname not in {"127.0.0.1", "localhost"}:
        return []
    requests: list[str] = []

    def bridge(route: Any) -> None:
        requests.append(route.request.url)
        local_url = route.request.url.replace("https://", "http://", 1)
        route.fulfill(response=route.fetch(url=local_url))

    context.route(f"https://{parsed.netloc}/**", bridge)
    return requests


def classify_console_errors(
    messages: list[str], mocked_api_requests: list[str]
) -> tuple[int, list[str]]:
    expected = 0
    unexpected: list[str] = []
    for message in messages:
        is_expected_api_failure = (
            bool(mocked_api_requests)
            and "Failed to load resource" in message
            and "503" in message
        )
        if is_expected_api_failure:
            expected += 1
        else:
            unexpected.append(message)
    return expected, unexpected


def prepare_keyboard_environment(page: Page, browser_name: str) -> str:
    if browser_name != "webkit":
        return "native-tab-order"
    # Playwright WebKit inherits Safari's OS-level Full Keyboard Access preference.
    # Explicit tabindex values emulate that enabled preference in headless CI.
    page.evaluate(
        """
        (selector) => {
          for (const element of document.querySelectorAll(selector)) {
            if (!element.hasAttribute("tabindex")) element.setAttribute("tabindex", "0");
          }
        }
        """,
        FOCUSABLE_SELECTOR,
    )
    return "emulated-full-keyboard-access"


def inspect_keyboard_traversal(page: Page) -> dict[str, Any]:
    expected = page.evaluate(
        """
        (selector) => [...document.querySelectorAll(selector)].filter((element) => {
          if (!(element instanceof HTMLElement)) return false;
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return !element.closest("[inert]") &&
            element.getAttribute("aria-hidden") !== "true" &&
            style.display !== "none" && style.visibility !== "hidden" &&
            rect.width > 0 && rect.height > 0;
        }).length
        """,
        FOCUSABLE_SELECTOR,
    )
    reached: set[str] = set()
    fingerprint_script = """
        (selector) => {
          const element = document.activeElement;
          if (!(element instanceof HTMLElement) || element === document.body) return "";
          const candidates = [...document.querySelectorAll(selector)];
          return `${element.tagName.toLowerCase()}#${element.id || ""}@${candidates.indexOf(element)}`;
        }
    """
    initial = page.evaluate(fingerprint_script, FOCUSABLE_SELECTOR)
    if initial:
        reached.add(str(initial))
    for _ in range(expected + 1):
        page.keyboard.press("Tab")
        fingerprint = page.evaluate(fingerprint_script, FOCUSABLE_SELECTOR)
        if fingerprint:
            reached.add(str(fingerprint))
    return {
        "expected": int(expected),
        "reached": len(reached),
        "passed": len(reached) >= int(expected),
    }


def inspect_page(
    page: Page,
    *,
    base_url: str,
    route: str,
    browser_name: str,
    viewport_name: str,
    screenshot_directory: Path,
    console_errors: list[str],
    mocked_api_requests: list[str],
    local_https_bridge_requests: list[str],
) -> PageCheck:
    console_errors.clear()
    mocked_api_requests.clear()
    local_https_bridge_requests.clear()
    page.goto(f"{base_url}{route}", wait_until="networkidle", timeout=30_000)
    keyboard_mode = prepare_keyboard_environment(page, browser_name)
    page.locator("body").press("Home")
    page.keyboard.press("Tab")
    focus = page.evaluate(
        """
        () => {
          const element = document.activeElement;
          if (!(element instanceof HTMLElement)) return { label: "none", visible: false };
          const style = getComputedStyle(element);
          const outlineVisible = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
          const shadowVisible = style.boxShadow !== "none";
          return {
            label: `${element.tagName.toLowerCase()}#${element.id || ""}.${element.className || ""}`,
            visible: outlineVisible || shadowVisible,
          };
        }
        """
    )
    violations = page.evaluate(
        """
        async () => {
          const result = await axe.run(document, {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] },
          });
          return result.violations.map((item) => ({
            id: item.id,
            impact: item.impact,
            targets: item.nodes.map((node) => node.target),
          }));
        }
        """
    )
    overflowing_elements = page.evaluate(
        """
        () => [...document.querySelectorAll("*")]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}`,
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            };
          })
          .filter((item) => item.left < -1 || item.right > document.documentElement.clientWidth + 1)
          .slice(0, 12)
        """
    )
    overflow = page.locator("body").evaluate("el => el.scrollWidth > el.clientWidth + 1")
    main_landmarks = page.locator("main#main-content").count()
    headings = page.locator("h1").count()
    interactive_elements = page.locator(
        "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])"
    ).count()
    expected_errors, unexpected_errors = classify_console_errors(
        console_errors, mocked_api_requests
    )
    passed = (
        main_landmarks == 1
        and headings == 1
        and interactive_elements > 0
        and not overflow
        and not violations
        and bool(focus["visible"])
        and not unexpected_errors
    )
    if route in {"/", "/dashboard", "/admin/operations"}:
        page.screenshot(
            path=str(
                screenshot_directory
                / f"focus-{browser_name}-{slug(route)}-{viewport_name}.png"
            ),
            full_page=True,
        )
    keyboard = inspect_keyboard_traversal(page)
    passed = passed and bool(keyboard["passed"])
    return PageCheck(
        browser=browser_name,
        route=route,
        viewport=viewport_name,
        main_landmarks=main_landmarks,
        headings=headings,
        interactive_elements=interactive_elements,
        horizontal_overflow=bool(overflow),
        overflowing_elements=overflowing_elements if overflow else [],
        axe_violations=violations,
        focused_element=str(focus["label"]),
        focus_indicator_visible=bool(focus["visible"]),
        keyboard_expected_elements=int(keyboard["expected"]),
        keyboard_reachable_elements=int(keyboard["reached"]),
        keyboard_traversal_passed=bool(keyboard["passed"]),
        keyboard_mode=keyboard_mode,
        local_https_bridge_requests=len(local_https_bridge_requests),
        mocked_api_requests=len(mocked_api_requests),
        expected_degraded_console_errors=expected_errors,
        unexpected_console_errors=unexpected_errors,
        passed=passed,
    )


def reduced_motion_check(browser: Browser, base_url: str, axe_source: str) -> dict[str, Any]:
    context = browser.new_context(
        viewport={"width": 1440, "height": 900}, reduced_motion="reduce"
    )
    local_https_bridge_requests = configure_local_https_bridge(context, base_url)
    mocked_api_requests = configure_degraded_api(context)
    page, console_errors = prepare_page(context, axe_source)
    console_errors.clear()
    mocked_api_requests.clear()
    local_https_bridge_requests.clear()
    page.goto(f"{base_url}/", wait_until="networkidle")
    maximum_seconds = page.evaluate(
        """
        () => {
          const seconds = (token) => token.trim().endsWith("ms")
            ? parseFloat(token) / 1000
            : parseFloat(token) || 0;
          let maximum = 0;
          for (const element of document.querySelectorAll("*")) {
            const style = getComputedStyle(element);
            for (const value of `${style.animationDuration},${style.transitionDuration}`.split(",")) {
              maximum = Math.max(maximum, seconds(value));
            }
          }
          return maximum;
        }
        """
    )
    expected_errors, unexpected_errors = classify_console_errors(
        console_errors, mocked_api_requests
    )
    context.close()
    return {
        "maximum_animation_or_transition_seconds": maximum_seconds,
        "mocked_api_requests": len(mocked_api_requests),
        "local_https_bridge_requests": len(local_https_bridge_requests),
        "expected_degraded_console_errors": expected_errors,
        "unexpected_console_errors": unexpected_errors,
        "passed": maximum_seconds <= 0.01 and not unexpected_errors,
    }


def zoom_reflow_check(browser: Browser, base_url: str, axe_source: str) -> dict[str, Any]:
    # A 720 CSS-pixel viewport represents a 1440-pixel display at 200% browser zoom.
    context = browser.new_context(viewport={"width": 720, "height": 450})
    local_https_bridge_requests = configure_local_https_bridge(context, base_url)
    mocked_api_requests = configure_degraded_api(context)
    page, console_errors = prepare_page(context, axe_source)
    results: dict[str, bool] = {}
    route_console: dict[str, dict[str, Any]] = {}
    for route in ["/", *STUDENT_ROUTES, "/admin/operations"]:
        console_errors.clear()
        mocked_api_requests.clear()
        local_https_bridge_requests.clear()
        page.goto(f"{base_url}{route}", wait_until="networkidle")
        results[route] = not page.locator("body").evaluate(
            "el => el.scrollWidth > el.clientWidth + 1"
        )
        expected, unexpected = classify_console_errors(
            console_errors, mocked_api_requests
        )
        route_console[route] = {
            "mocked_api_requests": len(mocked_api_requests),
            "local_https_bridge_requests": len(local_https_bridge_requests),
            "expected_degraded_console_errors": expected,
            "unexpected_console_errors": unexpected,
        }
    context.close()
    return {
        "emulated_display": "1440x900 at 200% zoom",
        "routes": results,
        "console": route_console,
        "passed": all(results.values())
        and all(not item["unexpected_console_errors"] for item in route_console.values()),
    }


def forced_colors_check(
    browser: Browser, base_url: str, axe_source: str, browser_name: str
) -> dict[str, Any]:
    context = browser.new_context(
        viewport={"width": 1440, "height": 900}, forced_colors="active"
    )
    local_https_bridge_requests = configure_local_https_bridge(context, base_url)
    mocked_api_requests = configure_degraded_api(context)
    page, console_errors = prepare_page(context, axe_source)
    routes: dict[str, dict[str, Any]] = {}
    for route in ("/", "/dashboard", "/admin/operations"):
        console_errors.clear()
        mocked_api_requests.clear()
        local_https_bridge_requests.clear()
        page.goto(f"{base_url}{route}", wait_until="networkidle")
        keyboard_mode = prepare_keyboard_environment(page, browser_name)
        page.keyboard.press("Tab")
        routes[route] = page.evaluate(
            """
            () => ({
              focusVisible: document.activeElement instanceof HTMLElement &&
                (getComputedStyle(document.activeElement).outlineStyle !== "none" ||
                 getComputedStyle(document.activeElement).boxShadow !== "none"),
              overflow: document.body.scrollWidth > document.body.clientWidth + 1,
            })
            """
        )
        expected, unexpected = classify_console_errors(
            console_errors, mocked_api_requests
        )
        routes[route]["mockedApiRequests"] = len(mocked_api_requests)
        routes[route]["keyboardMode"] = keyboard_mode
        routes[route]["localHttpsBridgeRequests"] = len(local_https_bridge_requests)
        routes[route]["expectedDegradedConsoleErrors"] = expected
        routes[route]["unexpectedConsoleErrors"] = unexpected
    context.close()
    return {
        "routes": routes,
        "passed": all(
            item["focusVisible"]
            and not item["overflow"]
            and not item["unexpectedConsoleErrors"]
            for item in routes.values()
        ),
    }


def run(args: argparse.Namespace) -> dict[str, Any]:
    base_url = args.base_url.rstrip("/")
    axe_path = Path("node_modules/axe-core/axe.min.js")
    if not axe_path.is_file():
        raise RuntimeError("Run npm ci before the browser accessibility matrix.")
    axe_source = axe_path.read_text(encoding="utf-8")
    screenshot_directory = Path(args.screenshot_directory)
    screenshot_directory.mkdir(parents=True, exist_ok=True)
    page_checks: list[PageCheck] = []
    browser_results: dict[str, dict[str, Any]] = {}
    browser_names = args.browsers or list(BROWSERS)

    with sync_playwright() as playwright:
        for browser_name in browser_names:
            browser_type = getattr(playwright, browser_name)
            browser = browser_type.launch(headless=True)
            for viewport_name, viewport in VIEWPORTS.items():
                routes = [*PUBLIC_ROUTES, *STUDENT_ROUTES]
                if viewport_name != "mobile-360x800":
                    routes.extend(ADMIN_ROUTES)
                context = browser.new_context(viewport=viewport)
                local_https_bridge_requests = configure_local_https_bridge(
                    context, base_url
                )
                mocked_api_requests = configure_degraded_api(context)
                page, errors = prepare_page(context, axe_source)
                for route in routes:
                    page_checks.append(
                        inspect_page(
                            page,
                            base_url=base_url,
                            route=route,
                            browser_name=browser_name,
                            viewport_name=viewport_name,
                            screenshot_directory=screenshot_directory,
                            console_errors=errors,
                            mocked_api_requests=mocked_api_requests,
                            local_https_bridge_requests=local_https_bridge_requests,
                        )
                    )
                context.close()
            browser_results[browser_name] = {
                "reduced_motion": reduced_motion_check(browser, base_url, axe_source),
                "zoom_reflow": zoom_reflow_check(browser, base_url, axe_source),
                "forced_colors": forced_colors_check(
                    browser, base_url, axe_source, browser_name
                ),
            }
            browser.close()

    payload = {
        "recorded_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "engines": [f"{name}-headless" for name in browser_names],
        "base_url": base_url,
        "page_checks": [asdict(item) for item in page_checks],
        "unexpected_console_errors": [
            {
                "route": item.route,
                "viewport": item.viewport,
                "messages": item.unexpected_console_errors,
            }
            for item in page_checks
            if item.unexpected_console_errors
        ],
        "browser_results": browser_results,
        "passed": all(item.passed for item in page_checks)
        and not any(item.unexpected_console_errors for item in page_checks)
        and all(
            result["reduced_motion"]["passed"]
            and result["zoom_reflow"]["passed"]
            and result["forced_colors"]["passed"]
            for result in browser_results.values()
        ),
    }
    return payload


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run the CampusHire browser accessibility and reflow matrix."
    )
    parser.add_argument("--base-url", default="http://127.0.0.1:3199")
    parser.add_argument("--output", default=".data/accessibility-matrix-phase7f.json")
    parser.add_argument("--screenshot-directory", default=".data/accessibility-phase7f")
    parser.add_argument(
        "--browser",
        dest="browsers",
        action="append",
        choices=BROWSERS,
        help="Browser engine to test; repeat as needed. Defaults to all supported engines.",
    )
    parser.add_argument("--verbose", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result = run(args)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    printable = (
        result
        if args.verbose
        else {
            "recorded_at_utc": result["recorded_at_utc"],
            "engines": result["engines"],
            "page_checks": len(result["page_checks"]),
            "unexpected_console_errors": len(result["unexpected_console_errors"]),
            "passed": result["passed"],
            "output": str(output),
        }
    )
    print(json.dumps(printable, indent=2))
    if not result["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

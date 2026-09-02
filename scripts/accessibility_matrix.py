from __future__ import annotations

import argparse
import json
import os
import re
import time
from dataclasses import asdict, dataclass
from http.client import HTTPConnection
from http.cookies import SimpleCookie
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlsplit

from playwright.sync_api import (
    Browser,
    BrowserContext,
    Page,
    sync_playwright,
)
from playwright.sync_api import (
    TimeoutError as PlaywrightTimeoutError,
)


@dataclass(frozen=True)
class PageCheck:
    browser: str
    area: str
    route: str
    final_path: str
    expected_path_reached: bool
    viewport: str
    main_landmarks: int
    headings: int
    interactive_elements: int
    undersized_controls: list[dict[str, Any]]
    horizontal_overflow: bool
    overflowing_elements: list[dict[str, Any]]
    axe_violations: list[dict[str, Any]]
    focused_element: str
    focus_indicator_visible: bool
    keyboard_expected_elements: int
    keyboard_reachable_elements: int
    keyboard_unreachable_elements: list[str]
    keyboard_traversal_passed: bool
    keyboard_mode: str
    local_https_bridge_requests: int
    mocked_api_requests: int
    expected_degraded_console_errors: int
    unexpected_console_errors: list[str]
    passed: bool


VIEWPORTS = {
    "mobile-320x800": {"width": 320, "height": 800},
    "mobile-360x800": {"width": 360, "height": 800},
    "tablet-768x1024": {"width": 768, "height": 1024},
    "desktop-1440x900": {"width": 1440, "height": 900},
}
BROWSERS = ("chromium", "firefox", "webkit")
FOCUSABLE_SELECTOR = (
    'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), '
    'input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), '
    'textarea:not([disabled]):not([tabindex="-1"]), summary:not([tabindex="-1"]), '
    '[tabindex]:not([tabindex="-1"])'
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
PUBLIC_REFLOW_ROUTES = ["/", "/sign-in", "/sign-up", "/privacy"]


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


def authenticate_demo(
    context: BrowserContext,
    *,
    base_url: str,
    sign_in_route: str,
    button_name: str,
    destination_prefix: str,
) -> str:
    """Create a real demo session without persisting cookies or credentials to evidence."""
    page = context.new_page()
    network_failures: list[str] = []
    console_errors: list[str] = []
    auth_responses: list[str] = []
    auth_request_state: list[dict[str, Any]] = []
    page.on(
        "requestfailed",
        lambda request: network_failures.append(
            f"{request.method} {request.url}: {request.failure}"
        ),
    )
    page.on(
        "console",
        lambda message: console_errors.append(message.text)
        if message.type == "error"
        else None,
    )
    page.on(
        "response",
        lambda response: auth_responses.append(
            f"{response.request.method} {response.url}: {response.status}"
        )
        if "/api/v1/auth/" in response.url
        else None,
    )
    def record_auth_request(request: Any) -> None:
        if "/api/v1/auth/" not in request.url:
            return
        request_cookies = SimpleCookie()
        request_cookies.load(request.headers.get("cookie", ""))
        cookie_token = (
            request_cookies["campushire_csrf"].value
            if "campushire_csrf" in request_cookies
            else ""
        )
        header_token = request.headers.get("x-csrf-token", "")
        auth_request_state.append(
            {
                "method": request.method,
                "hasCsrfCookie": bool(cookie_token),
                "hasCsrfHeader": bool(header_token),
                "csrfMatches": bool(cookie_token)
                and bool(header_token)
                and cookie_token == header_token,
            }
        )

    page.on("request", record_auth_request)
    page.goto(f"{base_url}{sign_in_route}", wait_until="networkidle", timeout=30_000)
    button = page.get_by_role("button", name=button_name, exact=True)
    if button.count() != 1:
        raise RuntimeError(
            f"Demo authentication control '{button_name}' is unavailable at {sign_in_route}."
        )
    button.click()
    try:
        page.wait_for_url(
            lambda url: (
                urlsplit(url).path != sign_in_route
                and urlsplit(url).path.startswith(destination_prefix)
            ),
            timeout=30_000,
        )
    except PlaywrightTimeoutError as error:
        visible_text = page.locator("body").inner_text()[:1_000]
        cookie_metadata = [
            {
                "name": item["name"],
                "domain": item["domain"],
                "path": item["path"],
                "secure": item["secure"],
                "sameSite": item["sameSite"],
            }
            for item in context.cookies()
        ]
        raise RuntimeError(
            f"Demo authentication did not leave {sign_in_route}; current URL {page.url}. "
            f"Network failures: {network_failures[:5]}. Console errors: {console_errors[:5]}. "
            f"Auth responses: {auth_responses[-5:]}. Cookie metadata: {cookie_metadata}. "
            f"Auth request state: {auth_request_state[-5:]}. "
            f"Visible page text: {visible_text}"
        ) from error
    destination = urlsplit(page.url).path
    page.close()
    return destination


def configure_degraded_api(context: BrowserContext) -> list[str]:
    """Replace the unavailable API with an explicit, deterministic resilience state."""
    requests: list[str] = []

    def unavailable(route: Any) -> None:
        requests.append(route.request.url)
        route.fulfill(
            status=503,
            content_type="application/json",
            headers={"access-control-allow-origin": "*"},
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
    """Serve CSP-upgraded loopback frontend/API requests from local HTTP services."""
    base_origin_parts = urlsplit(base_url)
    base_origin = f"{base_origin_parts.scheme}://{base_origin_parts.netloc}"
    local_frontend_origin = f"http://{base_origin_parts.netloc}"
    candidates = [
        base_url,
        os.environ.get("CAMPUSHIRE_TEST_API_URL", "http://127.0.0.1:8000"),
    ]
    netlocs = {
        parsed.netloc
        for candidate in candidates
        if (parsed := urlsplit(candidate)).scheme in {"http", "https"}
        and parsed.hostname in {"127.0.0.1", "localhost"}
    }
    if not netlocs:
        return []
    requests: list[str] = []

    def bridge(route: Any) -> None:
        requests.append(route.request.url)
        local_url = route.request.url.replace("https://", "http://", 1)
        local_parts = urlsplit(local_url)
        fetch_headers = dict(route.request.headers)
        if local_parts.netloc != base_origin_parts.netloc:
            # The backend's local trusted-origin policy correctly names the
            # actual HTTP frontend process. Present that origin only to the
            # loopback API, then expose the secure test origin to the browser.
            fetch_headers["origin"] = local_frontend_origin
            cookie_scope_url = route.request.url.replace(
                "http://", "https://", 1
            )
            applicable_cookies = context.cookies(cookie_scope_url)
            if applicable_cookies:
                # WebKit does not attach cookies to requests whose HTTPS URL
                # is fulfilled by an interception handler. Forward only the
                # cookies its own jar marks applicable to that exact API URL.
                fetch_headers["cookie"] = "; ".join(
                    f"{item['name']}={item['value']}" for item in applicable_cookies
                )
        for excluded_header in (
            "host",
            "content-length",
            "connection",
            "accept-encoding",
        ):
            fetch_headers.pop(excluded_header, None)
        request_method = route.request.method
        request_body = route.request.post_data_buffer
        current_url = local_url
        response_headers: list[tuple[str, str]] = []
        response_body = b""
        response_status = 500
        set_cookie_headers: list[str] = []
        for _ in range(5):
            current_parts = urlsplit(current_url)
            request_target = current_parts.path or "/"
            if current_parts.query:
                request_target = f"{request_target}?{current_parts.query}"
            connection = HTTPConnection(
                current_parts.hostname,
                current_parts.port or 80,
                timeout=30,
            )
            try:
                connection.request(
                    request_method,
                    request_target,
                    body=request_body,
                    headers=fetch_headers,
                )
                local_response = connection.getresponse()
                response_body = local_response.read()
                response_status = local_response.status
                response_headers = local_response.getheaders()
            finally:
                connection.close()
            set_cookie_headers.extend(
                value
                for name, value in response_headers
                if name.lower() == "set-cookie"
            )
            location = next(
                (
                    value
                    for name, value in response_headers
                    if name.lower() == "location"
                ),
                None,
            )
            if response_status not in {301, 302, 303, 307, 308} or not location:
                break
            current_url = urljoin(current_url, location).replace(
                "https://", "http://", 1
            )
            if response_status in {301, 302, 303} and request_method not in {
                "GET",
                "HEAD",
            }:
                request_method = "GET"
                request_body = None
                fetch_headers.pop("content-type", None)
        else:
            raise RuntimeError(f"Loopback bridge redirect limit exceeded for {local_url}")
        headers = {
            name.lower(): value
            for name, value in response_headers
            if name.lower() != "set-cookie"
        }
        secure_cookies: list[dict[str, Any]] = []
        for raw_cookie in set_cookie_headers:
            parsed_cookie = SimpleCookie()
            parsed_cookie.load(raw_cookie)
            for name, morsel in parsed_cookie.items():
                same_site = (morsel["samesite"] or "Lax").capitalize()
                secure_cookies.append(
                    {
                        "name": name,
                        "value": morsel.value,
                        "domain": morsel["domain"]
                        or urlsplit(route.request.url).hostname,
                        "path": morsel["path"] or "/",
                        "httpOnly": bool(morsel["httponly"]),
                        "secure": True,
                        "sameSite": same_site
                        if same_site in {"Strict", "Lax", "None"}
                        else "Lax",
                    }
                )
        if secure_cookies:
            # Install cookies on the secure browser origin explicitly. Keeping
            # the loopback transport outside Playwright's API request cookie
            # jar prevents the proxy and browser from diverging on CSRF state.
            context.add_cookies(secure_cookies)
        # WebKit omits Origin from the routed request headers for upgraded
        # manifest requests even though it still applies a CORS check. The
        # bridge is test-only and loopback-only, so fall back to the exact
        # frontend origin instead of using a wildcard with credentials.
        request_origin = route.request.headers.get("origin") or base_origin
        if request_origin:
            parsed_origin = urlsplit(request_origin)
            if parsed_origin.hostname in {"127.0.0.1", "localhost"}:
                headers["access-control-allow-origin"] = request_origin
                headers["access-control-allow-credentials"] = "true"
                headers["vary"] = "Origin"
        route.fulfill(status=response_status, headers=headers, body=response_body)

    for netloc in netlocs:
        context.route(f"http://{netloc}/**", bridge)
        context.route(f"https://{netloc}/**", bridge)
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
        (selector) => [...document.querySelectorAll(selector)]
          .filter((element) => {
            if (!(element instanceof HTMLElement)) return false;
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            const closedDetails = element.closest("details:not([open])");
            if (closedDetails && element !== closedDetails.querySelector(":scope > summary")) return false;
            return !element.closest("[inert]") &&
              element.getAttribute("aria-hidden") !== "true" &&
              style.display !== "none" && style.visibility !== "hidden" &&
              rect.width > 0 && rect.height > 0;
          })
          .map((element, index, candidates) => ({
            fingerprint: `${element.tagName.toLowerCase()}#${element.id || ""}@${[...document.querySelectorAll(selector)].indexOf(element)}`,
            label: `${element.tagName.toLowerCase()}#${element.id || ""}[${element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 40) || "unlabelled"}]`,
          }))
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
    for _ in range(len(expected) + 1):
        page.keyboard.press("Tab")
        fingerprint = page.evaluate(fingerprint_script, FOCUSABLE_SELECTOR)
        if fingerprint:
            reached.add(str(fingerprint))
    missing = [
        item["label"] for item in expected if item["fingerprint"] not in reached
    ]
    return {
        "expected": len(expected),
        "reached": len(reached),
        "unreachable": missing,
        "passed": not missing,
    }


def inspect_page(
    page: Page,
    *,
    base_url: str,
    route: str,
    area: str,
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
    page.wait_for_timeout(900)
    final_path = urlsplit(page.url).path
    expected_path_reached = final_path == route
    keyboard_mode = prepare_keyboard_environment(page, browser_name)
    page.evaluate("() => document.activeElement instanceof HTMLElement && document.activeElement.blur()")
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
    undersized_controls = page.evaluate(
        """
        () => [...document.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [role="button"]'
        )]
          .filter((element) => {
            if (!(element instanceof HTMLElement)) return false;
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
          })
          .map((element) => {
            const target = element.matches('input[type="checkbox"], input[type="radio"], input[type="file"]')
              ? element.closest("label") ?? element
              : element;
            const rect = target.getBoundingClientRect();
            return {
              selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}`,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            };
          })
          .filter((item) => item.width < 44 || item.height < 44)
          .slice(0, 20)
        """
    )
    expected_errors, unexpected_errors = classify_console_errors(
        console_errors, mocked_api_requests
    )
    passed = (
        main_landmarks == 1
        and headings == 1
        and interactive_elements > 0
        and expected_path_reached
        and not undersized_controls
        and not overflow
        and not violations
        and bool(focus["visible"])
        and not unexpected_errors
    )
    if route in {"/", "/dashboard", "/admin/operations"}:
        page.screenshot(
            path=str(
                screenshot_directory
                / f"focus-{browser_name}-{area}-{slug(route)}-{viewport_name}.png"
            ),
            full_page=True,
        )
    keyboard = inspect_keyboard_traversal(page)
    passed = passed and bool(keyboard["passed"])
    return PageCheck(
        browser=browser_name,
        area=area,
        route=route,
        final_path=final_path,
        expected_path_reached=expected_path_reached,
        viewport=viewport_name,
        main_landmarks=main_landmarks,
        headings=headings,
        interactive_elements=interactive_elements,
        undersized_controls=undersized_controls,
        horizontal_overflow=bool(overflow),
        overflowing_elements=overflowing_elements if overflow else [],
        axe_violations=violations,
        focused_element=str(focus["label"]),
        focus_indicator_visible=bool(focus["visible"]),
        keyboard_expected_elements=int(keyboard["expected"]),
        keyboard_reachable_elements=int(keyboard["reached"]),
        keyboard_unreachable_elements=keyboard["unreachable"],
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


def inspect_reflow_routes(
    context: BrowserContext,
    *,
    base_url: str,
    axe_source: str,
    routes: list[str],
    degraded: bool,
) -> tuple[dict[str, bool], dict[str, dict[str, Any]]]:
    local_https_bridge_requests = configure_local_https_bridge(context, base_url)
    mocked_api_requests = configure_degraded_api(context) if degraded else []
    page, console_errors = prepare_page(context, axe_source)
    results: dict[str, bool] = {}
    route_console: dict[str, dict[str, Any]] = {}
    for route in routes:
        console_errors.clear()
        mocked_api_requests.clear()
        local_https_bridge_requests.clear()
        page.goto(f"{base_url}{route}", wait_until="networkidle")
        results[route] = (
            urlsplit(page.url).path == route
            and not page.locator("body").evaluate(
                "el => el.scrollWidth > el.clientWidth + 1"
            )
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
    return results, route_console


def zoom_reflow_check(
    browser: Browser,
    base_url: str,
    axe_source: str,
    *,
    authenticated: bool,
    student_storage_state: dict[str, Any] | None = None,
    admin_storage_state: dict[str, Any] | None = None,
) -> dict[str, Any]:
    profiles = {
        "200_percent": {
            "viewport": {"width": 720, "height": 450},
            "emulated_display": "1440x900 at 200% zoom",
        },
        "400_percent": {
            "viewport": {"width": 360, "height": 225},
            "emulated_display": "1440x900 at 400% zoom",
        },
    }
    profile_results: dict[str, dict[str, Any]] = {}
    for profile_name, profile in profiles.items():
        routes: dict[str, bool] = {}
        route_console: dict[str, dict[str, Any]] = {}
        public_context = browser.new_context(viewport=profile["viewport"])
        public_results, public_console = inspect_reflow_routes(
            public_context,
            base_url=base_url,
            axe_source=axe_source,
            routes=PUBLIC_REFLOW_ROUTES,
            degraded=True,
        )
        routes.update({f"public:{key}": value for key, value in public_results.items()})
        route_console.update(
            {f"public:{key}": value for key, value in public_console.items()}
        )
        public_context.close()

        if authenticated:
            student_context = browser.new_context(
                viewport=profile["viewport"], storage_state=student_storage_state
            )
            configure_local_https_bridge(student_context, base_url)
            student_results, student_console = inspect_reflow_routes(
                student_context,
                base_url=base_url,
                axe_source=axe_source,
                routes=STUDENT_ROUTES,
                degraded=False,
            )
            routes.update({f"student:{key}": value for key, value in student_results.items()})
            route_console.update(
                {f"student:{key}": value for key, value in student_console.items()}
            )
            student_context.close()

            admin_context = browser.new_context(
                viewport=profile["viewport"], storage_state=admin_storage_state
            )
            configure_local_https_bridge(admin_context, base_url)
            admin_results, admin_console = inspect_reflow_routes(
                admin_context,
                base_url=base_url,
                axe_source=axe_source,
                routes=ADMIN_ROUTES,
                degraded=False,
            )
            routes.update({f"admin:{key}": value for key, value in admin_results.items()})
            route_console.update(
                {f"admin:{key}": value for key, value in admin_console.items()}
            )
            admin_context.close()

        profile_results[profile_name] = {
            "emulated_display": profile["emulated_display"],
            "routes": routes,
            "console": route_console,
            "passed": all(routes.values())
            and all(
                not item["unexpected_console_errors"]
                for item in route_console.values()
            ),
        }
    return {
        "profiles": profile_results,
        "passed": all(result["passed"] for result in profile_results.values()),
    }


def forced_colors_check(
    browser: Browser,
    base_url: str,
    axe_source: str,
    browser_name: str,
    *,
    authenticated: bool,
) -> dict[str, Any]:
    context = browser.new_context(
        viewport={"width": 1440, "height": 900}, forced_colors="active"
    )
    local_https_bridge_requests = configure_local_https_bridge(context, base_url)
    mocked_api_requests = configure_degraded_api(context)
    page, console_errors = prepare_page(context, axe_source)
    routes: dict[str, dict[str, Any]] = {}
    for route in ("/",):
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
    if authenticated:
        for area, sign_in_route, button_name, destination_prefix, route in (
            ("student", "/sign-in", "Use demo student account", "/dashboard", "/dashboard"),
            ("admin", "/admin/sign-in", "Use demo T&P account", "/admin/", "/admin/operations"),
        ):
            protected_context = browser.new_context(
                viewport={"width": 1440, "height": 900}, forced_colors="active"
            )
            configure_local_https_bridge(protected_context, base_url)
            authenticate_demo(
                protected_context,
                base_url=base_url,
                sign_in_route=sign_in_route,
                button_name=button_name,
                destination_prefix=destination_prefix,
            )
            protected_page, protected_errors = prepare_page(protected_context, axe_source)
            protected_page.goto(f"{base_url}{route}", wait_until="networkidle")
            keyboard_mode = prepare_keyboard_environment(protected_page, browser_name)
            protected_page.keyboard.press("Tab")
            result = protected_page.evaluate(
                """
                () => ({
                  focusVisible: document.activeElement instanceof HTMLElement &&
                    (getComputedStyle(document.activeElement).outlineStyle !== "none" ||
                     getComputedStyle(document.activeElement).boxShadow !== "none"),
                  overflow: document.body.scrollWidth > document.body.clientWidth + 1,
                })
                """
            )
            result["keyboardMode"] = keyboard_mode
            result["unexpectedConsoleErrors"] = protected_errors
            result["mockedApiRequests"] = 0
            result["localHttpsBridgeRequests"] = 0
            result["expectedDegradedConsoleErrors"] = 0
            routes[f"{area}:{route}"] = result
            protected_context.close()
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
    parsed_base_url = urlsplit(base_url)
    if (
        parsed_base_url.scheme == "http"
        and parsed_base_url.hostname in {"127.0.0.1", "localhost"}
    ):
        # Exercise the application from a secure loopback origin. This mirrors
        # production cookie semantics in every engine while the test-only
        # bridge below serves the local HTTP development processes.
        base_url = parsed_base_url._replace(scheme="https").geturl()
    axe_path = Path("node_modules/axe-core/axe.min.js")
    if not axe_path.is_file():
        raise RuntimeError("Run npm ci before the browser accessibility matrix.")
    axe_source = axe_path.read_text(encoding="utf-8")
    screenshot_directory = Path(args.screenshot_directory)
    screenshot_directory.mkdir(parents=True, exist_ok=True)
    page_checks: list[PageCheck] = []
    browser_results: dict[str, dict[str, Any]] = {}
    browser_names = args.browsers or list(BROWSERS)
    authenticated = bool(args.authenticated)

    with sync_playwright() as playwright:
        for browser_name in browser_names:
            browser_type = getattr(playwright, browser_name)
            browser = browser_type.launch(headless=True)
            student_storage_state: dict[str, Any] | None = None
            admin_storage_state: dict[str, Any] | None = None
            if authenticated:
                # Authenticate once per engine and reuse the in-memory cookie
                # state across viewports. This tests a real session without
                # turning the accessibility matrix into an auth-rate-limit
                # load test or persisting session material to disk.
                student_seed_context = browser.new_context()
                configure_local_https_bridge(student_seed_context, base_url)
                authenticate_demo(
                    student_seed_context,
                    base_url=base_url,
                    sign_in_route="/sign-in",
                    button_name="Use demo student account",
                    destination_prefix="/dashboard",
                )
                student_storage_state = student_seed_context.storage_state()
                student_seed_context.close()

                admin_seed_context = browser.new_context()
                configure_local_https_bridge(admin_seed_context, base_url)
                authenticate_demo(
                    admin_seed_context,
                    base_url=base_url,
                    sign_in_route="/admin/sign-in",
                    button_name="Use demo T&P account",
                    destination_prefix="/admin/",
                )
                admin_storage_state = admin_seed_context.storage_state()
                admin_seed_context.close()
            for viewport_name, viewport in VIEWPORTS.items():
                context = browser.new_context(viewport=viewport)
                local_https_bridge_requests = configure_local_https_bridge(
                    context, base_url
                )
                mocked_api_requests = configure_degraded_api(context)
                page, errors = prepare_page(context, axe_source)
                for route in PUBLIC_ROUTES:
                    page_checks.append(
                        inspect_page(
                            page,
                            base_url=base_url,
                            route=route,
                            area="public-degraded",
                            browser_name=browser_name,
                            viewport_name=viewport_name,
                            screenshot_directory=screenshot_directory,
                            console_errors=errors,
                            mocked_api_requests=mocked_api_requests,
                            local_https_bridge_requests=local_https_bridge_requests,
                        )
                    )
                context.close()

                if authenticated:
                    student_context = browser.new_context(
                        viewport=viewport, storage_state=student_storage_state
                    )
                    student_bridge_requests = configure_local_https_bridge(
                        student_context, base_url
                    )
                    student_page, student_errors = prepare_page(
                        student_context, axe_source
                    )
                    for route in STUDENT_ROUTES:
                        page_checks.append(
                            inspect_page(
                                student_page,
                                base_url=base_url,
                                route=route,
                                area="student-authenticated",
                                browser_name=browser_name,
                                viewport_name=viewport_name,
                                screenshot_directory=screenshot_directory,
                                console_errors=student_errors,
                                mocked_api_requests=[],
                                local_https_bridge_requests=student_bridge_requests,
                            )
                        )
                    student_context.close()

                    admin_context = browser.new_context(
                        viewport=viewport, storage_state=admin_storage_state
                    )
                    admin_bridge_requests = configure_local_https_bridge(
                        admin_context, base_url
                    )
                    admin_page, admin_errors = prepare_page(admin_context, axe_source)
                    for route in ADMIN_ROUTES:
                        page_checks.append(
                            inspect_page(
                                admin_page,
                                base_url=base_url,
                                route=route,
                                area="admin-authenticated",
                                browser_name=browser_name,
                                viewport_name=viewport_name,
                                screenshot_directory=screenshot_directory,
                                console_errors=admin_errors,
                                mocked_api_requests=[],
                                local_https_bridge_requests=admin_bridge_requests,
                            )
                        )
                    admin_context.close()
            browser_results[browser_name] = {
                "reduced_motion": reduced_motion_check(browser, base_url, axe_source),
                "zoom_reflow": zoom_reflow_check(
                    browser,
                    base_url,
                    axe_source,
                    authenticated=authenticated,
                    student_storage_state=student_storage_state,
                    admin_storage_state=admin_storage_state,
                ),
                "forced_colors": forced_colors_check(
                    browser,
                    base_url,
                    axe_source,
                    browser_name,
                    authenticated=authenticated,
                ),
            }
            browser.close()

    payload = {
        "recorded_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "engines": [f"{name}-headless" for name in browser_names],
        "coverage_mode": (
            "public-degraded-and-demo-authenticated"
            if authenticated
            else "public-degraded"
        ),
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
    parser.add_argument("--output", default=".data/accessibility-matrix-phase8.json")
    parser.add_argument("--screenshot-directory", default=".data/accessibility-phase8")
    parser.add_argument(
        "--authenticated",
        action="store_true",
        help="Also authenticate through the local demo controls and exercise protected routes.",
    )
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
            "coverage_mode": result["coverage_mode"],
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

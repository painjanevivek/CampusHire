from __future__ import annotations

import argparse
import json
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright


@dataclass(frozen=True)
class RouteBudget:
    area: str
    route: str
    javascript_kib: int


@dataclass(frozen=True)
class RouteMeasurement:
    area: str
    route: str
    final_path: str
    lcp_ms: float
    cls: float
    interaction_latency_ms: float
    ttfb_ms: float
    javascript_kib: float
    request_count: int
    console_errors: list[str]
    passed: bool


BUDGETS = (
    RouteBudget("public", "/", 300),
    RouteBudget("student", "/dashboard", 500),
    RouteBudget("student", "/opportunities", 550),
    RouteBudget("student", "/resume", 550),
    RouteBudget("student", "/resume/builder", 550),
    RouteBudget("admin", "/admin/applications", 600),
    RouteBudget("admin", "/admin/drives", 600),
)

METRICS_INIT = """
(() => {
  window.__campusHireLabMetrics = { lcp: 0, cls: 0, interaction: 0 };
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) window.__campusHireLabMetrics.lcp = last.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__campusHireLabMetrics.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__campusHireLabMetrics.interaction = Math.max(
          window.__campusHireLabMetrics.interaction,
          entry.duration || 0,
        );
      }
    }).observe({ type: "event", buffered: true, durationThreshold: 16 });
  } catch {}
})()
"""


def authenticate_demo(
    browser: Browser,
    *,
    base_url: str,
    sign_in_route: str,
    button_name: str,
    destination_prefix: str,
) -> dict[str, Any]:
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    page.goto(f"{base_url}{sign_in_route}", wait_until="networkidle", timeout=30_000)
    consent = page.get_by_role("button", name="Save essential-only preference", exact=True)
    if consent.count() and consent.is_visible():
        consent.click()
    page.get_by_role("button", name=button_name, exact=True).click()
    page.wait_for_url(
        lambda url: (
            urlsplit(url).path != sign_in_route
            and urlsplit(url).path.startswith(destination_prefix)
        ),
        timeout=30_000,
    )
    state = context.storage_state()
    context.close()
    return state


def measure_route(
    browser: Browser,
    *,
    base_url: str,
    budget: RouteBudget,
    storage_state: dict[str, Any] | None,
) -> RouteMeasurement:
    context: BrowserContext = browser.new_context(
        viewport={"width": 1440, "height": 900},
        storage_state=storage_state,
    )
    page: Page = context.new_page()
    page.add_init_script(METRICS_INIT)
    console_errors: list[str] = []
    page.on(
        "console",
        lambda message: console_errors.append(message.text)
        if message.type == "error"
        else None,
    )
    response = page.goto(
        f"{base_url}{budget.route}", wait_until="networkidle", timeout=30_000
    )
    page.wait_for_timeout(1_500)
    page.locator("body").click(position={"x": 4, "y": 4})
    page.wait_for_timeout(250)
    result = page.evaluate(
        """
        () => {
          const navigation = performance.getEntriesByType("navigation")[0];
          const resources = performance.getEntriesByType("resource");
          const scripts = resources.filter((entry) => entry.initiatorType === "script");
          return {
            metrics: window.__campusHireLabMetrics,
            ttfb: navigation ? navigation.responseStart - navigation.requestStart : 0,
            javascriptBytes: scripts.reduce(
              (total, entry) => total + (entry.encodedBodySize || entry.transferSize || 0),
              0,
            ),
            requestCount: resources.length + (navigation ? 1 : 0),
          };
        }
        """
    )
    final_path = urlsplit(page.url).path
    metrics = result["metrics"]
    javascript_kib = result["javascriptBytes"] / 1024
    passed = (
        response is not None
        and response.ok
        and final_path == budget.route
        and float(metrics["lcp"]) <= 2_500
        and float(metrics["cls"]) < 0.1
        and float(metrics["interaction"]) <= 200
        and javascript_kib <= budget.javascript_kib
        and not console_errors
    )
    measurement = RouteMeasurement(
        area=budget.area,
        route=budget.route,
        final_path=final_path,
        lcp_ms=round(float(metrics["lcp"]), 2),
        cls=round(float(metrics["cls"]), 4),
        interaction_latency_ms=round(float(metrics["interaction"]), 2),
        ttfb_ms=round(float(result["ttfb"]), 2),
        javascript_kib=round(javascript_kib, 2),
        request_count=int(result["requestCount"]),
        console_errors=console_errors,
        passed=passed,
    )
    context.close()
    return measurement


def run(args: argparse.Namespace) -> dict[str, Any]:
    base_url = args.base_url.rstrip("/")
    measurements: list[RouteMeasurement] = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        student_state = authenticate_demo(
            browser,
            base_url=base_url,
            sign_in_route="/sign-in",
            button_name="Use demo student account",
            destination_prefix="/dashboard",
        )
        admin_state = authenticate_demo(
            browser,
            base_url=base_url,
            sign_in_route="/admin/sign-in",
            button_name="Use demo T&P account",
            destination_prefix="/admin/",
        )
        states = {"public": None, "student": student_state, "admin": admin_state}
        for budget in BUDGETS:
            measurements.append(
                measure_route(
                    browser,
                    base_url=base_url,
                    budget=budget,
                    storage_state=states[budget.area],
                )
            )
        browser.close()
    return {
        "recorded_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "profile": "local production build, Chromium, 1440x900, loopback network",
        "limitations": (
            "Repeatable local lab evidence only; not field Core Web Vitals, production SLO, "
            "mobile-device, or constrained-network evidence."
        ),
        "thresholds": {
            "lcp_ms": 2_500,
            "cls": 0.1,
            "interaction_latency_ms": 200,
            "javascript_kib": {item.route: item.javascript_kib for item in BUDGETS},
        },
        "measurements": [asdict(item) for item in measurements],
        "passed": all(item.passed for item in measurements),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Measure the bounded CampusHire Phase 8 local performance profile."
    )
    parser.add_argument("--base-url", default="http://127.0.0.1:3199")
    parser.add_argument("--output", default=".data/performance-matrix-phase8.json")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result = run(args)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "recorded_at_utc": result["recorded_at_utc"],
                "profile": result["profile"],
                "routes": len(result["measurements"]),
                "passed": result["passed"],
                "output": str(output),
            },
            indent=2,
        )
    )
    if not result["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

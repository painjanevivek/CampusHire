"""Measure real, authenticated warm navigation; retain failures as evidence."""
import argparse
import json
import math
import platform
import re
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

from performance_matrix import authenticate_demo


def resources(page):
    return page.evaluate("""() => {
        const entries = performance.getEntriesByType('resource');
        return {request_count: entries.length,
            transferred_javascript_bytes: entries.filter(r => new URL(r.name).pathname.endsWith('.js')).reduce((sum,r) => sum + r.transferSize, 0),
            resources: entries.map(r => ({path: new URL(r.name).pathname, duration_ms:r.duration, transferred_bytes:r.transferSize}))};
    }""")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:3001")
    parser.add_argument("--output", default=".data/navigation-performance.json")
    parser.add_argument("--samples", type=int, default=30)
    args = parser.parse_args()
    result = {"recorded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
              "profile": "production build, loopback, no throttling", "host": platform.platform(), "processor": platform.processor(),
              "samples": args.samples, "measurements": [], "errors": [], "passed": False}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        result["browser"] = browser.version
        try:
            for role, entry, destination, button, pairs in [
                ("student", "/sign-in", "/dashboard", "Use demo student account",
                 [("/dashboard", "/opportunities"), ("/opportunities", "/applications")]),
                ("admin", "/admin/sign-in", "/admin/", "Use demo T&P account",
                 [("/admin/applications", "/admin/drives")]),
            ]:
                state = authenticate_demo(browser, base_url=args.base_url,
                                          sign_in_route=entry, button_name=button,
                                          destination_prefix=destination)
                context = browser.new_context(viewport={"width": 1440, "height": 900},
                                              storage_state=state)
                page = context.new_page()
                for source, target in pairs:
                    page.goto(args.base_url + source, wait_until="networkidle")
                    timings = []
                    resource_samples = []
                    for i in range(args.samples + 2):
                        path = target if i % 2 == 0 else source
                        page.evaluate("performance.clearResourceTimings()")
                        link = page.locator(f'nav a[href="{path}"]').first
                        start = time.perf_counter()
                        link.click()
                        page.wait_for_url("**" + path)
                        page.locator('main[data-navigation-ready="true"]').wait_for()
                        elapsed = (time.perf_counter() - start) * 1000
                        if i >= 2:
                            timings.append(round(elapsed, 2))
                        page.wait_for_load_state("networkidle")
                        if i >= 2: resource_samples.append(resources(page))
                    p95 = sorted(timings)[math.ceil(len(timings) * .95) - 1]
                    result["measurements"].append({"role": role, "source": source, "target": target,
                        "durations_ms": timings, "p95_ms": p95, "passed": p95 <= 500,
                        "resource_samples": resource_samples,
                        "viewport": page.evaluate("({width: innerWidth, height: innerHeight})"),
                        "last_transition_resources": page.evaluate("performance.getEntriesByType('resource').map(r => ({name: new URL(r.name).pathname, duration_ms:r.duration, bytes:r.transferSize}))")})
                if role == "admin":
                    page.goto(args.base_url + "/admin/applications", wait_until="networkidle")
                    candidates = page.locator('[aria-label="Candidate queue"] button[aria-pressed]')
                    if candidates.count() < 2:
                        raise RuntimeError("Candidate-selection measurement requires two synthetic applications.")
                    durations = []
                    resource_samples = []
                    for i in range(args.samples + 2):
                        selected_id = candidates.nth(i % 2).get_attribute("data-application-id")
                        page.evaluate("performance.clearResourceTimings()")
                        start = time.perf_counter()
                        candidates.nth(i % 2).click()
                        page.locator(f'[data-selected-application="{selected_id}"]').wait_for()
                        page.locator('main[data-navigation-ready="true"]').wait_for()
                        page.locator('[aria-label="Candidate decision details"][aria-busy="true"]').wait_for(state="detached")
                        if i >= 2: durations.append(round((time.perf_counter()-start)*1000, 2))
                        page.wait_for_load_state("networkidle")
                        if i >= 2: resource_samples.append(resources(page))
                    value = sorted(durations)[math.ceil(len(durations)*.95)-1]
                    result["measurements"].append({"role":role,"source":"candidate queue","target":"candidate detail","durations_ms":durations,"resource_samples":resource_samples,"p95_ms":value,"passed":value<=500})
                    page.goto(args.base_url + "/admin/drives", wait_until="networkidle")
                    durations = []
                    resource_samples = []
                    for i in range(args.samples + 2):
                        page.evaluate("performance.clearResourceTimings()")
                        start = time.perf_counter()
                        page.get_by_role("button", name=re.compile(r"^Edit (drive|draft)$")).click()
                        page.get_by_label("Drive title", exact=True).wait_for()
                        if i >= 2: durations.append(round((time.perf_counter()-start)*1000, 2))
                        if i >= 2: resource_samples.append(resources(page))
                        page.get_by_role("button", name="Cancel", exact=True).first.click()
                    value = sorted(durations)[math.ceil(len(durations)*.95)-1]
                    result["measurements"].append({"role":role,"source":"drive","target":"edit drive","durations_ms":durations,"resource_samples":resource_samples,"p95_ms":value,"passed":value<=500})
                context.close()
            result["passed"] = all(m["passed"] for m in result["measurements"])
        except Exception as error:
            result["errors"].append(str(error))
        finally:
            browser.close()
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "passed": result["passed"], "errors": result["errors"]}))
    if not result["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

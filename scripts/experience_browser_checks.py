"""Local synthetic product checks. Never stores authentication state or credentials."""
import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright
from performance_matrix import authenticate_demo

VIEWPORTS = [(390, 844), (768, 1024), (1440, 900), (1920, 1080)]
ROUTES = {
    "public": ["/", "/privacy", "/sign-in", "/admin/sign-in"],
    "student": ["/dashboard", "/opportunities", "/applications", "/resume", "/roadmap", "/profile", "/preparation"],
    "admin": ["/admin/dashboard", "/admin/drives", "/admin/applications", "/admin/students", "/admin/policies", "/admin/operations", "/admin/audit", "/admin/reports"],
}


def run():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:3001")
    parser.add_argument("--output", default=".data/experience-browser")
    args = parser.parse_args()
    if urlsplit(args.base_url).hostname not in {"127.0.0.1", "localhost"}:
        raise RuntimeError("This runner is restricted to local synthetic sessions.")
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    result = {"checks": [], "errors": [], "passed": False}
    axe = Path("node_modules/axe-core/axe.min.js").read_text(encoding="utf-8")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        result["browser"] = browser.version
        try:
            states = {"public": None}
            for role, route, button, destination in [("student", "/sign-in", "Use demo student account", "/dashboard"), ("admin", "/admin/sign-in", "Use demo T&P account", "/admin/")]:
                states[role] = authenticate_demo(browser, base_url=args.base_url, sign_in_route=route, button_name=button, destination_prefix=destination)
            discovery = browser.new_context(storage_state=states["student"])
            discovery_page = discovery.new_page()
            discovery_page.goto(args.base_url + "/opportunities", wait_until="networkidle")
            links = discovery_page.locator('main a[href^="/opportunities/"]').evaluate_all("els => els.map(e => e.getAttribute('href'))")
            ids = list(dict.fromkeys(link.rsplit("/", 1)[1] for link in links if re.fullmatch(r"/opportunities/[a-f0-9-]{36}", link)))
            if len(ids) >= 2:
                ROUTES["student"].extend(["/opportunities/compare?roles=" + ",".join(ids[:2]), "/preparation?role=" + ids[0]])
            discovery_page.goto(args.base_url + "/applications", wait_until="networkidle")
            application = discovery_page.locator('main a[href^="/applications/"]').first.get_attribute("href")
            if application:
                ROUTES["student"].append(application)
                ROUTES["admin"].append("/admin/applications?selected=" + application.rsplit("/",1)[1])
            discovery.close()
            for role, routes in ROUTES.items():
                for width, height in VIEWPORTS:
                    context = browser.new_context(viewport={"width": width, "height": height}, storage_state=states[role], reduced_motion="reduce")
                    page = context.new_page()
                    page.add_init_script(axe)
                    for route in routes:
                        errors = []
                        def record(error): errors.append(str(error))
                        page.on("pageerror", record)
                        page.goto(args.base_url + route, wait_until="networkidle")
                        consent = page.get_by_role("button", name="Save essential-only preference", exact=True)
                        if consent.count() and consent.is_visible(): consent.click()
                        page.locator('main [aria-busy="true"]').wait_for(state="detached", timeout=20000)
                        page.locator("main h1").wait_for()
                        filename = urlsplit(route).path.strip("/").replace("/", "-") or "landing"
                        if "?" in route: filename += "-detail"
                        page.screenshot(path=str(output / filename) + f"-{width}.png", full_page=True)
                        geometry = page.evaluate("""() => ({width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth+1, offenders:[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect();return r.width && (r.right>innerWidth+1 || r.left < -1) && getComputedStyle(e).position!=='fixed'}).slice(0,12).map(e=>({tag:e.tagName,class:e.className,text:(e.textContent||'').slice(0,80)}))})""")
                        violations = page.evaluate("async () => (await axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}))")
                        correct_route = urlsplit(page.url).path == urlsplit(route).path
                        result["checks"].append({"role":role,"route":route,"viewport":geometry,"page_errors":errors,"axe_violations":violations,"passed":correct_route and not geometry["overflow"] and not errors and not violations})
                        page.remove_listener("pageerror", record)
                    context.close()
            result["passed"] = all(item["passed"] for item in result["checks"])
        except Exception as error:
            result["errors"].append(str(error))
        finally:
            browser.close()
    (output / "results.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"checks":len(result["checks"]),"passed":result["passed"],"errors":result["errors"],"failed":[{"route":x["route"],"width":x["viewport"]["width"],"overflow":x["viewport"]["overflow"],"axe":[v["id"] for v in x["axe_violations"]],"errors":x["page_errors"]} for x in result["checks"] if not x["passed"]]}))
    if not result["passed"]: raise SystemExit(1)


if __name__ == "__main__": run()

"""Exercise actual local synthetic workflows and capture product evidence, without secrets."""
import json
import time
from pathlib import Path

from playwright.sync_api import sync_playwright, expect
from performance_matrix import authenticate_demo

BASE = "http://127.0.0.1:3001"


def run():
    output = Path(".data/experience-workflows")
    output.mkdir(parents=True, exist_ok=True)
    images = Path("public/product-evidence")
    images.mkdir(parents=True, exist_ok=True)
    result = {"checks": [], "passed": False, "errors": [], "data": "Local synthetic demo accounts only"}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        result["browser"] = browser.version
        try:
            pages = {}
            for role, route, button, destination in [("student", "/sign-in", "Use demo student account", "/dashboard"), ("admin", "/admin/sign-in", "Use demo T&P account", "/admin/")]:
                state = authenticate_demo(browser, base_url=BASE, sign_in_route=route, button_name=button, destination_prefix=destination)
                context = browser.new_context(storage_state=state, viewport={"width":1440,"height":900}, reduced_motion="reduce")
                pages[role] = context.new_page()
            admin, student = pages["admin"], pages["student"]
            admin.goto(BASE + "/admin/applications", wait_until="networkidle")
            candidates = admin.locator('[data-application-id]')
            assert candidates.count() >= 2, "Need two synthetic applications"
            first, second = [candidates.nth(i).get_attribute("data-application-id") for i in range(2)]
            candidates.nth(0).click()
            admin.locator(f'[data-selected-application="{first}"]').wait_for()
            candidates.nth(1).click()
            admin.locator(f'[data-selected-application="{second}"]').wait_for()
            admin.go_back(wait_until="networkidle")
            admin.locator(f'[data-selected-application="{first}"]').wait_for()
            result["checks"].append("Consecutive candidate selection and browser Back restore the selected record")
            requests = admin.get_by_role("region", name="Information requests", exact=True)
            requests.get_by_text("Request additional information", exact=True).click()
            instructions = "Synthetic workflow: explain the tests you contributed to your project. " + str(int(time.time()))
            requests.get_by_label("What does the student need to provide?").fill(instructions)
            requests.get_by_role("button", name="Send information request", exact=True).click()
            expect(requests.get_by_text(instructions, exact=True).first).to_be_visible()
            admin.evaluate("window.scrollTo(0,0)")
            admin.screenshot(path=str(images / "placement-review.png"))
            student.goto(BASE + "/dashboard", wait_until="networkidle")
            student.locator('main[data-navigation-ready="true"]').wait_for()
            student.screenshot(path=str(images / "student-priorities.png"))
            # Follow the actual dashboard action, not a test-only route.
            action = student.locator(f'main a[href^="/applications/{first}"]').first
            action.click()
            student.wait_for_url("**/applications/" + first + "**")
            article = student.locator("article").filter(has=student.get_by_text(instructions, exact=True)).last
            article.get_by_label("Your response", exact=True).fill("I wrote API boundary tests and documented the repeatable results.")
            article.get_by_role("button", name="Send response for review", exact=True).click()
            expect(article.get_by_text("awaiting review", exact=True)).to_be_visible()
            student.screenshot(path=str(output / "student-response.png"), full_page=True)
            result["checks"].append("Student follows dashboard action and sends supplemental response")
            admin.reload(wait_until="networkidle")
            article = admin.locator("article").filter(has=admin.get_by_text(instructions, exact=True)).last
            article.get_by_label("Review explanation", exact=True).fill("Reviewed the supplied test evidence; no original application details were replaced.")
            article.get_by_label("Request action", exact=False).select_option("resolve")
            article.get_by_role("button", name="Save request decision", exact=True).click()
            expect(article.get_by_text("resolved", exact=True)).to_be_visible()
            result["checks"].append("Officer reviews and resolves the response without changing application status")
            student.goto(BASE + "/opportunities", wait_until="networkidle")
            boxes = student.get_by_role("checkbox", name="Compare", exact=False)
            boxes.nth(0).check()
            boxes.nth(1).check()
            student.get_by_role("link", name="Compare selected roles", exact=True).click()
            student.wait_for_url("**/opportunities/compare?**")
            expect(student.get_by_role("heading", level=1)).to_be_visible()
            student.screenshot(path=str(output / "comparison.png"), full_page=True)
            role_id = student.url.split("roles=")[1].split(",")[0]
            student.goto(BASE + "/preparation?role=" + role_id, wait_until="networkidle")
            expect(student.get_by_role("heading", name="Requirements and your evidence", exact=True)).to_be_visible()
            student.screenshot(path=str(output / "preparation.png"), full_page=True)
            result["checks"].append("Student compares two roles and reads opportunity-specific preparation without AI generation")
            result["passed"] = True
        except Exception as error:
            result["errors"].append(str(error))
        finally:
            browser.close()
    (output / "results.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result))
    if not result["passed"]: raise SystemExit(1)


if __name__ == "__main__": run()

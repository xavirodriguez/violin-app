from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    page.goto("http://localhost:3000")
    page.wait_for_timeout(2000)

    # Bypassing onboarding if present
    page.evaluate("localStorage.setItem('onboarding-completed', 'true')")
    page.reload()
    page.wait_for_timeout(1000)

    # Go to Dashboard
    page.get_by_role("tab", name="Dashboard").click()
    page.wait_for_timeout(1000)

    # Check if Export CSV button is present and clickable
    export_btn = page.get_by_role("button", name="Export CSV")
    if export_btn.is_visible():
        print("Export CSV button is visible")
        # Just hover to show it's active
        export_btn.hover()
        page.wait_for_timeout(500)

    # Go to Practice
    page.get_by_role("tab", name="Practice").click()
    page.wait_for_timeout(1000)

    # Select an exercise if possible
    first_exercise = page.get_by_text("First Scale").first
    if first_exercise.is_visible():
        first_exercise.click()
        page.wait_for_timeout(1000)

    page.screenshot(path="verification/screenshots/dashboard_and_practice.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()

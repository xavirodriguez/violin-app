from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    page.goto("http://localhost:3000")
    page.wait_for_timeout(5000)

    # Skip setup
    skip_btn = page.get_by_text("Skip setup")
    if skip_btn.is_visible():
        skip_btn.click()
        page.wait_for_timeout(2000)

    # Go to practice tab
    practice_tab = page.get_by_role("tab", name="Practice")
    if practice_tab.is_visible():
        practice_tab.click()
        page.wait_for_timeout(2000)

    # Take screenshot of the main page
    page.screenshot(path="verification/screenshots/practice_tab.png")

    # Select an exercise
    first_exercise = page.locator(".grid > div").first
    if first_exercise.is_visible():
        first_exercise.click()
        page.wait_for_timeout(2000)
        page.screenshot(path="verification/screenshots/preview_modal.png")

        # Start practice
        start_btn = page.get_by_role("button", name="Start Practice")
        if start_btn.is_visible():
            start_btn.click()
            page.wait_for_timeout(5000)
            page.screenshot(path="verification/screenshots/practice_session.png")

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

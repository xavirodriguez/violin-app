from playwright.sync_api import sync_playwright
import time

def run_cuj(page):
    # Wait for dev server to be ready
    for i in range(15):
        try:
            page.goto("http://localhost:3000")
            break
        except Exception:
            time.sleep(2)

    page.wait_for_timeout(3000)

    # Skip onboarding if present
    skip_button = page.get_by_role("button", name="Skip setup")
    if skip_button.is_visible():
        skip_button.click()
        page.wait_for_timeout(1000)

    # 1. Verify Analytics Dashboard
    page.get_by_role("tab", name="Dashboard").click()
    page.wait_for_timeout(2000)

    # Scroll down to ensure Heatmap is visible if it renders
    page.mouse.wheel(0, 1000)
    page.wait_for_timeout(1000)

    # Check for heatmap title
    heatmap_title = page.get_by_text("Exercise Accuracy Heatmap")
    if heatmap_title.is_visible():
        print("Heatmap title found")

    page.screenshot(path="verification/screenshots/analytics_dashboard_full.png", full_page=True)
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

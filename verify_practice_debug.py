from playwright.sync_api import Page, expect, sync_playwright
import time
import os

def verify_practice_mode(page: Page):
    # 1. Go to the app
    page.goto("http://localhost:3000")

    # 2. Switch to Practice tab
    page.get_by_role("tab", name="Practice").click()

    # 3. Wait for content to load
    expect(page.get_by_text("Open G String")).to_be_visible(timeout=10000)

    # 4. Start practice
    page.get_by_role("button", name="Start Practice").click()

    # 5. Wait for it to start (listening mode)
    try:
        expect(page.get_by_text("Play G3")).to_be_visible(timeout=10000)
    except Exception as e:
        print(f"Error waiting for Play G3: {e}")

    # 6. Take a screenshot anyway
    os.makedirs("verification", exist_ok=True)
    page.screenshot(path="verification/practice_debug.png")
    print("Saved verification/practice_debug.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=[
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
        ])
        # Grant microphone permission
        context = browser.new_context(permissions=['microphone'])
        page = context.new_page()
        try:
            # Wait for server to be up
            max_retries = 30
            for i in range(max_retries):
                try:
                    page.goto("http://localhost:3000")
                    break
                except:
                    if i == max_retries - 1:
                        raise
                    time.sleep(1)

            verify_practice_mode(page)
        finally:
            browser.close()

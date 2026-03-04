from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Emulate a typical desktop screen
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # We need to serve the files locally. Let's start a quick python server
        server_port = 8081
        import subprocess
        server_process = subprocess.Popen(["python3", "-m", "http.server", str(server_port)])

        try:
            time.sleep(1) # wait for server to start
            page.goto(f"http://localhost:{server_port}/novo-site.html")

            # Wait for content to load
            page.wait_for_selector('.hero')

            # Take screenshot of the top
            page.screenshot(path="verification/novo-site-top.png", full_page=False)

            # Scroll down to trigger animations and take a full page screenshot
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(1) # wait for animations
            page.screenshot(path="verification/novo-site-full.png", full_page=True)

            # Emulate mobile screen
            mobile_context = browser.new_context(viewport={'width': 375, 'height': 667})
            mobile_page = mobile_context.new_page()
            mobile_page.goto(f"http://localhost:{server_port}/novo-site.html")
            mobile_page.wait_for_selector('.hamburger')
            mobile_page.screenshot(path="verification/novo-site-mobile.png")

            # Click hamburger menu
            mobile_page.click('.hamburger')
            time.sleep(0.5)
            mobile_page.screenshot(path="verification/novo-site-mobile-menu.png")

        finally:
            server_process.terminate()
            browser.close()

if __name__ == "__main__":
    run()

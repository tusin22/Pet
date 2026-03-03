from playwright.sync_api import sync_playwright

def verify_login_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the HTML file directly
        import os
        filepath = "file://" + os.path.abspath("painel-94k2.html")
        page.goto(filepath)

        # Wait for the login screen to be visible
        page.wait_for_selector("#login-screen", state="visible")

        # Ensure main panel is hidden
        main_panel = page.locator("#main-panel")
        assert not main_panel.is_visible(), "Main panel should be hidden initially"

        # Check login container styling/elements
        login_container = page.locator("#login-container")
        assert login_container.is_visible(), "Login container should be visible"

        # Take a screenshot
        page.screenshot(path="verification/login_screen.png")

        browser.close()

if __name__ == "__main__":
    verify_login_ui()
    print("Verification script executed successfully.")

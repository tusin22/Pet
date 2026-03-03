from playwright.sync_api import sync_playwright
import os

def test_admin_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        filepath = f"file://{os.path.abspath('painel-94k2.html')}"

        # Bypass password prompt
        page.on("dialog", lambda dialog: dialog.accept("admin123"))
        page.goto(filepath)

        # Wait for page load
        page.wait_for_selector('h1')

        # Go to Config tab
        page.click('button:has-text("Configurações")')

        # Click on Tabela de Preços to expand
        page.click('h2:has-text("Tabela de Preços")')
        page.wait_for_timeout(1000)

        # Take screenshot of config
        page.screenshot(path="verification/admin_config.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    test_admin_page()

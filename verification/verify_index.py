from playwright.sync_api import sync_playwright
import os

def test_index_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        filepath = f"file://{os.path.abspath('index.html')}"
        page.goto(filepath)

        # Login
        page.fill('#loginName', 'Test User')
        page.fill('#loginPhone', '11999999999')
        page.click('button[type="submit"]')

        # Click Agendar Serviços
        page.wait_for_selector('#btn-agendar')
        page.click('#btn-agendar')

        # Wait for schedule screen
        page.wait_for_selector('#schedule-screen.active')

        # Take screenshot 1: initial state
        page.screenshot(path="verification/index_initial.png", full_page=True)

        # Select pet size
        page.select_option('#petSize', 'M')

        # Wait for price update
        page.wait_for_timeout(2000)

        # Take screenshot 2: size selected
        page.screenshot(path="verification/index_size_selected.png", full_page=True)

        # Select Tosa
        page.click('label[for="srv-Tosa"]')

        # Wait for price update
        page.wait_for_timeout(2000)

        # Take screenshot 3: combo
        page.screenshot(path="verification/index_combo.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    test_index_page()

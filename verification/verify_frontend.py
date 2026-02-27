
from playwright.sync_api import sync_playwright
import time
import os

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Verify Admin Panel Changes
        print("Verifying Admin Panel...")
        # We need to simulate the prompt interaction for the admin password
        page.on("dialog", lambda dialog: dialog.accept("admin123"))

        # Open Admin Panel
        # Using absolute path for safety in this environment
        page.goto("file:///app/painel-94k2.html")

        # Wait for tabs to appear
        page.wait_for_selector(".tab-btn")

        # Click on "Configurações" tab
        page.click("button[onclick=\"switchTab('config')\"]")

        # Expand "Tabela de Preços" card
        # The card starts collapsed. We need to find the header and click it.
        # It's the second card in the config tab usually, but let's find by text
        page.click("div.settings-header:has-text('Tabela de Preços')")

        # Wait for animation/expansion
        time.sleep(1)

        # Verify the new inputs exist (P, M, G, Discount)
        # We check for the first service row inputs
        try:
            page.wait_for_selector("#price-p-0", timeout=5000)
            page.wait_for_selector("#price-m-0")
            page.wait_for_selector("#price-g-0")
            page.wait_for_selector("#price-disc-0")
            print("Admin Panel inputs verified.")
        except Exception as e:
            print(f"Failed to find new price inputs: {e}")

        # Verify "Acréscimo de Preço por Porte" is GONE
        # We check if the ID 'price-size-P' which was used for global increment is absent
        # Note: 'price-size-P' was the old ID. The new per-service inputs are 'price-p-X'.
        # However, checking for the old text header "Acréscimo de Preço por Porte" is safer.
        content = page.content()
        if "Acréscimo de Preço por Porte" not in content:
            print("Global size increment section is correctly removed.")
        else:
            print("WARNING: Global size increment section might still be present.")

        # Take screenshot of Admin Config
        page.screenshot(path="verification/admin_config_check.png")


        # 2. Verify Client App Changes (Logic Simulation)
        print("Verifying Client App...")
        page.goto("file:///app/index.html")

        # Bypass login if needed or fill it
        # Login
        page.fill("#loginName", "Test User")
        page.fill("#loginPhone", "(11) 99999-9999")
        page.click("#login-form button[type='submit']")

        # Click Agendar
        page.click("#btn-agendar")

        # Select "Banho Master" (First checkbox usually)
        # We need to make sure we select one service
        # value="Banho Master"
        page.check("input[value='Banho Master']")

        # Select Size "P"
        page.select_option("#petSize", "P")

        # Wait for calculation text
        time.sleep(1)

        # Take screenshot of Client Schedule
        page.screenshot(path="verification/client_calc_check.png")

        browser.close()

if __name__ == "__main__":
    verify_frontend()

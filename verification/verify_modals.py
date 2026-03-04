from playwright.sync_api import sync_playwright
import time
import os

def test_custom_alert(page):
    print("Navigating...")
    page.goto("http://localhost:8080/index.html")

    # Reload with mock config to avoid any errors during page load and ensure functions are attached
    page.add_init_script("""
        window.__MELLUPET_CONFIG = {
            firebase: { apiKey: "fake", authDomain: "fake", projectId: "fake" }
        };
    """)
    page.reload()

    time.sleep(2) # Give it a bit more time

    # We evaluate to make sure it exists first
    is_func = page.evaluate("typeof window.showCustomAlert === 'function'")
    print(f"Is showCustomAlert a function? {is_func}")

    if is_func:
        page.evaluate("window.showCustomAlert('Agendamento realizado com sucesso!')")

        print("Waiting for modal...")
        page.wait_for_selector('#custom-modal-overlay', state='visible', timeout=5000)

        print("Taking screenshot 1...")
        page.screenshot(path="verification/custom_alert.png")

        print("Clicking OK...")
        page.click('#custom-modal-ok')

        print("Waiting for modal to hide...")
        page.wait_for_selector('#custom-modal-overlay', state='hidden', timeout=5000)

        print("Triggering confirm...")
        page.evaluate("window.showCustomConfirm('Tem certeza que deseja cancelar?', true)")

        print("Waiting for confirm modal...")
        page.wait_for_selector('#custom-modal-overlay', state='visible', timeout=5000)

        print("Taking screenshot 2...")
        page.screenshot(path="verification/custom_confirm.png")
        print("Done!")

if __name__ == "__main__":
    os.makedirs("verification", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_custom_alert(page)
        finally:
            browser.close()


from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Handle the prompt
        def handle_dialog(dialog):
            dialog.accept("admin123")

        page.on("dialog", handle_dialog)

        # Navigate
        page.goto("http://localhost:8080/painel-94k2.html")

        # Wait for page to load (checking for a known element)
        page.wait_for_selector("h1")

        # Inject a mock appointment into the modal to test rendering of Desembolo input
        mock_data = {
            "id": "test-id",
            "petName": "Rex",
            "ownerName": "João",
            "ownerPhone": "11999999999",
            "services": ["Banho", "Desembolo de nós"],
            "serviceType": "Banho, Desembolo de nós",
            "petSize": "M",
            "paymentMethod": "Pix",
            "totalValue": 80.00,
            "valorDesembolo": 0,
            "status": "Agendado",
            "appointmentTime": "2023-10-27T14:00",
            "observations": "Cuidado com a pata"
        }

        # Use page.evaluate to call the global function exposed in the module (if any)
        # Note: In the code, window.openModal IS defined and attached to window.
        page.evaluate("data => window.openModal(data)", mock_data)

        # Wait for modal content
        page.wait_for_selector("#appointment-modal.active")

        # Take screenshot
        page.screenshot(path="verification_desembolo.png")

        browser.close()

if __name__ == "__main__":
    run()

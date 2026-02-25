from playwright.sync_api import sync_playwright
import time
import datetime

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Navigating to index.html...")
        page.goto("http://localhost:8080/index.html")

        # Wait for form
        print("Waiting for form...")
        page.wait_for_selector("#schedule-form")

        # Fill form
        page.fill("#petName", "Test Pet")
        page.fill("#ownerPhone", "11999999999")

        # Select Date (Tomorrow)
        tomorrow = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()
        print(f"Selecting date: {tomorrow}")
        page.fill("#appointmentDate", tomorrow)

        # Trigger change event manually to be sure
        page.evaluate("document.getElementById('appointmentDate').dispatchEvent(new Event('change'))")

        # Wait for slots
        print("Waiting for slots...")
        try:
            page.wait_for_selector(".slot-btn", timeout=10000)
        except Exception as e:
            print("Timeout waiting for slots. Checking console logs...")
            # Screenshot anyway to see error
            page.screenshot(path="verification/error.png")
            raise e

        # Click first available slot
        first_slot = page.query_selector(".slot-btn:not(:disabled)")
        if first_slot:
            text = first_slot.inner_text()
            print(f"Clicking slot: {text}")
            first_slot.click()

            # Verify selection style
            time.sleep(0.5)
            is_selected = page.eval_on_selector(f"//button[text()='{text}']", "el => el.classList.contains('selected')")
            if is_selected:
                print("Slot selected successfully.")
            else:
                print("Slot selection failed visually.")
        else:
            print("No available slots found.")

        # Take screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification/verification.png")

        browser.close()

if __name__ == "__main__":
    run()

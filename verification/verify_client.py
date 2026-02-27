from playwright.sync_api import sync_playwright

def verify_client_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Grant permissions if needed, e.g., for clipboard or notifications, though not strictly required here.
        context = browser.new_context()
        page = context.new_page()

        try:
            # 1. Login
            page.goto("http://localhost:8080/index.html")
            page.fill("#loginName", "Test User")
            page.fill("#loginPhone", "11999999999")
            page.click("button:has-text('Entrar')")

            # Wait for menu screen
            page.wait_for_selector("#menu-screen.active")

            # 2. Go to Schedule
            page.click("#btn-agendar")

            # Wait for schedule screen
            page.wait_for_selector("#schedule-screen.active")

            # 3. Check Initial State
            # Verify Size Select is visible
            size_select = page.locator("#petSize")
            if not size_select.is_visible():
                print("Error: Pet Size select not found")

            # Verify services are disabled initially
            services = page.locator("input[name='serviceOption']")
            count = services.count()
            print(f"Found {count} service checkboxes.")

            # Check if checkboxes are disabled
            all_disabled = True
            for i in range(count):
                if services.nth(i).is_enabled():
                    all_disabled = False
                    print(f"Error: Service {i} is enabled initially")

            if all_disabled:
                print("Success: All services disabled initially.")

            # Screenshot 1: Initial State
            page.screenshot(path="verification/verification_client_slots_1.png")

            # 4. Select Size 'M'
            size_select.select_option("M")

            # Wait a bit for JS to process (though synchronous, good practice)
            page.wait_for_timeout(500)

            # 5. Verify Services Enabled
            all_enabled = True
            for i in range(count):
                if not services.nth(i).is_enabled():
                    all_enabled = False
                    print(f"Error: Service {i} is disabled after size selection")

            if all_enabled:
                 print("Success: All services enabled after size selection.")

            # 6. Select One Service (e.g. first one)
            first_service = services.nth(0)
            first_service.check()

            page.wait_for_timeout(500)

            # 7. Select Second Service -> Trigger Combo
            second_service = services.nth(1)
            second_service.check()

            page.wait_for_timeout(500)

            # Screenshot 2: Combo Active
            page.screenshot(path="verification/verification_client_slots_2.png")
            print("Screenshots captured.")

        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_client_flow()

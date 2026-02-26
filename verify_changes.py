
import asyncio
from playwright.async_api import async_playwright
import datetime

async def verify_settings_and_agenda():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()

        # 1. Admin Panel Verification
        print("1. Admin Panel Verification")
        page_admin = await context.new_page()

        # Handle prompt dialog for password
        page_admin.on("dialog", lambda dialog: dialog.accept("admin123"))

        try:
            await page_admin.goto("http://localhost:8080/painel-94k2.html")
        except Exception as e:
            print(f"Error navigating to Admin Panel: {e}")
            return

        # Wait for page load
        # await page_admin.wait_for_load_state("networkidle")

        # Switch to Config tab
        try:
            await page_admin.click("button:has-text('Configurações')")
        except Exception as e:
            print(f"Error clicking 'Configurações' tab: {e}")
            return

        # Verify new fields exist
        try:
            await page_admin.wait_for_selector("#agendaInterval", timeout=5000)
            await page_admin.wait_for_selector("#timeBanho")
        except Exception as e:
            print(f"Error finding selectors in Admin: {e}")
            await page_admin.screenshot(path="error_admin_selectors.png")
            return

        # Set specific values for testing
        print("Setting Admin Configs...")
        await page_admin.fill("#agendaInterval", "30")
        await page_admin.fill("#timeBanho", "30")
        await page_admin.fill("#timeBanhoTosa", "90")

        # Save config
        # Handle alert confirmation
        page_admin.once("dialog", lambda dialog: dialog.accept())
        await page_admin.click("text=Salvar Configurações de Tempo")

        # Wait a bit for save
        await page_admin.wait_for_timeout(1000)

        await page_admin.screenshot(path="verification_admin_config.png")
        print("Admin config screenshot saved.")
        await page_admin.close()

        # 2. Client Agenda Verification
        print("2. Client Agenda Verification")
        page_client = await context.new_page()
        try:
            await page_client.goto("http://localhost:8080/index.html")
        except Exception as e:
            print(f"Error navigating to Client App: {e}")
            return

        # Wait for load
        # await page_client.wait_for_load_state("networkidle")

        # Login
        print("Logging in as Client...")
        await page_client.fill("#loginName", "Test User")
        await page_client.fill("#loginPhone", "11999999999")
        await page_client.click("button:has-text('Entrar')")

        # Wait for transition
        # await page_client.wait_for_selector("#menu-screen.active", timeout=5000)

        # Go to Schedule
        await page_client.click("button:has-text('Agendar Banho')")
        # await page_client.wait_for_selector("#schedule-screen.active", timeout=5000)

        # Fill Form - Scenario 1: Banho (30min) + P (0min) = 30min (1 slot)
        print("Testing Scenario 1: Banho (30m)")
        await page_client.select_option("#serviceType", "Banho")
        await page_client.select_option("#petSize", "P")

        # Pick a future date (e.g., tomorrow)
        tomorrow = datetime.date.today() + datetime.timedelta(days=1)
        # Skip Sunday
        if tomorrow.weekday() == 6:
             tomorrow += datetime.timedelta(days=1)
        tomorrow_str = tomorrow.isoformat()

        await page_client.fill("#appointmentDate", tomorrow_str)
        # Trigger change event manually if needed, but fill usually triggers input/change
        await page_client.dispatch_event("#appointmentDate", "change")

        # Wait for slots
        try:
             # Wait for loading text to disappear or buttons to appear
             await page_client.wait_for_selector(".slot-btn", timeout=5000)
        except Exception as e:
             print("Timeout waiting for slots.")
             await page_client.screenshot(path="error_client_slots.png")

        await page_client.screenshot(path="verification_client_slots_1.png")
        print("Client slots (Banho/P) screenshot saved.")

        # Fill Form - Scenario 2: Banho e Tosa (90min) + P (0min) = 90min (3 slots)
        print("Testing Scenario 2: Banho e Tosa (90m)")
        await page_client.select_option("#serviceType", "Banho e Tosa")

        # Wait for regeneration
        await page_client.wait_for_timeout(2000)

        await page_client.screenshot(path="verification_client_slots_2.png")
        print("Client slots (Banho e Tosa/P) screenshot saved.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_settings_and_agenda())

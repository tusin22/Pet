
import asyncio
from playwright.async_api import async_playwright
import datetime

async def verify_debug():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        page.on("dialog", lambda d: d.accept("admin123"))

        try:
            # Login first
            await page.goto("http://localhost:8080/index.html")
            await page.fill("#loginName", "Tester")
            await page.fill("#loginPhone", "11999999999")
            await page.click("button:has-text('Entrar')")

            await page.click("button:has-text('Agendar Banho')")

            # Select Banho e Tosa
            await page.select_option("#serviceType", "Banho e Tosa")
            await page.select_option("#petSize", "P")

            # Date
            tomorrow = datetime.date.today() + datetime.timedelta(days=1)
            if tomorrow.weekday() == 6: tomorrow += datetime.timedelta(days=1)
            await page.fill("#appointmentDate", tomorrow.isoformat())
            await page.dispatch_event("#appointmentDate", "change")

            # Wait for slots
            await page.wait_for_selector(".slot-btn", timeout=5000)

            # Scroll to bottom to reveal debug text
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")

            await page.screenshot(path="debug_screenshot.png")
            print("Debug screenshot saved.")

        except Exception as e:
            print(f"Error: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_debug())

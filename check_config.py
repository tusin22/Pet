
import asyncio
from playwright.async_api import async_playwright

async def verify_firestore_config():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        page.on("dialog", lambda d: d.accept("admin123"))

        try:
            await page.goto("http://localhost:8080/painel-94k2.html")

            # Click tab by finding button with text
            await page.click("text=Configurações")

            # Wait for value to be populated
            await page.wait_for_timeout(2000)

            # Check value of Banho e Tosa
            val = await page.input_value("#timeBanhoTosa")
            print(f"Banho e Tosa duration: {val}")
        except Exception as e:
            print(f"Error: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_firestore_config())

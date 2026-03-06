from playwright.sync_api import sync_playwright
import time

def verify_vitrine():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1200, 'height': 800})
        page = context.new_page()

        page.goto("http://localhost:8080/index.html")

        # Fallback if window.showScreen isn't globally available due to module scoping
        page.evaluate("""
            const screens = document.querySelectorAll('.screen');
            screens.forEach(s => s.classList.remove('active'));
            document.getElementById('pacote-info-screen').classList.add('active');
        """)

        # Wait a moment for rendering
        page.wait_for_timeout(1000)

        # Wait for the cards to be visible
        page.wait_for_selector(".pacote-card")

        # Take a screenshot of the vitrine section
        page.locator("#pacote-info-screen").screenshot(path="verification/vitrine_cards.png")

        browser.close()

if __name__ == "__main__":
    verify_vitrine()

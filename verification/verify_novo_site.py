from playwright.sync_api import Page, expect, sync_playwright

def test_novo_site_layout(page: Page):
    # 1. Arrange: Go to the novo-site.html local page
    page.goto("http://localhost:8080/novo-site.html")
    page.wait_for_load_state("networkidle")

    # 2. Take screenshots of different sections

    # Hero Section
    page.screenshot(path="verification/hero.png")

    # Scroll to Sobre
    sobre_section = page.locator("#sobre")
    sobre_section.scroll_into_view_if_needed()
    page.wait_for_timeout(1000) # wait for animation
    page.screenshot(path="verification/sobre.png")

    # Scroll to Diferenciais
    diferenciais_section = page.locator("#diferenciais")
    diferenciais_section.scroll_into_view_if_needed()
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/diferenciais.png")

    # Scroll to Footer/Contato
    footer_section = page.locator(".footer")
    footer_section.scroll_into_view_if_needed()
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/footer.png", full_page=False)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Set viewport to desktop size
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        try:
            test_novo_site_layout(page)
        finally:
            browser.close()

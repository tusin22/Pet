from playwright.sync_api import sync_playwright

def verify_instagram_link():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Navigate to the local server
        page.goto("http://localhost:8080/novo-site.html")

        # Scroll to bottom to ensure footer is visible
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")

        # Wait a moment for any scroll animations
        page.wait_for_timeout(500)

        # Find the instagram link by its aria-label
        instagram_link = page.locator('a[aria-label="Instagram"]')

        # Get the href attribute
        href = instagram_link.get_attribute('href')
        print(f"Instagram link href: {href}")

        # Take a screenshot of the footer area
        footer = page.locator('.footer-info')
        footer.screenshot(path="verification/instagram_link.png")

        browser.close()

if __name__ == "__main__":
    verify_instagram_link()

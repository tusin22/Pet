from playwright.sync_api import sync_playwright

def verify_painel(page):
    page.goto("http://localhost:8080/painel-94k2.html")
    page.wait_for_load_state("networkidle")

    # Take a screenshot of the login screen
    page.screenshot(path="verification/login_screen.png")

    page.evaluate('''() => {
        // Force show main panel and hide login
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-panel').style.display = 'block';

        // Hide other tabs
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));

        // Show config tab
        document.getElementById('tab-config').classList.add('active');

        // Uncollapse cards
        document.querySelectorAll('.settings-card').forEach(card => card.classList.remove('collapsed'));
    }''')

    page.wait_for_timeout(1000)

    # Take a screenshot of the Config tab
    page.screenshot(path="verification/config_tab.png", full_page=True)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            verify_painel(page)
            print("Verification script ran successfully.")
        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            browser.close()

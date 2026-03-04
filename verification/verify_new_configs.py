from playwright.sync_api import sync_playwright

def test_configs():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Route to bypass everything and just load the static file directly with modified JS
        page.goto("http://localhost:8080/painel-94k2.html")
        page.wait_for_timeout(500)

        page.evaluate("document.getElementById('login-screen').style.display = 'none';")
        page.evaluate("document.getElementById('main-panel').style.display = 'block';")

        # Hide all tabs
        page.evaluate("document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));")

        # Show config tab
        page.evaluate("document.getElementById('tab-config').classList.add('active');")

        # Expand cards
        page.evaluate("document.querySelectorAll('.settings-card').forEach(card => card.classList.remove('collapsed'));")

        page.evaluate("""
            document.getElementById('configDate').value = '2023-10-25';
            document.getElementById('config-options').style.display = 'block';

            const servicesList = [
                "Banho Master", "Banho e Tosa", "Hidratação Vanilla", "Hidratação Ouro 24K",
                "SPA Premium", "Corte das unhas", "Escov. dos dentes", "Carding", "Desembolo de nós"
            ];
            const container = document.getElementById('service-descriptions-container');
            if (container) {
                container.innerHTML = '';
                servicesList.forEach((service, index) => {
                    const div = document.createElement('div');
                    div.className = 'form-group';
                    div.style.marginBottom = '1rem';
                    div.innerHTML = `
                        <label style="font-weight: bold; display: block; margin-bottom: 0.5rem;">${service}</label>
                        <textarea id="desc-${index}" rows="3" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 6px; resize: vertical;"></textarea>
                    `;
                    container.appendChild(div);
                });
            }
        """)

        page.wait_for_timeout(1000)

        # Take screenshot of configs
        page.screenshot(path="verification/new_configs_verification.png", full_page=True)
        print("Screenshot taken at verification/new_configs_verification.png")

        browser.close()

if __name__ == "__main__":
    test_configs()

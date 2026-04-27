from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Intercept firebase config and respond with mock
        page.route("**/*.js*", lambda route: route.fulfill(body="export function initializeApp() {}; export function getFirestore() {}; export function doc() {}; export function getDoc() { return new Promise(resolve => resolve({ exists: () => true, data: () => ({ tosa_apenas_terca: true }) })); };", content_type="application/javascript") if "firebase" in route.request.url else route.continue_())

        page.goto("http://localhost:8080/index.html")

        # Injetar config e ignorar firebase loading error
        page.evaluate("""
            window.__MELLUPET_CONFIG = {
                regras: {
                    tosa_apenas_terca: true
                }
            };
        """)

        page.wait_for_selector('#loginName', timeout=10000)
        page.fill('#loginName', 'Test User')
        page.fill('#loginPhone', '11999999999')
        # Clique do login
        page.click("#login-form button[type='submit']")

        page.wait_for_timeout(3000)

        # Espera a tela de menu carregar e clica em novo agendamento
        page.click('#btn-agendar')

        # Espera a tela de agendamento carregar
        page.wait_for_selector('#schedule-screen.active', timeout=10000)

        # Tem que escolher um tamanho pra renderizar a lista de serviços!
        page.wait_for_selector('#petSize', state="visible", timeout=10000)
        page.select_option('#petSize', 'M')

        # Espera os checkboxes de serviço renderizarem
        page.wait_for_selector("input[value='Banho e Tosa']", state="visible", timeout=10000)

        # Seleciona "Banho e Tosa"
        page.locator("input[value='Banho e Tosa']").check(force=True)
        time.sleep(1) # debounce

        # Tira screenshot
        page.screenshot(path="verification/tosa_bloqueada.png", full_page=True)

        # Troca para Tosa Higiênica
        page.locator("input[value='Banho e Tosa']").uncheck(force=True)
        page.locator("input[value='Tosa Higiênica']").check(force=True)
        time.sleep(1) # debounce

        # Tira screenshot
        page.screenshot(path="verification/tosa_higienica_liberada.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    run()

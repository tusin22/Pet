from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Route intercept to mock Firebase and simulate EMPTY snapshot
    page.route("**/*.js", lambda route: route.fulfill(content_type="application/javascript", body="""
    export function initializeApp() {};
    export function getFirestore() {};
    export function collection() {};
    export function addDoc() {};
    export function onSnapshot() {};
    export function doc() {};
    export function query() {};
    export function where() {};
    export async function getDocs() { return { empty: true, forEach: () => {} } };
    export function getDoc() {};
    export function orderBy() {};
    export function deleteDoc() {};
    export function updateDoc() {};
    """) if "firebase" in route.request.url else route.continue_())

    page.goto("http://localhost:8080/index.html")

    # Mocar o localstorage
    page.evaluate("localStorage.setItem('petshop_owner_phone', '31999999999'); localStorage.setItem('petshop_owner_name', 'Teste');")

    # Recarregar para pegar o login
    page.reload()
    time.sleep(1)

    # Clicar em meus pacotes
    page.click("id=btn-meus-pacotes")
    time.sleep(1)

    # Screenshot da tela vazia
    page.screenshot(path="verification/pacote_empty_success.png")

    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)

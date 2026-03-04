from playwright.sync_api import sync_playwright, expect
import time

def test_descricoes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Mock the __MELLUPET_CONFIG to prevent Firebase initialization errors
        page.add_init_script("""
            window.__MELLUPET_CONFIG = {
                firebase: {
                    apiKey: "mock-key",
                    authDomain: "mock-domain",
                    projectId: "mock-project"
                }
            };
        """)

        # Route intercept to mock Firebase module imports
        def handle_route(route):
            if "firebase-app.js" in route.request.url or "firebase-firestore.js" in route.request.url:
                route.fulfill(
                    status=200,
                    content_type="application/javascript",
                    body="export function initializeApp() {}; export function getFirestore() {}; export function doc() {}; export function getDoc() { return new Promise(resolve => resolve({ exists: () => true, data: () => ({'Banho Master': 'Descrição vinda do banco!', 'Corte das unhas': 'Outra descrição mockada'}) })); }; export function collection() {}; export function addDoc() {}; export function onSnapshot() {}; export function query() {}; export function where() {}; export function getDocs() {}; export function orderBy() {}; export function deleteDoc() {}; export function updateDoc() {};"
                )
            else:
                route.continue_()

        page.route("**/*", handle_route)

        page.goto("http://localhost:8080/index.html")

        # Mock login to get to menu
        page.fill("#loginName", "Test User")
        page.fill("#loginPhone", "11999999999")
        page.click("button[type='submit']")

        # Click on "Descrição dos Serviços"
        page.click("#btn-descricoes")

        # Wait for the table to populate
        page.wait_for_selector("#services-description-tbody tr")

        # Take screenshot
        page.screenshot(path="verification/descricoes.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    test_descricoes()

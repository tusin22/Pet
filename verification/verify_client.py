import re
from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Mock Firebase to bypass real auth/db on the frontend
        page.add_init_script("""
            window.__MELLUPET_CONFIG = {
                firebase: {
                    apiKey: "fake",
                    authDomain: "fake",
                    projectId: "fake",
                    storageBucket: "fake",
                    messagingSenderId: "fake",
                    appId: "fake"
                }
            };
        """)

        # Intercept Firebase imports to return empty module
        page.route("**/*.js", lambda route: route.fulfill(
            status=200,
            content_type="application/javascript",
            body="export function initializeApp() {}; export function getFirestore() {}; export function doc() {}; export function getDoc() {}; export function collection() {}; export function query() {}; export function where() {}; export function getDocs() {}; export function onSnapshot() {}; export function updateDoc() {}; export function addDoc() {}; export function deleteDoc() {}; export function writeBatch() {}; export function orderBy() {}; export function limit() {}; export function setDoc() {};"
        ) if "firebase" in route.request.url else route.continue_())


        page.goto("http://localhost:8080/index.html")

        # Click "Acessar Agendamento"
        page.click("text=Acessar Agendamento")

        # Fake Login
        page.fill("#loginName", "Test User")
        page.fill("#loginPhone", "31999999999")
        page.click("#login-form button[type='submit']")

        # Wait for menu screen
        expect(page.locator("#menu-screen")).to_be_visible()

        # Click new button
        page.click("#btn-conheca-pacotes")

        # Wait for vitrine screen
        expect(page.locator("#pacote-info-screen")).to_be_visible()

        page.screenshot(path="verification/vitrine.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    run()

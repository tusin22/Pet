from playwright.sync_api import sync_playwright, expect
import os

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Mock Firebase config
        page.route("**/*.js", lambda route, request: route.continue_() if not request.url.endswith("runtime-config.js") else route.fulfill(
            content_type="application/javascript",
            body="""
            window.__MELLUPET_CONFIG = {
                firebase: {
                    apiKey: "mock",
                    authDomain: "mock",
                    projectId: "mock",
                    storageBucket: "mock",
                    messagingSenderId: "mock",
                    appId: "mock"
                }
            };
            """
        ))

        # Mock Firebase ES module imports to prevent errors
        page.route("https://www.gstatic.com/firebasejs/**", lambda route: route.fulfill(
            content_type="application/javascript",
            body="export function initializeApp() {}; export function getFirestore() {}; export function collection() {}; export function getDocs() {}; export function doc() {}; export function getDoc() {}; export function onSnapshot() {}; export function query() {}; export function where() {}; export function addDoc() {}; export function updateDoc() {}; export function deleteDoc() {}; export function getAuth() {}; export function signInWithEmailAndPassword() {}; export function onAuthStateChanged() {}; export function signOut() {}; export function sendPasswordResetEmail() {};"
        ))

        page.goto("http://localhost:8080/index.html")

        # By default it goes to welcome-screen. Let's go to menu-screen, then pacote-info-screen
        page.evaluate("document.getElementById('welcome-screen').classList.remove('active');")
        page.evaluate("document.getElementById('pacote-info-screen').classList.add('active');")

        # Wait for the screen to be visible
        expect(page.locator("#pacote-info-screen")).to_be_visible()

        # Click the Medium size tab to see different images
        page.locator("#tab-porte-m").click()

        # Wait a bit for animations
        page.wait_for_timeout(1000)

        # Take a screenshot of the package info screen
        os.makedirs("/home/jules/verification", exist_ok=True)
        page.screenshot(path="/home/jules/verification/vitrine.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    run_test()

from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Mock Firebase config
        page.add_init_script("""
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
        """)

        def handle_route(route):
            if "firebase-app" in route.request.url:
                route.fulfill(status=200, content_type="application/javascript", body="export function initializeApp() { return {}; }")
            elif "firebase-firestore" in route.request.url:
                route.fulfill(status=200, content_type="application/javascript", body="export function getFirestore() { return {}; } export function collection() {} export function onSnapshot() {} export function doc() {} export function getDoc() { return new Promise(r => r({ exists: () => true, data: () => ({}) })); } export function setDoc() { return new Promise(r => r()); } export function updateDoc() {} export function deleteDoc() {} export function query() {} export function orderBy() {} export function where() {} export function limit() {} export function writeBatch() {} export function getDocs() { return new Promise(r => r([])); }")
            elif "firebase-auth" in route.request.url:
                # Trigger user login immediately
                route.fulfill(status=200, content_type="application/javascript", body="export function getAuth() { return { currentUser: { uid: 'mock' } }; } export function signInWithEmailAndPassword() {} export function onAuthStateChanged(auth, cb) { cb({uid: 'mock'}); } export function signOut() {} export function sendPasswordResetEmail() {}")
            else:
                route.continue_()

        page.route("**/*.js*", handle_route)

        pwd = os.getcwd()
        page.goto(f"file://{pwd}/painel-94k2.html")

        # Wait for main panel to be visible (auth state changed to logged in)
        page.wait_for_selector("#main-panel", state="visible")

        # Click "Configurações" tab
        page.click("button.tab-btn:has-text('Configurações')", force=True)

        # Expand card
        page.click("h2:has-text('Tempos e Duração')", force=True)
        time.sleep(0.5)

        # Type 0 into the first service duration (Banho Master)
        page.fill("#time-dur-0", "0")

        # Type 0 into the extra time for 'P'
        page.fill("#extraP", "0")

        # Take screenshot of the inputs
        page.screenshot(path="verification/zero_duration.png")

        # Click save
        page.click("button:has-text('Salvar Configurações de Tempo')", force=True)
        time.sleep(0.5)

        # Check custom modal message
        message = page.locator("#custom-modal-message").text_content()
        print(f"Modal message: {message}")

        browser.close()

if __name__ == "__main__":
    run()

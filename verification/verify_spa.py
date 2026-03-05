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
            url = route.request.url
            if "firebase-app.js" in url:
                route.fulfill(status=200, content_type="application/javascript", body="export function initializeApp() { return {}; }")
            elif "firebase-firestore.js" in url:
                route.fulfill(status=200, content_type="application/javascript", body="export function getFirestore() { return {}; } export function collection() {} export function onSnapshot() {} export function doc() {} export function getDoc() { return new Promise(r => r({ exists: () => true, data: () => ({ 'SPA Premium': 'Mocked Desc' }) })); } export function setDoc() { return new Promise(r => r()); } export function updateDoc() {} export function deleteDoc() {} export function query() {} export function orderBy() {} export function where() {} export function limit() {} export function writeBatch() {} export function getDocs() { return new Promise(r => r([])); }")
            elif "firebase-auth.js" in url:
                route.fulfill(status=200, content_type="application/javascript", body="export function getAuth() { return { currentUser: { uid: 'mock' } }; } export function signInWithEmailAndPassword() {} export function onAuthStateChanged(auth, cb) { cb({uid: 'mock'}); } export function signOut() {} export function sendPasswordResetEmail() {}")
            else:
                route.continue_()

        page.route("**/*.js*", handle_route)

        pwd = os.getcwd()
        page.goto(f"file://{pwd}/painel-94k2.html")

        time.sleep(2) # Give it time to load the JS

        # Manually force UI update since mocking onAuthStateChanged might fail
        page.evaluate("""
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('main-panel').style.display = 'block';

            // Show config tab
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.getElementById('tab-config').classList.add('active');

            // Expand card
            document.querySelectorAll('.settings-card')[1].classList.remove('collapsed');
            document.querySelectorAll('.settings-card')[2].classList.remove('collapsed');
            document.querySelectorAll('.settings-card')[3].classList.remove('collapsed');
        """)

        time.sleep(1)

        # Take screenshot of the inputs
        page.screenshot(path="verification/spa_translation.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    run()

from playwright.sync_api import sync_playwright
import os

def test_admin_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Simple mock config
        page.add_init_script("""
            window.__MELLUPET_CONFIG = { firebase: { apiKey: 'mock' } };
        """)

        # Start a local HTTP server for reliable playwright execution
        import subprocess
        import time
        server = subprocess.Popen(["python3", "-m", "http.server", "8080"])
        time.sleep(2) # Give server time to start

        # Route intercepts for firebase to allow the script to load
        page.route("https://www.gstatic.com/firebasejs/**/*.js", lambda route: route.fulfill(status=200, body="export function initializeApp() {}; export function getFirestore() {}; export function getAuth() {}; export function onAuthStateChanged(auth, cb) { setTimeout(() => cb({uid: '123'}), 500); }; export function doc() {}; export function setDoc() {}; export function getDoc() { return Promise.resolve({exists: () => false, data: () => ({})}) }; export function updateDoc() {}; export function deleteDoc() {}; export function collection() {}; export function query() {}; export function where() {}; export function limit() {}; export function onSnapshot(q, cb, err) { cb({ forEach: function(){} }); }; export function orderBy() {}; export function writeBatch() {}; export function getDocs() { return Promise.resolve({forEach: function(){}}); }; export function signInWithEmailAndPassword() {}; export function signOut() {}; export function sendPasswordResetEmail() {};", content_type="application/javascript"))

        page.goto("http://localhost:8080/painel-94k2.html")

        # Wait for the login screen to be hidden by the auth mock
        page.wait_for_selector('#main-panel', state='visible', timeout=10000)

        # Go to Agenda da Semana tab
        page.click('button:has-text("Agenda da Semana")')
        page.wait_for_timeout(3000)

        # Take screenshot of the week grid
        page.screenshot(path="verification/week_grid_fix.png", full_page=True)

        server.terminate()
        browser.close()

if __name__ == "__main__":
    test_admin_page()
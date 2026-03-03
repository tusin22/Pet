from playwright.sync_api import sync_playwright
import time

def test_admin_panel_title(page):
    page.route("**/*.js", lambda route, request: route.continue_() if not "firebase" in request.url else route.fulfill(status=200, content_type="application/javascript", body="export function initializeApp() {}; export function getFirestore() {}; export function getAuth() {}; export function onAuthStateChanged() {}; export function collection() {}; export function doc() {}; export function getDoc() {}; export function setDoc() {}; export function updateDoc() {}; export function deleteDoc() {}; export function query() {}; export function orderBy() {}; export function where() {}; export function limit() {}; export function writeBatch() {}; export function getDocs() {}; export function signInWithEmailAndPassword() {}; export function signOut() {}; export function sendPasswordResetEmail() {}; export function onSnapshot() {};"))

    page.goto("http://localhost:8080/painel-94k2.html")

    # Inject minimal UI state bypass
    page.evaluate("""
        window.__MELLUPET_CONFIG = { firebase: { apiKey: 'mock' } };
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-panel').style.display = 'block';
    """)

    time.sleep(1)

    # Take a screenshot to verify title centering
    page.screenshot(path="verification/admin_panel_title.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            test_admin_panel_title(page)
        finally:
            browser.close()
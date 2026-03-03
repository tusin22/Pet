from playwright.sync_api import sync_playwright
import time

def test_new_appointment_modal(page):
    # Instead of fulfilling with body="", fulfill with valid empty module export to avoid MIME type errors
    page.route("**/*.js", lambda route, request: route.continue_() if not "firebase" in request.url else route.fulfill(status=200, content_type="application/javascript", body="export function initializeApp() {}; export function getFirestore() {}; export function getAuth() {}; export function onAuthStateChanged() {}; export function collection() {}; export function doc() {}; export function getDoc() {}; export function setDoc() {}; export function updateDoc() {}; export function deleteDoc() {}; export function query() {}; export function orderBy() {}; export function where() {}; export function limit() {}; export function writeBatch() {}; export function getDocs() {}; export function signInWithEmailAndPassword() {}; export function signOut() {}; export function sendPasswordResetEmail() {}; export function onSnapshot() {};"))

    page.goto("http://localhost:8080/painel-94k2.html")

    # Inject minimal UI state bypass
    page.evaluate("""
        window.__MELLUPET_CONFIG = { firebase: { apiKey: 'mock' } };
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-panel').style.display = 'block';
    """)

    time.sleep(1)

    page.evaluate("""
        const btn = document.getElementById('btn-new-appointment');
        if (btn) {
            btn.click();
        } else {
            console.error("Button not found!");
        }
    """)

    time.sleep(1)

    page.screenshot(path="verification/new_appointment_modal.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
        try:
            test_new_appointment_modal(page)
        finally:
            browser.close()
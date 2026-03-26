import time
from playwright.sync_api import sync_playwright

def test_delete_pacote(page):
    page.add_init_script("""
        window.__MELLUPET_CONFIG = { firebase: { apiKey: "mock" } };
    """)
    page.route("**/*.js", lambda route, request: route.continue_())

    # Mock specific firebase imports
    page.route("https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js", lambda route: route.fulfill(
        content_type="application/javascript",
        body="export function initializeApp() { return {}; }"
    ))

    page.route("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js", lambda route: route.fulfill(
        content_type="application/javascript",
        body="""
            export function getFirestore() { return {}; }
            export function collection() { return {}; }
            export function doc() { return {}; }
            export function getDoc() { return Promise.resolve({exists: () => false}); }
            export function getDocs() { return Promise.resolve({empty: true, docs: [], forEach: () => {}}); }
            export function setDoc() { return Promise.resolve(); }
            export function updateDoc() { return Promise.resolve(); }
            export function deleteDoc() { return Promise.resolve(); }
            export function query() { return {}; }
            export function orderBy() { return {}; }
            export function where() { return {}; }
            export function limit() { return {}; }
            export function writeBatch() { return {}; }
            export function onSnapshot(q, cb) {
                setTimeout(() => {
                    const docs = [
                        {
                            id: 'mock_wallet_123',
                            data: () => ({
                                ownerName: 'João da Silva',
                                phone: '11988887777',
                                petName: 'Rex',
                                petSize: 'M',
                                planName: 'Pacote 4 Banhos',
                                saldo: { 'Banho Master': 2, 'Tosa Higiênica': 1 },
                                createdAt: '2023-11-01T10:00:00'
                            })
                        }
                    ];
                    // Mock snapshot behavior
                    cb({
                        forEach: (fn) => docs.forEach(fn)
                    });
                }, 100);
                return () => {};
            }
        """
    ))

    page.route("https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js", lambda route: route.fulfill(
        content_type="application/javascript",
        body="""
            export function getAuth() { return {}; }
            export function onAuthStateChanged(auth, cb) {
                // Simulate logged in user
                setTimeout(() => cb({ uid: 'mock' }), 100);
            }
            export function signInWithEmailAndPassword() { return Promise.resolve(); }
            export function signOut() { return Promise.resolve(); }
            export function sendPasswordResetEmail() { return Promise.resolve(); }
        """
    ))

    page.goto("http://localhost:8080/painel-94k2.html")

    # Wait for login simulation and main panel
    page.wait_for_selector("#main-panel", state="visible")

    # Click Pacotes Ativos tab
    page.click("text=Pacotes Ativos")

    # Wait for the card to render
    page.wait_for_selector(".pacote-card")

    time.sleep(0.5)
    page.screenshot(path="verification_pacotes_delete_btn.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        test_delete_pacote(page)
    finally:
        browser.close()
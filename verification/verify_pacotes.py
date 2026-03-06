from playwright.sync_api import sync_playwright, expect

def verify_pacote_cards():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Mock window.__MELLUPET_CONFIG to avoid Firebase initialization errors
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

        # Mock Firebase imports to avoid strict MIME type errors
        page.route("**/*.js", lambda route: route.fulfill(
            content_type="application/javascript",
            body="export function initializeApp() {}; export function getFirestore() {}; export function doc() {}; export function getDoc() {}; export function collection() {}; export function addDoc() {}; export function onSnapshot() {}; export function query() {}; export function where() {}; export function getDocs() {}; export function orderBy() {}; export function deleteDoc() {}; export function updateDoc() {};"
        ) if "firebase" in route.request.url else route.continue_())

        page.goto("http://localhost:8080/index.html")

        # Navigate to the package storefront by executing the showScreen function
        page.evaluate("showScreen('pacote-info-screen')")

        # Initialize the 'Pequeno' tab content
        page.evaluate("window.selectPorteTab('P')")

        # Wait for the cards to be visible
        expect(page.locator("#pacote-cards-container")).to_be_visible()

        # Capture a screenshot
        page.screenshot(path="verification_pacotes.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    verify_pacote_cards()
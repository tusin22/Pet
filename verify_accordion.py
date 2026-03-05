from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # Route mocks for Firebase ES modules to bypass auth
        def mock_firebase(route):
            response_body = """
                export function initializeApp() {};
                export function getFirestore() {};
                export function collection() {};
                export function getDocs() {};
                export function query() {};
                export function where() {};
                export function addDoc() {};
                export function onSnapshot() {};
                export function doc() {};
                export function getDoc() {};
                export function setDoc() {};
                export function updateDoc() {};
                export function deleteDoc() {};
                export function orderBy() {};
                export function limit() {};
                export function writeBatch() {};
                export function getAuth() {};
                export function signInWithEmailAndPassword() {};
                export function onAuthStateChanged(auth, cb) {
                   setTimeout(() => cb({ uid: 'mockuser' }), 100);
                };
                export function signOut() {};
                export function sendPasswordResetEmail() {};
            """
            route.fulfill(content_type="application/javascript", body=response_body)

        context.route("**/*.js*", lambda route: mock_firebase(route) if "firebase" in route.request.url else route.continue_())

        page = context.new_page()

        try:
            # Navigate
            page.goto("http://localhost:8080/painel-94k2.html")

            # Force UI to display main panel as if logged in
            page.evaluate("""
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('main-panel').style.display = 'block';
            """)

            # Wait for header
            page.wait_for_selector("h1", state="visible")

            # Click config tab
            page.get_by_role("button", name="Configurações").click()

            # Wait a moment for rendering
            page.wait_for_timeout(500)

            # Check Tabela de Preços (should be collapsed by default based on code structure)
            precos_header = page.get_by_role("heading", name="Tabela de Preços")
            precos_card = precos_header.locator("xpath=../..")

            # Click to toggle
            precos_header.click()
            page.wait_for_timeout(500) # Wait for animation

            # Take screenshot
            page.screenshot(path="verify_accordion.png")

        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()

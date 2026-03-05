from playwright.sync_api import sync_playwright, expect
import time

def test_pacotes(page):
    # Mocking Firebase config to bypass initialization errors
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
        // Mock custom modal to prevent blocking clicks
        window.showCustomAlert = async (msg) => { console.log(msg); };
    """)

    # 1. Test Client Welcome Screen
    page.goto("http://localhost:8080/index.html")
    time.sleep(1) # wait for load

    # Take screenshot of welcome screen
    page.screenshot(path="verification/client_welcome.png")

    # Click Agendar pelo Pacote
    page.get_by_role("button", name="Agendar pelo Pacote").click()
    time.sleep(0.5)

    # Take screenshot of phone input
    page.screenshot(path="verification/client_phone_check.png")


    # 2. Test Admin Panel New Tab
    page.goto("http://localhost:8080/painel-94k2.html")
    time.sleep(1)

    # We need to bypass login to see the tabs. Since we are testing UI rendering of the new tab,
    # we can force the tab to show via JS for the screenshot, or mock auth.
    # Easiest is just to show the main panel and hide login
    page.evaluate("""
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-panel').style.display = 'block';

        // Ensure custom modal is hidden
        document.getElementById('custom-modal-overlay').style.display = 'none';
    """)
    time.sleep(0.5)

    # Click Cadastrar Pacote tab
    page.get_by_role("button", name="Cadastrar Pacote").click()
    time.sleep(0.5)

    # Take screenshot of the new form
    page.screenshot(path="verification/admin_cadastrar_pacote.png")

    # Click Configurações tab to check the new pricing section
    page.get_by_role("button", name="Configurações").click()
    time.sleep(0.5)

    # Open "Preços dos Pacotes" accordion
    page.get_by_role("heading", name="Preços dos Pacotes").click(force=True)
    time.sleep(0.5)

    page.screenshot(path="verification/admin_config_pacotes.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # Route mocks for Firebase ES modules to avoid strict MIME type errors when running locally
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
                export function onAuthStateChanged() {};
                export function signOut() {};
                export function sendPasswordResetEmail() {};
            """
            route.fulfill(content_type="application/javascript", body=response_body)

        context.route("**/*.js*", lambda route: mock_firebase(route) if "firebase" in route.request.url else route.continue_())

        page = context.new_page()
        try:
            test_pacotes(page)
            print("Verification script ran successfully.")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

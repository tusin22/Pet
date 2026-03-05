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
                   // mock user to allow load
                   setTimeout(() => cb({ uid: 'mockuser' }), 100);
                };
                export function signOut() {};
                export function sendPasswordResetEmail() {};
            """
            route.fulfill(content_type="application/javascript", body=response_body)

        context.route("**/*.js*", lambda route: mock_firebase(route) if "firebase" in route.request.url else route.continue_())

        page = context.new_page()
        page.goto("http://localhost:8080/painel-94k2.html")

        # Force UI to display main panel as if logged in
        page.evaluate("""
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('main-panel').style.display = 'block';
        """)

        # Wait for page to load
        page.wait_for_selector("h1", state="visible")

        # Inject a mock appointment into the modal to test rendering of Desembolo input
        mock_data = {
            "id": "test-id",
            "petName": "Rex",
            "ownerName": "João",
            "ownerPhone": "11999999999",
            "services": ["Banho", "Desembolo de nós"],
            "serviceType": "Banho, Desembolo de nós",
            "petSize": "M",
            "paymentMethod": "Pix",
            "totalValue": 80.00,
            "valorDesembolo": 0,
            "status": "Agendado",
            "appointmentTime": "2023-10-27T14:00",
            "observations": "Cuidado com a pata"
        }

        page.evaluate("data => window.openModal(data)", mock_data)

        # Wait for modal content
        page.wait_for_selector("#appointment-modal.active")

        # Take screenshot
        page.screenshot(path="verification_desembolo.png")

        browser.close()

if __name__ == "__main__":
    run()

from playwright.sync_api import sync_playwright

def verify_pacotes_edit():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Error: {err}"))

        # Mock __MELLUPET_CONFIG
        page.add_init_script("""
            window.__MELLUPET_CONFIG = {
                firebase: { apiKey: "mock", authDomain: "mock", projectId: "mock", storageBucket: "mock", messagingSenderId: "mock", appId: "mock" }
            };
        """)

        # Mock Firebase
        def handle_firebase(route):
            url = route.request.url
            if "firebase-app" in url:
                route.fulfill(status=200, content_type="application/javascript", body="export function initializeApp() { return {}; }")
            elif "firebase-firestore" in url:
                route.fulfill(status=200, content_type="application/javascript", body="""
                    export function getFirestore() { return {}; }
                    export function collection() { return {}; }
                    export function doc() { return {}; }
                    export function query() { return {}; }
                    export function where() { return {}; }
                    export function orderBy() { return {}; }
                    export function limit() { return {}; }
                    export function getDoc() { return Promise.resolve({ exists: () => true, data: () => ({ appointmentTime: '2023-10-10T10:00:00', saldo: {'Banho Master': 4}, ownerName: 'João Teste', phone: '11988887777', petName: 'Rex' }) }); }
                    export function getDocs() { return Promise.resolve({ empty: true }); }
                    export function setDoc() { return Promise.resolve(); }
                    export function updateDoc() { return Promise.resolve(); }
                    export function deleteDoc() { return Promise.resolve(); }
                    export function writeBatch() { return {}; }
                    export function onSnapshot(q, cb) {
                        setTimeout(() => {
                            cb([
                                {
                                    id: 'mock-wallet-1',
                                    data: () => ({
                                        ownerName: 'João Silva',
                                        phone: '11999999999',
                                        petName: 'Rex',
                                        planName: 'Pacote 12 Banhos',
                                        petSize: 'M',
                                        type: 'individual',
                                        appointmentTime: '2023-10-10T10:00:00',
                                        createdAt: new Date().toISOString(),
                                        saldo: {
                                            'Banho Master': 4,
                                            'Tosa Higiênica': 1
                                        }
                                    })
                                }
                            ]);
                        }, 500);
                        return () => {};
                    }
                """)
            elif "firebase-auth" in url:
                route.fulfill(status=200, content_type="application/javascript", body="""
                    export function getAuth() { return {}; }
                    export function signInWithEmailAndPassword() { return Promise.resolve(); }
                    export function signOut() { return Promise.resolve(); }
                    export function sendPasswordResetEmail() { return Promise.resolve(); }
                    export function onAuthStateChanged(auth, cb) { setTimeout(() => cb({uid: 'mock'}), 100); }
                """)
            else:
                route.continue_()

        page.route("**/*.js*", handle_firebase)

        page.goto("http://localhost:8080/painel-94k2.html")

        # Wait for auth state change
        page.wait_for_selector("#main-panel", state="visible")

        # Click Pacotes Ativos tab
        page.click("button:has-text('Pacotes Ativos')")

        # Wait for the package card to appear
        page.wait_for_selector(".pacote-card")

        # Take screenshot of the card showing the new edit button
        page.screenshot(path="verification/pacotes_edit_btn.png")

        # Click the edit button
        page.click(".edit-pacote-btn")

        # Wait for the modal to be visible
        page.wait_for_selector("#edit-pacote-modal.active", state="visible")

        # Take a screenshot of the edit modal
        page.screenshot(path="verification/pacotes_edit_modal.png")

        browser.close()

if __name__ == "__main__":
    verify_pacotes_edit()

from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Mock Firebase to prevent errors
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

        # Mock API calls to block actually hitting Firebase
        page.route("**/*.js", lambda route: route.continue_())
        page.route("https://www.gstatic.com/firebasejs/**/*.js", lambda route: route.fulfill(
            status=200,
            content_type="application/javascript",
            body="""
                export function initializeApp() {}
                export function getFirestore() { return {}; }
                export function collection() {}
                export function addDoc() {}
                export function onSnapshot() {}
                export function doc() {}
                export function query() {}
                export function where() {}
                export function getDocs() {}
                export function getDoc() { return new Promise(r => r({ exists: () => true, data: () => ({}) })); }
                export function orderBy() {}
                export function deleteDoc() {}
                export function updateDoc() {}
                export function getAuth() { return { onAuthStateChanged: (cb) => cb(null) }; }
                export function signInWithEmailAndPassword() {}
                export function signOut() {}
                export function sendPasswordResetEmail() {}
            """
        ))

        # We need a local server since module scripts don't work over file://
        # Assume one is running on 8080 as per memory
        page.goto("http://localhost:8080/index.html")

        page.wait_for_selector("#loginPhone")
        page.fill("#loginPhone", "11999999999")
        page.fill("#loginName", "Test User")
        page.click("button[type='submit']")

        page.wait_for_selector("#btn-agendar")
        page.click("#btn-agendar")

        page.wait_for_selector(".step-1")
        page.screenshot(path="verification/step1.png")

        # Fill step 1
        page.fill("#petName", "Rex")
        page.select_option("#petSize", "M")
        page.fill("#observations", "Test observation in step 1")

        # Take a screenshot to show the newly added field at the bottom of step 1
        page.screenshot(path="verification/step1_filled.png")

        # Go to step 2
        page.click("#btn-next")

        page.wait_for_selector(".section-2.active")

        # Since we mocked Firebase getDocs, the slots will not load or will show empty. That's fine.
        # Just take a screenshot of step 2 showing the button states
        page.screenshot(path="verification/step2.png")

        browser.close()

if __name__ == "__main__":
    verify()

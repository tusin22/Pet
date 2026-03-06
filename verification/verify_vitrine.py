from playwright.sync_api import sync_playwright

def verify_vitrine():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile view
        context = browser.new_context(viewport={'width': 414, 'height': 896})
        page = context.new_page()

        # Config mock
        page.add_init_script("""
            window.__MELLUPET_CONFIG = {
                firebase: {},
                apiKeys: {}
            };
        """)

        # Route intercepts for Firebase
        def handle_firebase_route(route):
            route.fulfill(status=200, content_type="application/javascript", body="""
                export function initializeApp() {};
                export function getFirestore() {};
                export function doc() {};
                export function getDoc() {};
                export function collection() {};
                export function getDocs() {};
                export function getAuth() {};
                export function onAuthStateChanged() {};
            """)

        page.route("**/*firebase*", handle_firebase_route)

        try:
            page.goto("http://localhost:8080/index.html")

            # Go directly to menu using window eval
            page.evaluate("document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));")
            page.evaluate("document.getElementById('menu-screen').classList.add('active');")

            page.wait_for_timeout(500)

            # Screenshot of menu
            page.screenshot(path="verification/menu_btn_fixed.png")

            # Go to Vitrine
            page.evaluate("document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));")
            page.evaluate("document.getElementById('pacote-info-screen').classList.add('active');")
            page.evaluate("if(typeof window.selectPorteTab === 'function') window.selectPorteTab('P');")

            # Wait for images and vitrine
            page.wait_for_timeout(1000)

            page.screenshot(path="verification/vitrine_planos.png")

            # Scroll to extras
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(500)

            page.screenshot(path="verification/vitrine_extras.png")

            # Click M Tab to see animation
            page.evaluate("window.scrollTo(0, 0)")
            page.evaluate("if(typeof window.selectPorteTab === 'function') window.selectPorteTab('M');")
            page.wait_for_timeout(200) # Mid-animation screenshot
            page.screenshot(path="verification/vitrine_planos_m_anim.png")

            print("Successfully took screenshots")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    verify_vitrine()
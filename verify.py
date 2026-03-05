from playwright.sync_api import sync_playwright

def verify_frontend(page):
    page.goto("http://localhost:8080/index.html")

    # Bypass auth and config
    page.evaluate("""
        window.__MELLUPET_CONFIG = { firebase: {} };
        localStorage.setItem('petshop_owner_phone', '11999999999');
        localStorage.setItem('petshop_owner_name', 'Test User');
    """)
    page.reload()

    # Wait for menu screen to appear and click 'Novo Agendamento'
    page.wait_for_selector('#menu-screen.active')
    page.click('#btn-agendar')

    # Wait for schedule screen
    page.wait_for_selector('#schedule-screen.active')

    # Select pet size to enable checkboxes
    page.select_option('#petSize', 'M')

    # Check 'Desembolo de nós'
    page.check('input[value="Desembolo de nós"]')

    # Wait for the price to update
    page.wait_for_selector('#price-display:has-text("Avaliação")')

    page.screenshot(path="/tmp/verification.png")

with sync_playwright() as p:
    # Use standard playwright setup
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        # Mock Firebase ES module imports
        page.route("**/*firebase*.js", lambda route: route.fulfill(
            content_type="application/javascript",
            body="""
                export function initializeApp() {};
                export function getFirestore() { return {}; };
                export function collection() {};
                export function addDoc() {};
                export function onSnapshot() {};
                export function doc() {};
                export function query() {};
                export function where() {};
                export function getDocs() {};
                export function getDoc() { return Promise.resolve({ exists: () => true, data: () => ({}) }); };
                export function orderBy() {};
                export function deleteDoc() {};
                export function updateDoc() {};
            """
        ))
        verify_frontend(page)
    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="/tmp/error.png")
    finally:
        browser.close()
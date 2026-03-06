from playwright.sync_api import sync_playwright

def test_vitrine():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # intercept firebase modules
        page.route("https://www.gstatic.com/firebasejs/**/*", lambda route: route.fulfill(status=200, body="""
            export function initializeApp() {};
            export function getFirestore() {};
            export function collection() {};
            export function doc() {};
            export function getDoc() {
                return new Promise((resolve) => {
                    resolve({
                        exists: () => true,
                        data: () => ({
                            plano1: {priceP: 100, priceM: 120, priceG: 140},
                            plano2: {priceP: 200, priceM: 220, priceG: 240},
                            plano3: {priceP: 300, priceM: 320, priceG: 340},
                            extras: {
                                unhas: 15.50,
                                dentes: 20.00,
                                carding: 35.00,
                                desembolo: 15.00
                            }
                        })
                    });
                });
            };
            export function addDoc() {};
            export function onSnapshot() {};
            export function query() {};
            export function where() {};
            export function getDocs() {};
            export function orderBy() {};
            export function deleteDoc() {};
            export function updateDoc() {};
        """, content_type="application/javascript"))

        # mock runtime-config.js
        page.route("**/config/runtime-config.js*", lambda route: route.fulfill(status=200, body="window.__MELLUPET_CONFIG = { firebase: { apiKey: 'mock' } };", content_type="application/javascript"))

        page.goto("http://localhost:8080/index.html")
        page.wait_for_timeout(2000)

        # Click the btn-conheca-pacotes to trigger the UI update function that sets the text contents
        page.evaluate("document.getElementById('btn-conheca-pacotes').click()")
        page.wait_for_timeout(2000)

        # Scroll to bottom to see extras
        page.evaluate("window.scrollBy(0, 1000)")
        page.wait_for_timeout(500)

        page.screenshot(path="verification/vitrine_success.png")
        browser.close()

if __name__ == "__main__":
    test_vitrine()

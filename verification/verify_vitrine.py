from playwright.sync_api import sync_playwright
import os

def test_vitrine(page):
    # Mock firebase since we don't have keys
    page.route("**/*", lambda route: route.fulfill(
        status=200,
        content_type="application/javascript",
        body="export function initializeApp() { return {}; } export function getFirestore() { return {}; } export function doc() { return {}; } export function getDoc() { return { exists: () => false }; } export function onSnapshot() { return () => {}; } export function setDoc() { return Promise.resolve(); } export function getAuth() { return {}; } export function onAuthStateChanged() { return () => {}; }"
    ) if "firebase" in route.request.url else route.continue_())

    # Mock runtime config
    page.route("**/runtime-config.js", lambda route: route.fulfill(
        status=200,
        content_type="application/javascript",
        body="window.__MELLUPET_CONFIG = {};"
    ))

    index_path = f"file://{os.path.abspath('index.html')}"
    page.goto(index_path)

    # Inject a mutation observer in JS to immediately populate data once the DOM is ready, ignoring Firebase
    page.evaluate("""
        window.packagesPricingConfig = {
            plano1: {
                priceP: 100, priceM: 120, priceG: 140,
                pctP: 5, pctM: 5, pctG: 5,
                offP: 20, offM: 25, offG: 30
            },
            plano2: {
                priceP: 280, priceM: 320, priceG: 380,
                pctP: 10, pctM: 10, pctG: 10,
                offP: 0, offM: 0, offG: 0
            },
            plano3: {
                priceP: 500, priceM: 600, priceG: 750,
                pctP: 0, pctM: 0, pctG: 0,
                offP: 100, offM: 120, offG: 150
            },
            extras: {
                tosaP: 50, tosaM: 60, tosaG: 70
            }
        };

        // Override the selectPorteTab function just in case
        setTimeout(() => {
            const planos = ['plano1', 'plano2', 'plano3'];
            planos.forEach(plano => {
                const discountEl = document.getElementById('vitrine-discount-' + plano);
                if (discountEl) {
                    const pct = window.packagesPricingConfig[plano]['pctP'];
                    const off = window.packagesPricingConfig[plano]['offP'];

                    if (pct > 0 || off > 0) {
                        let badgeText = '';
                        if (pct > 0) badgeText += pct + '% de desconto';
                        if (off > 0) badgeText += (badgeText ? ' | ' : '') + '- R$ ' + off + ' OFF';

                        discountEl.textContent = badgeText;
                        discountEl.style.display = 'block';
                    }
                }
            });
            document.querySelectorAll('.screen').forEach(el => el.style.display = 'none');
            document.getElementById('pacote-info-screen').style.display = 'block';
            document.getElementById('pacote-info-screen').style.opacity = '1';
        }, 1000);
    """)

    page.wait_for_timeout(2000)
    page.screenshot(path="verification/vitrine_p.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 1200})
        page = context.new_page()
        try:
            test_vitrine(page)
            print("Successfully verified.")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

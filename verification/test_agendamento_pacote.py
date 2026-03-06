from playwright.sync_api import sync_playwright
import time
import subprocess
import os

def test_agendamento_pacote():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.add_init_script("""
            window.__MELLUPET_CONFIG = { firebase: {} };
        """)

        page.route("**/*firebase*.js", lambda route: route.fulfill(
            status=200,
            content_type="application/javascript",
            body="""
            export function initializeApp() { return {}; }
            export function getFirestore() { return {}; }
            export function getAuth() { return {}; }
            export function collection() {}
            export function doc() {}
            export function getDoc() {
                return new Promise(resolve => resolve({
                    exists: () => true,
                    data: () => {
                        return {
                            type: 'shared',
                            petSize: 'M',
                            phone: '31999999999',
                            saldo: {
                                'Banho Master': 10,
                                'Hidratação Vanilla': 2
                            }
                        };
                    }
                }));
            }
            export function updateDoc() {}
            export function query() {}
            export function where() {}
            export function getDocs() {}
            export function addDoc() {}
            """
        ))

        page.add_init_script("""
            localStorage.setItem('petshop_owner_phone', '31999999999');
            localStorage.setItem('petshop_owner_name', 'João Teste');
        """)

        page.goto("http://localhost:8080/agendamento-pacote.html?walletId=31999999999_M")

        time.sleep(3)

        page.screenshot(path="verification/agendamento_pacote_step1.png", full_page=True)

        print("Screenshots saved successfully.")

        browser.close()

if __name__ == "__main__":
    test_agendamento_pacote()

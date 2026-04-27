from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Testing index.html")
        page.goto("http://localhost:8080/index.html")

        # Mock config
        page.evaluate('''
            window.__MELLUPET_CONFIG = {
                firebase: {
                    apiKey: "mock", authDomain: "mock", projectId: "mock", storageBucket: "mock", messagingSenderId: "mock", appId: "mock"
                }
            };
        ''')

        # Test input readOnly attribute
        input_locator = page.locator('#appointmentDate')
        readonly_val = input_locator.get_attribute('readonly')
        print(f"index.html appointmentDate readonly: {readonly_val}")

        page.close()

        page2 = context.new_page()
        print("Testing agendamento-pacote.html")
        page2.goto("http://localhost:8080/agendamento-pacote.html?walletId=mock")
        page2.evaluate('''
            window.__MELLUPET_CONFIG = {
                firebase: {
                    apiKey: "mock", authDomain: "mock", projectId: "mock", storageBucket: "mock", messagingSenderId: "mock", appId: "mock"
                }
            };
        ''')
        input_locator2 = page2.locator('#appointmentDate')
        readonly_val2 = input_locator2.get_attribute('readonly')
        print(f"agendamento-pacote.html appointmentDate readonly: {readonly_val2}")

        browser.close()

if __name__ == '__main__':
    run()

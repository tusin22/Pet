from playwright.sync_api import sync_playwright
import time

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
            export function getDoc(d) {
                if(d && d.path && d.path.includes('regras_agendamento')){
                    return new Promise(resolve => resolve({
                        exists: () => true,
                        data: () => ({ tosa_apenas_terca: true })
                    }));
                }
                return new Promise(resolve => resolve({
                    exists: () => true,
                    data: () => {
                        return {
                            type: 'shared',
                            petSize: 'M',
                            phone: '31999999999',
                            saldo: {
                                'Banho Master': 10,
                                'Hidratação Vanilla': 2,
                                'Tosa Adicional': 5,
                                'Tosa Higiênica': 5
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

        # Seleciona tosa normal
        page.evaluate("document.querySelector('input[value=\"Tosa\"]').checked = true")
        page.evaluate("document.querySelector('input[value=\"Tosa\"]').dispatchEvent(new Event('change'))")

        page.fill("#petName", "Rex")
        page.fill("#petBreed", "Poodle")

        # forcar ir pro step 2
        page.evaluate("""
            document.getElementById('btn-next').click();
        """)
        time.sleep(1)

        page.click("#appointmentDate")
        time.sleep(1)

        # Tira screenshot calendário bloqueado
        page.screenshot(path="verification/tosa_bloqueada.png", full_page=True)

        # Fecha calendário clicando fora
        page.mouse.click(10, 10)

        page.evaluate("""
            document.getElementById('btn-prev').click();
        """)
        time.sleep(1)

        # Remove tosa normal e poe tosa higienica
        page.evaluate("document.querySelector('input[value=\"Tosa\"]').checked = false")
        page.evaluate("document.querySelector('input[value=\"Tosa\"]').dispatchEvent(new Event('change'))")

        page.evaluate("document.querySelector('input[value=\"Tosa Higiênica\"]').checked = true")
        page.evaluate("document.querySelector('input[value=\"Tosa Higiênica\"]').dispatchEvent(new Event('change'))")

        page.evaluate("""
            document.getElementById('btn-next').click();
        """)
        time.sleep(1)

        page.click("#appointmentDate")
        time.sleep(1)

        # Tira screenshot calendário liberado
        page.screenshot(path="verification/tosa_higienica_liberada.png", full_page=True)

        print("Screenshots saved successfully.")

        browser.close()

if __name__ == "__main__":
    test_agendamento_pacote()

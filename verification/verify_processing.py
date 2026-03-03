from playwright.sync_api import sync_playwright, expect
import time

def test_modal_processing_state(page):
    page.goto("http://localhost:8080/painel-94k2.html")

    page.evaluate("""() => {
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
        // Mock window functions to bypass firebase for now, just to show the UI
        window.updateStatus = async (id, newStatus, btnElement) => {
            if (!confirm(`Tem certeza que deseja alterar o status para ${newStatus}?`)) {
                return;
            }
            let originalText = '';
            if (btnElement) {
                btnElement.disabled = true;
                originalText = btnElement.textContent;
                btnElement.textContent = 'Processando...';
            }
            try {
                // Simulate a network delay of 5 seconds to capture the 'Processando...' state
                await new Promise(r => setTimeout(r, 5000));
                window.closeModal(null, true);
            } catch (e) {
                console.error("Error updating status: ", e);
                alert("Erro ao atualizar status.");
            } finally {
                if (btnElement) {
                    btnElement.disabled = false;
                    btnElement.textContent = originalText;
                }
            }
        };

        // Expose openModal correctly if needed
        window.openModal = window.openModal || function() {};
    }""")

    # We can inject a mock card directly to test the button click independently of Firebase
    page.evaluate("""
        const list = document.getElementById('appointments-list');
        list.innerHTML = `
            <div class="card" id="mock-card">
                <div class="card-header">
                    <span class="status-badge status-agendado">Agendado</span>
                    <h3 class="pet-name">Rex (João)</h3>
                    <div class="pet-info"><strong>Serviços:</strong> Banho e Tosa</div>
                </div>
                <div class="actions">
                    <button class="btn-status" id="test-fila-btn" onclick="updateStatus('mock-id', 'Na Fila', this)">Fila</button>
                    <button class="btn-cancelar" id="test-cancelar-btn" onclick="cancelAppointment('mock-id', this)">❌ Cancelar</button>
                    <button class="btn-concluir" id="test-concluir-btn" onclick="confirmAndComplete('mock-id', this)">✅ Concluir</button>
                </div>
            </div>
        `;
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-panel').style.display = 'block';
    """)

    # Auto accept confirms
    page.on("dialog", lambda dialog: dialog.accept())

    # Wait for our mock button to appear
    fila_button = page.locator('#test-fila-btn')
    page.wait_for_selector('#test-fila-btn', state='visible')

    # Click the 'Fila' button to trigger updateStatus
    fila_button.click()

    # Wait a tiny bit for UI to update text
    page.wait_for_timeout(500)

    # Now verify the state
    expect(fila_button).to_have_text('Processando...')
    expect(fila_button).to_be_disabled()

    # Immediately take a screenshot to verify 'Processando...' state and disabled state
    page.screenshot(path="verification/processing_state.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_modal_processing_state(page)
        finally:
            browser.close()

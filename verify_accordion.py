from playwright.sync_api import Page, expect, sync_playwright

def test_accordion_settings(page: Page):
    # 1. Arrange: Go to the admin panel
    # Using file:// protocol as we are in a local environment without a server for this test
    import os
    file_path = f"file://{os.getcwd()}/painel-94k2.html"
    page.goto(file_path)

    # Handle the password prompt
    page.on("dialog", lambda dialog: dialog.accept("admin123"))

    # Reload to trigger the prompt handler if it happened on load,
    # but since prompt is blocking JS execution, we might need to handle it differently.
    # However, in Playwright, page.on("dialog") should handle it if set before navigation or immediately.
    # For this specific page, the prompt happens in <script> at the top.
    # Let's see if the dialog handler works. If not, we might need to inject script to bypass.

    # Actually, the prompt is right at the start.
    # A more robust way for this specific legacy code structure:
    # We can override the window.prompt before the page loads scripts,
    # but since it is inline script, it executes immediately.
    # Playwright's add_init_script is perfect for this.

    # 2. Navigate to Config Tab
    # Click the "Configurações" tab button
    page.get_by_role("button", name="Configurações").click()

    # 3. Assertions & Actions

    # Check if "Configurações Globais" header exists
    global_header = page.locator(".settings-header").filter(has_text="Configurações Globais")
    expect(global_header).to_be_visible()

    # Check if the body is hidden (collapsed) initially (as per requirement: "todos os cards... 100% fechados")
    # The parent .settings-card should have class 'collapsed'
    global_card = page.locator(".settings-card").filter(has_text="Configurações Globais")
    expect(global_card).to_have_class("settings-card collapsed")

    # Check arrow rotation (visual check via screenshot mostly, but we can check style if needed)
    # arrow = global_header.locator(".arrow-icon")

    # Take screenshot of collapsed state
    page.screenshot(path="/home/jules/verification/accordion_collapsed.png")

    # 4. Interact: Click to expand
    global_header.click()

    # 5. Assert: Class 'collapsed' should be removed
    expect(global_card).not_to_have_class("settings-card collapsed")
    expect(global_card).to_have_class("settings-card")

    # Check visibility of content inside (e.g., label "Capacidade Global...")
    content = page.get_by_text("Capacidade Global de Atendimentos por Horário")
    expect(content).to_be_visible()

    # Take screenshot of expanded state
    page.screenshot(path="/home/jules/verification/accordion_expanded.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Add init script to mock prompt and bypass password check logic
        # The original code redirects if password is wrong.
        # By mocking prompt to return 'admin123', we pass.
        context = browser.new_context()
        context.add_init_script("window.prompt = () => 'admin123';")

        page = context.new_page()
        try:
            test_accordion_settings(page)
            print("Verification script finished successfully.")
        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            browser.close()

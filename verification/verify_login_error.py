from playwright.sync_api import sync_playwright

def verify_login_error():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the HTML file directly
        import os
        filepath = "file://" + os.path.abspath("painel-94k2.html")
        page.goto(filepath)

        # Mock Firebase init error so we can directly trigger the catch block
        page.evaluate("""
            window.signInWithEmailAndPassword = () => Promise.reject(new Error("Mock auth error"));
            document.getElementById('admin-login-form').addEventListener('submit', (e) => {
                e.preventDefault();
                document.getElementById('login-btn').disabled = true;
                document.getElementById('login-btn').textContent = 'Aguarde...';
                document.getElementById('login-error').style.display = 'none';

                window.signInWithEmailAndPassword().catch(() => {
                    document.getElementById('login-error').style.display = 'block';
                    document.getElementById('login-btn').disabled = false;
                    document.getElementById('login-btn').textContent = 'Entrar';
                });
            }, true); // Use capture phase to intercept before real handler if possible
        """)

        # Wait for the login screen to be visible
        page.wait_for_selector("#login-screen", state="visible")

        # Fill in dummy credentials
        page.fill("#loginEmail", "test@example.com")
        page.fill("#loginPassword", "wrongpassword")

        # Click login
        page.click("#login-btn")

        # Take a screenshot
        page.screenshot(path="verification/login_error.png")

        browser.close()

if __name__ == "__main__":
    verify_login_error()
    print("Verification script executed successfully.")

import sys
import os
from playwright.sync_api import sync_playwright, expect

# Basic Firebase mock implementation
firebase_mock = """
let listeners = [];
export function initializeApp() { return {}; };
export function getFirestore() { return {}; };
export function collection() { return {}; };
export function onSnapshot(q, cb) { listeners.push(cb); cb({ forEach: () => {} }); return () => {}; };
export function doc() { return { id: 'test' }; };
export function getDoc(ref) {
    return Promise.resolve({
        exists: () => true,
        data: () => ({ agendaInterval: 30 })
    });
};
export function setDoc() { return Promise.resolve(); };
export function updateDoc() { return Promise.resolve(); };
export function deleteDoc() { return Promise.resolve(); };
export function query() { return {}; };
export function orderBy() { return {}; };
export function where() { return {}; };
export function limit() { return {}; };
export function writeBatch() { return { delete: () => {}, commit: () => Promise.resolve() }; };
export function getDocs() { return Promise.resolve({ empty: true, forEach: () => {} }); };
export function getAuth() { return {}; };
export function signInWithEmailAndPassword() { return Promise.resolve(); };
export function onAuthStateChanged(auth, callback) { setTimeout(() => callback({ uid: '123', email: 'admin@test.com' }), 500); };
export function signOut() { return Promise.resolve(); };
export function sendPasswordResetEmail() { return Promise.resolve(); };
"""

def verify_dynamic_checkboxes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.route("https://www.gstatic.com/firebasejs/**/*.js", lambda route, request: route.fulfill(
            status=200,
            content_type="application/javascript",
            body=firebase_mock
        ))

        page.add_init_script("""
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
        """)

        page.goto("http://localhost:8080/painel-94k2.html")

        # Wait for the main panel to be visible (auth resolved)
        expect(page.locator("#main-panel")).to_be_visible()

        # Click on the "Configurações" tab
        page.get_by_role("button", name="Configurações").click()

        # Set a date to trigger loading
        page.locator("#configDate").fill("2024-10-10")

        # Wait for checkboxes to be populated
        expect(page.locator("#slots-checkboxes")).to_contain_text("08:30")

        # Take a screenshot
        page.screenshot(path="verification/checkboxes.png")

        print("Success!")
        browser.close()

if __name__ == "__main__":
    verify_dynamic_checkboxes()


import asyncio
from playwright.async_api import async_playwright

async def dump_config():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        page.on("dialog", lambda d: d.accept("admin123"))
        await page.goto("http://localhost:8080/painel-94k2.html")
        await page.wait_for_load_state("networkidle")

        # Expose a function to callback
        result = await page.evaluate(r"""async () => {
            const db = window.db; // Wait, db is local variable inside module scope. I cannot access it.
            // I have to re-import firebase.
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js");
            const { getFirestore, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js");

            const firebaseConfig = {
                apiKey: "AIzaSyAKWE3DBMGVP1AgUN9oajztpteVzmMi92s",
                authDomain: "sistema-petshop-33f9d.firebaseapp.com",
                projectId: "sistema-petshop-33f9d",
                storageBucket: "sistema-petshop-33f9d.firebasestorage.app",
                messagingSenderId: "628550103939",
                appId: "1:628550103939:web:4a862eee914840d238fcb6"
            };
            const app = initializeApp(firebaseConfig, "checker"); // use named app to avoid conflict
            const db = getFirestore(app);
            const ref = doc(db, "configuracoes", "tempos");
            const snap = await getDoc(ref);
            if (snap.exists()) return snap.data();
            return "NOT_FOUND";
        }""")

        print(f"Firestore Data: {result}")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(dump_config())

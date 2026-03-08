const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple static server
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath == './') filePath = './index.html';
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
    }
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end();
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});
server.listen(8123);

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // We intercept firebase and return fake objects
    await page.route('**/*.js', async route => {
        const url = route.request().url();
        if (url.includes('firebase')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: `
                    export function initializeApp() { return {}; }
                    export function getFirestore() { return {}; }
                    export function collection() {}
                    export function addDoc() {}
                    export function onSnapshot() {}
                    export function doc() {}
                    export function query() {}
                    export function where() {}
                    export function getDocs() { return { forEach: () => {}, empty: true }; }
                    export function getDoc() { return { exists: () => false }; }
                    export function orderBy() {}
                    export function deleteDoc() {}
                    export function updateDoc() {}
                `
            });
        } else {
            route.continue();
        }
    });

    await page.addInitScript(() => {
        window.__MELLUPET_CONFIG = { firebase: { apiKey: 'test', authDomain: 'test', projectId: 'test' } };
        localStorage.setItem('petshop_owner_phone', '31999999999');
        localStorage.setItem('petshop_owner_name', 'Test');
    });

    await page.goto('http://localhost:8123/index.html');

    console.log("On page");
    await page.waitForSelector('#btn-agendar');
    await page.click('#btn-agendar');

    await page.fill('#petName', 'Rex');
    await page.selectOption('#petSize', 'P');

    await page.evaluate(() => {
        const check = document.querySelector('input[name="serviceOption"]');
        if (check) check.checked = true;
    });

    await page.click('#btn-next');

    // Check state before picking date
    let disabledBefore = await page.evaluate(() => document.getElementById('btn-submit').disabled);
    console.log("Is submit disabled initially on step 2: " + disabledBefore);

    await page.evaluate(() => {
        const d = document.getElementById('appointmentDate');
        d.value = '2024-03-10'; // Sunday
        d.dispatchEvent(new Event('change'));
    });

    await page.waitForTimeout(500);

    const msg = await page.textContent('#slots-container');
    console.log("Slots container msg: " + msg);

    const disabled = await page.evaluate(() => document.getElementById('btn-submit').disabled);
    console.log("Is submit disabled: " + disabled);

    await browser.close();
    server.close();

    if (disabled && msg.includes('Não funcionamos aos domingos') && disabledBefore) {
        console.log("SUCCESS");
    } else {
        process.exit(1);
    }
})();

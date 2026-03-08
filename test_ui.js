const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // We'll mock the window.__MELLUPET_CONFIG to prevent firebase from crashing if we load it statically

    console.log("Patching files for test...");
})();

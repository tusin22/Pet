with open("js/painel-94k2.js", "r") as f:
    content = f.read()

funcs = """
    // --- Custom Modal System ---
    window.showCustomAlert = function(message) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('custom-modal-overlay');
            if(!overlay) { alert(message); resolve(); return; }
            const msgEl = document.getElementById('custom-modal-message');
            const btnsEl = document.getElementById('custom-modal-buttons');

            msgEl.textContent = message;
            btnsEl.innerHTML = `<button class="custom-modal-btn btn-teal" id="custom-modal-ok">OK</button>`;

            overlay.style.display = 'flex';

            document.getElementById('custom-modal-ok').onclick = () => {
                overlay.style.display = 'none';
                resolve();
            };
        });
    };

    window.showCustomConfirm = function(message, isDestructive = false) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('custom-modal-overlay');
            if(!overlay) { resolve(confirm(message)); return; }
            const msgEl = document.getElementById('custom-modal-message');
            const btnsEl = document.getElementById('custom-modal-buttons');

            msgEl.textContent = message;
            const confirmClass = isDestructive ? 'btn-red' : 'btn-teal';

            btnsEl.innerHTML = `
                <button class="custom-modal-btn btn-gray" id="custom-modal-cancel">Voltar</button>
                <button class="custom-modal-btn ${confirmClass}" id="custom-modal-confirm">Confirmar</button>
            `;

            overlay.style.display = 'flex';

            document.getElementById('custom-modal-confirm').onclick = () => {
                overlay.style.display = 'none';
                resolve(true);
            };

            document.getElementById('custom-modal-cancel').onclick = () => {
                overlay.style.display = 'none';
                resolve(false);
            };
        });
    };

    window.showCustomPrompt = function(message) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('custom-modal-overlay');
            if(!overlay) { resolve(prompt(message)); return; }
            const msgEl = document.getElementById('custom-modal-message');
            const btnsEl = document.getElementById('custom-modal-buttons');

            msgEl.textContent = message;

            btnsEl.innerHTML = `
                <input type="text" id="custom-modal-input" style="width: 100%; margin-bottom: 1rem; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                <button class="custom-modal-btn btn-gray" id="custom-modal-cancel" style="width: 48%;">Cancelar</button>
                <button class="custom-modal-btn btn-red" id="custom-modal-confirm" style="width: 48%;">Confirmar</button>
            `;

            overlay.style.display = 'flex';

            const inputEl = document.getElementById('custom-modal-input');
            inputEl.focus();

            document.getElementById('custom-modal-confirm').onclick = () => {
                overlay.style.display = 'none';
                resolve(inputEl.value);
            };

            document.getElementById('custom-modal-cancel').onclick = () => {
                overlay.style.display = 'none';
                resolve(null);
            };
        });
    };
"""

content = content.replace("    const auth = getAuth(app);", "    const auth = getAuth(app);\n" + funcs)

import re
content = re.sub(r'\balert\((.*?)\)', r'await showCustomAlert(\1)', content)
content = re.sub(r'\bconfirm\((.*?)\)', r'await showCustomConfirm(\1)', content)
content = re.sub(r'\bprompt\((.*?)\)', r'await showCustomPrompt(\1)', content)

with open("js/painel-94k2.js", "w") as f:
    f.write(content)

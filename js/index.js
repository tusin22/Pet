import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
    import { getFirestore, collection, addDoc, onSnapshot, doc, query, where, getDocs, getDoc, orderBy, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

    const runtimeConfig = window.__MELLUPET_CONFIG || {};
    const firebaseConfig = runtimeConfig.firebase;

    if (!firebaseConfig) {
        // Can't use custom alert yet, DOM might not be fully loaded or styles applied
        alert('Configuração ausente: crie config/runtime-config.js a partir do arquivo de exemplo.');
        throw new Error('Firebase config ausente em window.__MELLUPET_CONFIG.firebase');
    }

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // --- Custom Modal System ---
    window.showCustomAlert = function(message) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('custom-modal-overlay');
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

    // Navigation & State
    window.showScreen = (screenId) => {
        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        if (screenId === 'schedule-screen') {
            goToStep(1);
            hideFeedback();
        }
    };

    const loginPhoneInput = document.getElementById('loginPhone');
    const loginNameInput = document.getElementById('loginName');

    // Phone Mask Logic
    const applyPhoneMask = (value) => {
        value = value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        if (value.length > 2) value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
        if (value.length > 9) value = `${value.substring(0, 10)}-${value.substring(10)}`;
        return value;
    };

    loginPhoneInput.addEventListener('input', (e) => {
        e.target.value = applyPhoneMask(e.target.value);
    });

    // Check Login State
    const checkLogin = () => {
        const phone = localStorage.getItem('petshop_owner_phone');
        const name = localStorage.getItem('petshop_owner_name');

        if (phone && name) {
            updateGreeting(name);
            showScreen('menu-screen');
        } else {
            showScreen('login-screen');
        }
    };

    // Initialize
    let pricingConfig = {}; // Global variable for pricing
    window.pricingConfig = pricingConfig;

    let serviceDescriptions = {}; // Global variable for descriptions

    // Fetch pricing on load
    async function loadPricingConfig() {
        try {
            const snap = await getDoc(doc(db, "configuracoes", "precos"));
            if (snap.exists()) {
                pricingConfig = snap.data();
                // Migração de compatibilidade de nomes antigos:
                if (pricingConfig["Tosa"] && !pricingConfig["Banho e Tosa"]) {
                    pricingConfig["Banho e Tosa"] = pricingConfig["Tosa"];
                }
                if (pricingConfig["Banho + Tosa"] && !pricingConfig["Banho e Tosa"]) {
                    pricingConfig["Banho e Tosa"] = pricingConfig["Banho + Tosa"];
                }
                window.pricingConfig = pricingConfig;
            }
        } catch (e) {
            console.error("Error loading pricing config:", e);
        }
    }

    // Fetch descriptions on load
    async function loadDescriptionsConfig() {
        try {
            const snap = await getDoc(doc(db, "configuracoes", "descricoes"));
            if (snap.exists()) {
                serviceDescriptions = snap.data();

                // Migração de compatibilidade de nomes antigos:
                if (serviceDescriptions["Tosa"] && !serviceDescriptions["Banho e Tosa"]) {
                    serviceDescriptions["Banho e Tosa"] = serviceDescriptions["Tosa"];
                }
                if (serviceDescriptions["Banho + Tosa"] && !serviceDescriptions["Banho e Tosa"]) {
                    serviceDescriptions["Banho e Tosa"] = serviceDescriptions["Banho + Tosa"];
                }
            }
        } catch (e) {
            console.error("Error loading descriptions config:", e);
        }
    }

    loadPricingConfig();
    loadDescriptionsConfig();
    checkLogin();

    // Expose showScreen globally for inline onclicks
    window.showScreen = showScreen;

    function toLocalISOString(date) {
        const pad = (n) => n < 10 ? '0' + n : n;
        return date.getFullYear() + '-' +
            pad(date.getMonth() + 1) + '-' +
            pad(date.getDate()) + 'T' +
            pad(date.getHours()) + ':' +
            pad(date.getMinutes()) + ':' +
            pad(date.getSeconds());
    }

    function escapeHtml(text) {
        if (!text) return text;
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function updateGreeting(name) {
        const greetingEl = document.getElementById('menu-greeting');
        if (greetingEl) {
             greetingEl.textContent = `Olá, ${name}! Bem-vindo ao MelluPet`;
        }
    }


    // --- Stepper Logic ---
    let currentStep = 1;
    const totalSteps = 3;

    function goToStep(step) {
        currentStep = step;

        // Update Sections
        document.querySelectorAll('.form-section').forEach(el => el.classList.remove('active'));
        document.querySelector(`.section-${step}`).classList.add('active');

        // Update Stepper Visuals
        document.querySelectorAll('.step').forEach((el, index) => {
            if (index + 1 <= step) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });

        // Update Buttons
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');
        const btnSubmit = document.getElementById('btn-submit');

        if (step === 1) {
            btnPrev.style.display = 'none';
            btnNext.style.display = 'block';
            btnSubmit.style.display = 'none';
        } else if (step === totalSteps) {
            btnPrev.style.display = 'block';
            btnNext.style.display = 'none';
            btnSubmit.style.display = 'block';
        } else {
            btnPrev.style.display = 'block';
            btnNext.style.display = 'block';
            btnSubmit.style.display = 'none';
        }
    }

    function validateStep1() {
        const petName = document.getElementById('petName').value.trim();
        const petSize = document.getElementById('petSize').value;
        const checkedServices = document.querySelectorAll('input[name="serviceOption"]:checked').length;

        if (!petName) {
            showFeedback('Por favor, informe o nome do pet.', 'error');
            return false;
        }
        if (!petSize) {
            showFeedback('Por favor, selecione o porte do pet.', 'error');
            return false;
        }
        if (checkedServices === 0) {
            showFeedback('Por favor, selecione pelo menos um serviço.', 'error');
            return false;
        }
        hideFeedback();
        return true;
    }

    function validateStep2() {
        const dateVal = document.getElementById('appointmentDate').value;
        if (!dateVal) {
            showFeedback('Por favor, escolha uma data.', 'error');
            return false;
        }
        if (!selectedSlot) {
            showFeedback('Por favor, selecione um horário disponível.', 'error');
            return false;
        }
        hideFeedback();
        return true;
    }

    document.getElementById('btn-next').addEventListener('click', () => {
        if (currentStep === 1 && !validateStep1()) return;
        if (currentStep === 2 && !validateStep2()) return;
        if (currentStep < totalSteps) goToStep(currentStep + 1);
    });

    document.getElementById('btn-prev').addEventListener('click', () => {
        if (currentStep > 1) goToStep(currentStep - 1);
        hideFeedback();
    });

    // Feedback Messages
    function showFeedback(message, type) {
        const fb = document.getElementById('feedback-message');
        fb.textContent = message;
        fb.className = `feedback-message feedback-${type}`;
        fb.style.display = 'block';
    }

    function hideFeedback() {
        const fb = document.getElementById('feedback-message');
        fb.style.display = 'none';
    }

    // --- Event Listeners ---

    // 1. Login Form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const rawValue = loginPhoneInput.value.replace(/\D/g, '');
        const nameValue = loginNameInput.value.trim();

        if (rawValue.length < 10) {
            await showCustomAlert("Por favor, digite um telefone válido com DDD.");
            return;
        }

        if (nameValue.length < 2) {
            await showCustomAlert("Por favor, digite seu nome.");
            return;
        }

        localStorage.setItem('petshop_owner_phone', rawValue);
        localStorage.setItem('petshop_owner_name', nameValue);

        updateGreeting(nameValue);
        showScreen('menu-screen');
    });

    const servicesList = [
        "Banho Master",
        "Banho e Tosa",
        "Hidratação Vanilla",
        "Hidratação Ouro 24K",
        "SPA Premium",
        "Corte das unhas",
        "Escov. dos dentes",
        "Carding",
        "Desembolo de nós"
    ];

    // Generate Checkboxes
    const servicesContainer = document.getElementById('services-container');
    servicesList.forEach(service => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '0.5rem';

        const isChecked = service === 'Banho Master' ? 'checked' : '';
        div.innerHTML = `
            <input type="checkbox" name="serviceOption" value="${service}" id="srv-${service.replace(/\s+/g, '')}" disabled ${isChecked} style="width: auto; transform: scale(1.2);">
            <label for="srv-${service.replace(/\s+/g, '')}" style="margin: 0; font-weight: normal; cursor: pointer;">${service}</label>
        `;
        servicesContainer.appendChild(div);
    });

    // 2. Menu Buttons
    document.getElementById('btn-agendar').addEventListener('click', () => {
        editingAppointmentId = null;
        document.getElementById('petName').value = '';
        document.getElementById('observations').value = '';

        // Reset and disable checkboxes, but pre-select Banho Master
        document.querySelectorAll('input[name="serviceOption"]').forEach(cb => {
            if (cb.value === 'Banho Master') {
                cb.checked = true;
            } else {
                cb.checked = false;
            }
            cb.disabled = true;
        });

        // Reset labels to default text
        servicesList.forEach(service => {
            const label = document.querySelector(`label[for="srv-${service.replace(/\s+/g, '')}"]`);
            if (label) label.innerHTML = service;
        });

        document.getElementById('price-display').textContent = 'Total Estimado: R$ 0,00';

        document.getElementById('petSize').value = '';
        document.getElementById('paymentMethod').value = '';
        document.getElementById('appointmentDate').value = '';
        document.getElementById('slots-container').innerHTML = '<p class="empty-slots-msg">Selecione o porte, os serviços e a data para ver os horários disponíveis.</p>';
        selectedSlot = null;
        document.querySelector('#schedule-form button[type="submit"]').textContent = 'Confirmar Agendamento';
        showScreen('schedule-screen');
    });

    document.getElementById('btn-meus-pets').addEventListener('click', () => {
        showScreen('my-pets-screen');
        loadMyPets(); // We will implement this function later
    });

    document.getElementById('btn-descricoes').addEventListener('click', () => {
        loadServicesDescription();
        showScreen('services-description-screen');
    });

    document.getElementById('logout-link').addEventListener('click', async (e) => {
        e.preventDefault();
        if(await showCustomConfirm("Deseja realmente sair?")) {
            localStorage.removeItem('petshop_owner_phone');
            localStorage.removeItem('petshop_appointment_id'); // Clear legacy item if exists
            loginPhoneInput.value = '';
            showScreen('login-screen');
        }
    });

    function loadServicesDescription() {
        const tbody = document.getElementById('services-description-tbody');
        tbody.innerHTML = '';

        servicesList.forEach(service => {
            const desc = serviceDescriptions[service] || '';
            let precoP = '-';
            let precoM = '-';
            let precoG = '-';

            if (service === 'Desembolo de nós') {
                precoP = 'Avaliação';
                precoM = 'Avaliação';
                precoG = 'Avaliação';
            } else if (pricingConfig[service]) {
                const data = pricingConfig[service];
                if (data.priceP) precoP = parseFloat(data.priceP).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                if (data.priceM) precoM = parseFloat(data.priceM).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                if (data.priceG) precoG = parseFloat(data.priceG).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(service)}</strong></td>
                <td>${escapeHtml(desc)}</td>
                <td style="white-space: nowrap;">${escapeHtml(precoP)}</td>
                <td style="white-space: nowrap;">${escapeHtml(precoM)}</td>
                <td style="white-space: nowrap;">${escapeHtml(precoG)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- My Pets Logic ---

    let petsUnsubscribe = null;
    const petsListContainer = document.getElementById('pets-list');

    window.loadMyPets = () => {
        const ownerPhone = localStorage.getItem('petshop_owner_phone');
        if (!ownerPhone) return;

        // Unsubscribe previous listener if exists
        if (petsUnsubscribe) {
            petsUnsubscribe();
            petsUnsubscribe = null;
        }

        petsListContainer.innerHTML = '<p style="text-align: center; color: #666;">Carregando...</p>';

        const q = query(
            collection(db, "appointments"),
            where("ownerPhone", "==", ownerPhone)
        );

        petsUnsubscribe = onSnapshot(q, (snapshot) => {
            petsListContainer.innerHTML = '';

            if (snapshot.empty) {
                petsListContainer.innerHTML = '<p style="text-align: center; color: #666;">Você ainda não tem agendamentos.</p>';
                return;
            }

            const activeAppts = [];
            const historyAppts = [];
            const now = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);

            snapshot.forEach(doc => {
                const data = doc.data();
                const appt = { id: doc.id, ...data };
                const s = (data.status || '').toLowerCase();
                const isFinished = s === 'concluído' || s === 'cancelado';

                if (isFinished) {
                    // Check if within last 30 days
                    const apptDate = new Date(data.appointmentTime);
                    if (apptDate >= thirtyDaysAgo) {
                        historyAppts.push(appt);
                    }
                } else {
                    activeAppts.push(appt);
                }
            });

            // Sort Active by Time (Ascending - Next upcoming first)
            activeAppts.sort((a, b) => new Date(a.appointmentTime) - new Date(b.appointmentTime));

            // Sort History by Time (Descending - Most recent first)
            historyAppts.sort((a, b) => new Date(b.appointmentTime) - new Date(a.appointmentTime));

            if (activeAppts.length === 0 && historyAppts.length === 0) {
                 petsListContainer.innerHTML = '<p style="text-align: center; color: #666;">Nenhum agendamento encontrado.</p>';
                 return;
            }

            // Render Active
            activeAppts.forEach(appt => {
                petsListContainer.appendChild(createPetCard(appt, false));
            });

            // Render History Section if exists
            if (historyAppts.length > 0) {
                const title = document.createElement('h3');
                title.className = 'history-section-title';
                title.textContent = 'Histórico Recente';
                petsListContainer.appendChild(title);

                historyAppts.forEach(appt => {
                    petsListContainer.appendChild(createPetCard(appt, true));
                });
            }
        });
    };

    function createPetCard(appt, isHistory) {
        const card = document.createElement('div');
        card.className = `pet-card ${isHistory ? 'history-item' : ''}`;

        const dateObj = new Date(appt.appointmentTime);
        const dateStr = dateObj.toLocaleDateString('pt-BR');
        const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let statusClass = '';
        const lowerStatus = (appt.status || '').toLowerCase();
        if (lowerStatus.includes('agendado')) statusClass = 'status-agendado';
        else if (lowerStatus.includes('fila')) statusClass = 'status-fila';
        else if (lowerStatus.includes('banho')) statusClass = 'status-banho';
        else if (lowerStatus.includes('secando')) statusClass = 'status-secando';
        else if (lowerStatus.includes('pronto')) statusClass = 'status-pronto';
        else if (lowerStatus.includes('concluído')) statusClass = 'status-concluido';
        else if (lowerStatus.includes('cancelado')) statusClass = 'status-cancelado';

        let buttonsHtml = '';
        if (!isHistory) {
            // Use data-obs to store the raw observation safely in the DOM attribute
            // We escape only double quotes for the attribute value itself (handled by setAttribute if we did that, but innerHTML needs manual escaping)
            const obsAttr = (appt.observations || '').replace(/"/g, '&quot;');

            // For petName in onclick, we escape backslashes and single quotes
            const petNameSafe = (appt.petName || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

            buttonsHtml = `
                <div class="card-actions">
                    <button class="btn-small btn-edit" data-obs="${obsAttr}" onclick="prepareEdit('${appt.id}', '${petNameSafe}', this.getAttribute('data-obs'))">Alterar</button>
                    <button class="btn-small btn-cancel" onclick="cancelAppointment('${appt.id}')">Cancelar</button>
                </div>
            `;
        }

        let obsHtml = '';
        if (appt.observations) {
            obsHtml = `<p style="margin-top: 0.5rem; color: #666; font-style: italic;">⚠️ ${escapeHtml(appt.observations)}</p>`;
        }

        card.innerHTML = `
            <h3>${escapeHtml(appt.petName)}</h3>
            <p><strong>Data:</strong> ${dateStr} às ${timeStr}</p>
            <div class="status-badge ${statusClass}">${appt.status}</div>
            ${obsHtml}
            ${buttonsHtml}
        `;
        return card;
    }

    window.cancelAppointment = async (id) => {
        if (!(await showCustomConfirm("Tem certeza que deseja cancelar este agendamento?", true))) return;
        try {
            const docRef = doc(db, "appointments", id);
            await updateDoc(docRef, {
                status: 'Cancelado'
            });
            await showCustomAlert("Agendamento cancelado. O horário foi liberado.");
        } catch (e) {
            console.error("Error canceling: ", e);
            await showCustomAlert("Erro ao cancelar. Tente novamente.");
        }
    };

    // --- Schedule Logic ---

    let editingAppointmentId = null;

    window.prepareEdit = async (id, petName, observations) => {
        editingAppointmentId = id;
        document.getElementById('petName').value = petName;
        document.getElementById('observations').value = observations || '';

        // Reset checkboxes
        document.querySelectorAll('input[name="serviceOption"]').forEach(cb => {
            cb.checked = false;
            cb.disabled = true; // Initially disabled until size is set
        });

        // Fetch full document to get extra fields not passed in arguments
        try {
            const docRef = doc(db, "appointments", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();

                // Set Size First (Important for UI update)
                document.getElementById('petSize').value = data.petSize || '';

                // Enable checkboxes if size is present
                if (data.petSize) {
                    document.querySelectorAll('input[name="serviceOption"]').forEach(cb => cb.disabled = false);
                }

                // Handle new array based services or fallback to string
                if (Array.isArray(data.services)) {
                    data.services.forEach(srv => {
                        const cb = document.querySelector(`input[name="serviceOption"][value="${srv}"]`);
                        if (cb) cb.checked = true;
                    });
                } else if (data.serviceType) {
                    // Legacy support: check if serviceType exists in our list
                    const cb = document.querySelector(`input[name="serviceOption"][value="${data.serviceType}"]`);
                    if (cb) cb.checked = true;
                }

                document.getElementById('paymentMethod').value = data.paymentMethod || '';

                // Update UI Texts and Totals
                updateServiceUI();
                await calculateTotalAndDuration();
            }
        } catch (e) {
            console.error("Error fetching appointment for edit:", e);
        }

        // Reset date/slots because user needs to pick new ones
        document.getElementById('slots-container').innerHTML = '<p class="empty-slots-msg">Selecione o porte, os serviços e a data para ver os horários disponíveis.</p>';
        selectedSlot = null;

        // Trigger logic if fields are already filled (e.g. from existing data)
        checkAndGenerateSlots();

        // Update UI
        const submitBtn = document.getElementById('btn-submit');
        submitBtn.textContent = 'Salvar Alteração';

        showScreen('schedule-screen');
    };

    // --- Schedule Logic ---

    const scheduleForm = document.getElementById('schedule-form');
    const appointmentDateInput = document.getElementById('appointmentDate');
    const slotsContainer = document.getElementById('slots-container');
    const petSizeInput = document.getElementById('petSize');

    let selectedSlot = null;
    let currentTotalValue = 0;
    let currentTotalDuration = 0;

    // Listen to changes
    petSizeInput.addEventListener('change', () => {
        // Enable checkboxes when size is selected
        document.querySelectorAll('input[name="serviceOption"]').forEach(cb => cb.disabled = false);

        updateServiceUI();
        calculateTotalAndDuration();
        checkAndGenerateSlots();
    });

    appointmentDateInput.addEventListener('change', checkAndGenerateSlots);

    // Listen to all checkboxes
    document.querySelectorAll('input[name="serviceOption"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            // Lógica de exclusão mútua
            if (e.target.checked) {
                if (e.target.value === 'Banho e Tosa') {
                    const masterCb = document.querySelector('input[name="serviceOption"][value="Banho Master"]');
                    if (masterCb) masterCb.checked = false;
                } else if (e.target.value === 'Banho Master') {
                    const tosaCb = document.querySelector('input[name="serviceOption"][value="Banho e Tosa"]');
                    if (tosaCb) tosaCb.checked = false;
                }
            }

            updateServiceUI();
            calculateTotalAndDuration();
            checkAndGenerateSlots();
        });
    });

    // Function to update UI labels dynamically
    function updateServiceUI() {
        const size = petSizeInput.value;
        if (!size) return;

        const selectedCount = document.querySelectorAll('input[name="serviceOption"]:checked').length;
        const applyDiscount = selectedCount >= 2;

        // Helper to count valid services for discount (excluding Desembolo)
        // Re-calculate this here to be precise inside the loop if needed, but 'applyDiscount' passed down
        // assumes total count. We need to be careful.
        // The rule is: if you have 2+ services (excluding Desembolo), you get discount on those services.
        // Desembolo never gets discount and doesn't count towards the 2+ requirement.

        // Let's recount strictly for logic correctness
        const selectedCheckboxes = document.querySelectorAll('input[name="serviceOption"]:checked');
        const validServicesForDiscount = Array.from(selectedCheckboxes).filter(cb => cb.value !== 'Desembolo de nós');
        const validCount = validServicesForDiscount.length;
        const discountActive = validCount >= 2;

        servicesList.forEach(service => {
            const label = document.querySelector(`label[for="srv-${service.replace(/\s+/g, '')}"]`);
            if (!label) return;

            if (service === 'Desembolo de nós') {
                label.innerHTML = 'Desembolo de nós - Necessário avaliação';
                return;
            }

            const data = pricingConfig[service];
            if (!data) return;

            let basePrice = 0;
            if (size === 'P') basePrice = parseFloat(data.priceP) || 0;
            else if (size === 'M') basePrice = parseFloat(data.priceM) || 0;
            else if (size === 'G') basePrice = parseFloat(data.priceG) || 0;

            const discountPercent = parseFloat(data.discount) || 0;
            const finalPrice = discountActive ? basePrice * (1 - (discountPercent / 100)) : basePrice;

            const baseFmt = basePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const finalFmt = finalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            if (discountActive && discountPercent > 0) {
                 label.innerHTML = `${service} - <s>${baseFmt}</s> <b>${finalFmt}</b>`;
            } else {
                 label.innerHTML = `${service} - ${baseFmt}`;
            }
        });
    }

    async function calculateTotalAndDuration() {
        const selectedCheckboxes = document.querySelectorAll('input[name="serviceOption"]:checked');
        const count = selectedCheckboxes.length;
        const size = petSizeInput.value;
        const priceDisplay = document.getElementById('price-display');

        if (count === 0) {
            if(priceDisplay) priceDisplay.textContent = 'Total Estimado: R$ 0,00';
            currentTotalValue = 0;
            currentTotalDuration = 0;
            return;
        }

        if(priceDisplay) priceDisplay.textContent = 'Calculando...';

        try {
            // Fetch Times only (Prices are cached)
            const timeSnap = await getDoc(doc(db, "configuracoes", "tempos"));

            let totalPrice = 0;
            let totalDuration = 0;

            const timeData = timeSnap.exists() ? timeSnap.data() : {};
            const serviceTimes = (timeData.services || {});
            // Migração de compatibilidade de nomes antigos:
            if (serviceTimes["Tosa"] && !serviceTimes["Banho e Tosa"]) {
                serviceTimes["Banho e Tosa"] = serviceTimes["Tosa"];
            }
            if (serviceTimes["Banho + Tosa"] && !serviceTimes["Banho e Tosa"]) {
                serviceTimes["Banho e Tosa"] = serviceTimes["Banho + Tosa"];
            }
            const sizeExtras = (timeData.sizes || {});

            // Filter for discount logic
            const validServicesForDiscount = Array.from(selectedCheckboxes).filter(cb => cb.value !== 'Desembolo de nós');
            const validCount = validServicesForDiscount.length;
            const discountActive = validCount >= 2;
            let hasDesembolo = false;

            selectedCheckboxes.forEach(cb => {
                const serviceName = cb.value;
                if (serviceName === 'Desembolo de nós') {
                    hasDesembolo = true;
                    // Desembolo adds 0 price, but adds time
                }

                // Price Logic (Use Cached Config)
                if (pricingConfig[serviceName]) {
                    let base = 0;
                    if (size === 'P') base = parseFloat(pricingConfig[serviceName].priceP) || 0;
                    else if (size === 'M') base = parseFloat(pricingConfig[serviceName].priceM) || 0;
                    else if (size === 'G') base = parseFloat(pricingConfig[serviceName].priceG) || 0;

                    const discount = parseFloat(pricingConfig[serviceName].discount) || 0;

                    // Desembolo never gets a price from DB (it's 0 effectively) and never gets discount
                    if (serviceName !== 'Desembolo de nós') {
                        if (discountActive) {
                            // Apply Discount
                            totalPrice += base * (1 - (discount / 100));
                        } else {
                            // Full Price
                            totalPrice += base;
                        }
                    }
                }

                // Time Logic (Sum of all services)
                if (serviceTimes[serviceName]) {
                    totalDuration += parseInt(serviceTimes[serviceName]);
                } else {
                    totalDuration += 30; // Default fallback
                }
            });

            // Add Size Extra Time
            if (size && sizeExtras[size]) {
                totalDuration += parseInt(sizeExtras[size]);
            }

            currentTotalValue = totalPrice;
            currentTotalDuration = totalDuration;

            let totalText = `Total Estimado: ${totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
            if (hasDesembolo) {
                totalText += ' + Avaliação';
            }
            if(priceDisplay) priceDisplay.textContent = totalText;

            // Update the new fixed Order Summary
            const summaryPrice = document.querySelector('#order-summary .summary-price');
            const summaryServices = document.getElementById('summary-services');
            const summaryTime = document.getElementById('summary-time');

            if (summaryPrice) {
                summaryPrice.textContent = hasDesembolo ? totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + ' + Avaliação' : totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
            if (summaryServices) {
                const serviceNames = Array.from(selectedCheckboxes).map(cb => cb.value).join(', ');
                summaryServices.textContent = serviceNames || 'Nenhum serviço selecionado';
            }
            if (summaryTime) {
                const hours = Math.floor(totalDuration / 60);
                const mins = totalDuration % 60;
                let timeText = '';
                if (hours > 0) timeText += `${hours}h `;
                if (mins > 0) timeText += `${mins}m`;
                summaryTime.textContent = 'Duração: ' + (hasDesembolo ? 'Tempo indefinido' : (timeText || '--'));
            }

        } catch (e) {
            console.error("Error calculating total:", e);
            if(priceDisplay) priceDisplay.textContent = 'Erro ao calcular';
        }
    }

    async function checkAndGenerateSlots() {
        const dateVal = appointmentDateInput.value;
        const selectedCheckboxes = document.querySelectorAll('input[name="serviceOption"]:checked');
        const size = petSizeInput.value;

        if (!dateVal || selectedCheckboxes.length === 0 || !size) {
            slotsContainer.innerHTML = '<p class="empty-slots-msg">Selecione o porte, os serviços e a data para ver os horários disponíveis.</p>';
            return;
        }

        const selectedDate = new Date(dateVal + 'T00:00:00');
        const today = new Date();
        today.setHours(0,0,0,0);

        // Check if Sunday (0)
        if (selectedDate.getDay() === 0) {
            await showCustomAlert("Não funcionamos aos domingos.");
            appointmentDateInput.value = '';
            slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; font-size: 0.9rem;">Selecione Serviço, Porte e Data para ver os horários.</p>';
            return;
        }

        if (selectedDate < today) {
            await showCustomAlert("Por favor, selecione uma data futura.");
            appointmentDateInput.value = '';
            slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; font-size: 0.9rem;">Selecione Serviço, Porte e Data para ver os horários.</p>';
            return;
        }

        await generateSlots(dateVal);
    }

    async function generateSlots(dateString) {
        slotsContainer.innerHTML = '<p class="loading" style="grid-column: 1/-1;">Calculando disponibilidade...</p>';
        selectedSlot = null;

        try {
            // Ensure duration is calculated
            if (currentTotalDuration === 0) await calculateTotalAndDuration();

            // 1. Fetch Configuration (Capacity & Times)
            let capacity = 1;
            let agendaInterval = 30; // Default

            // Fetch global settings and times in parallel
            const [globalConfigSnap, timeConfigSnap] = await Promise.all([
                getDoc(doc(db, "configuracoes", "geral")),
                getDoc(doc(db, "configuracoes", "tempos"))
            ]);

            if (globalConfigSnap.exists() && globalConfigSnap.data().capacityPerSlot) {
                capacity = globalConfigSnap.data().capacityPerSlot;
            }

            if (timeConfigSnap.exists()) {
                const tData = timeConfigSnap.data();
                if (tData.agendaInterval) agendaInterval = parseInt(tData.agendaInterval);
            }

            // Use calculated global duration
            const totalDuration = currentTotalDuration;
            // Round up slots needed
            const slotsNeeded = Math.ceil(totalDuration / agendaInterval);

            // 2. Fetch Day Configuration (Blocked Slots)
            const configRef = doc(db, "configuracoes", dateString);
            const configSnap = await getDoc(configRef);
            let blockedAllDay = false;
            const blockedSlots = new Set();

            if (configSnap.exists()) {
                const configData = configSnap.data();
                if (configData.capacityPerSlot) capacity = parseInt(configData.capacityPerSlot); // Override global
                if (configData.blockedAllDay) blockedAllDay = true;
                if (configData.blockedSlots && Array.isArray(configData.blockedSlots)) {
                    configData.blockedSlots.forEach(s => blockedSlots.add(s));
                }
            }

            if (blockedAllDay) {
                 slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #d32f2f; font-weight: bold;">Fechado neste dia.</p>';
                 return;
            }

            // 3. Fetch Appointments
            const startOfDay = `${dateString}T00:00`;
            const endOfDay = `${dateString}T23:59`;

            const q = query(
                collection(db, "appointments"),
                where("appointmentTime", ">=", startOfDay),
                where("appointmentTime", "<=", endOfDay)
            );

            const querySnapshot = await getDocs(q);

            // Generate All Time Slots (08:00 to 18:00)
            const allSlots = [];
            const startHour = 8;
            const endHour = 18; // Work until 18:00

            let currentTime = new Date(`${dateString}T08:00:00`);
            const endTimeDate = new Date(`${dateString}T18:00:00`);

            while (currentTime < endTimeDate) {
                const hours = currentTime.getHours().toString().padStart(2, '0');
                const minutes = currentTime.getMinutes().toString().padStart(2, '0');
                allSlots.push(`${hours}:${minutes}`);
                currentTime.setMinutes(currentTime.getMinutes() + agendaInterval);
            }

            // Map Occupancy
            // map[timeSlot] = count
            const occupancy = {};
            allSlots.forEach(s => occupancy[s] = 0);

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.status !== 'Cancelado' && data.appointmentTime) {
                    if (editingAppointmentId && doc.id === editingAppointmentId) return;

                    const timePart = data.appointmentTime.split('T')[1];
                    // If old appointment has no slotsNeeded, assume 1
                    const apptSlotsNeeded = data.slotsNeeded || 1;

                    // Mark slots as occupied
                    const startIndex = allSlots.indexOf(timePart);
                    if (startIndex !== -1) {
                        for (let i = 0; i < apptSlotsNeeded; i++) {
                            const slotTime = allSlots[startIndex + i];
                            if (slotTime) {
                                occupancy[slotTime] = (occupancy[slotTime] || 0) + 1;
                            }
                        }
                    }
                }
            });

            // 4. Render Buttons
            const now = new Date();
            const isToday = (new Date(dateString + 'T00:00:00').toDateString() === now.toDateString());
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            slotsContainer.innerHTML = '';

            if (allSlots.length === 0) {
                 slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">Não há horários configurados.</p>';
                 return;
            }

            allSlots.forEach((time, index) => {
                // Determine availability for THIS starting slot
                // To start at 'time', we need 'slotsNeeded' consecutive slots to be available
                // AND not go beyond end of day (18:00)

                let canBook = true;
                let failureReason = ''; // 'full', 'past', 'blocked', 'eod'

                // Check Past
                if (isToday) {
                    const [h, m] = time.split(':').map(Number);
                    if (h < currentHour || (h === currentHour && m < currentMinute)) {
                        canBook = false;
                        failureReason = 'past';
                    }
                }

                // Check End of Day
                if (canBook) {
                    if (index + slotsNeeded > allSlots.length) {
                        canBook = false;
                        failureReason = 'eod'; // Not enough time left in day
                    }
                }

                // Check Consecutive Slots Availability
                if (canBook) {
                    for (let i = 0; i < slotsNeeded; i++) {
                        const checkTime = allSlots[index + i];

                        // Check Blocked
                        if (blockedSlots.has(checkTime)) {
                            canBook = false;
                            failureReason = 'blocked';
                            break;
                        }

                        // Check Capacity
                        if ((occupancy[checkTime] || 0) >= capacity) {
                            canBook = false;
                            failureReason = 'full';
                            break;
                        }
                    }
                }

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'slot-btn';
                btn.textContent = time;
                const fullIso = `${dateString}T${time}`;

                if (!canBook) {
                    btn.disabled = true;
                    if (failureReason === 'eod') btn.style.display = 'none'; // Don't show slots that can't fit the service at end of day
                    else if (failureReason === 'blocked') btn.title = "Horário indisponível (Admin)";
                    else if (failureReason === 'full') btn.title = "Horário esgotado";
                    else if (failureReason === 'past') btn.title = "Horário já passou";

                    // Allow showing past/full slots disabled, but EOD usually hidden or disabled
                    if (failureReason === 'eod') {
                        // Optional: you might want to show them disabled instead of hiding
                        btn.style.display = 'inline-block';
                        btn.title = "Não há tempo suficiente antes de fechar";
                    }
                } else {
                    btn.onclick = () => selectSlot(btn, fullIso, totalDuration, slotsNeeded);
                }

                slotsContainer.appendChild(btn);
            });

        } catch (error) {
            console.error("Erro ao carregar horários:", error);
            slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Erro ao carregar horários. Tente novamente.</p>';
        }
    }

    let currentSelectionData = {};

    function selectSlot(btn, fullIso, duration, slotsNeeded) {
        const prev = slotsContainer.querySelector('.selected');
        if (prev) prev.classList.remove('selected');
        btn.classList.add('selected');
        selectedSlot = fullIso;
        currentSelectionData = { duration, slotsNeeded };
    }

    scheduleForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateStep1() || !validateStep2()) {
            return;
        }

        const submitBtn = scheduleForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Aguardando...';

        try {
            const petName = document.getElementById('petName').value;
            const observations = document.getElementById('observations').value;

            // Get selected services
            const selectedServices = [];
            document.querySelectorAll('input[name="serviceOption"]:checked').forEach(cb => selectedServices.push(cb.value));

            const petSize = document.getElementById('petSize').value;
            const paymentMethod = document.getElementById('paymentMethod').value;
            const ownerPhone = localStorage.getItem('petshop_owner_phone'); // Get from storage
            const ownerName = localStorage.getItem('petshop_owner_name');

            if (selectedServices.length === 0) {
                showFeedback("Selecione pelo menos um serviço.", "error");
                return;
            }
            if (!selectedSlot) {
                showFeedback("Por favor, selecione um horário.", "error");
                return;
            }
            if (!ownerPhone) {
                showFeedback("Erro: Telefone não encontrado. Faça login novamente.", "error");
                setTimeout(() => showScreen('login-screen'), 2000);
                return;
            }

            const appointmentTime = selectedSlot;
            // Get duration/slots data from current selection
            const { duration, slotsNeeded } = currentSelectionData;

            try {
                // We should re-verify capacity here properly, but for now we rely on the generateSlots check + Firestore concurrency would be better handled with transactions.
                // Given the requirement to check capacity "immediately before write", let's do a simple check.

                // Fetch Appointments to check collision
                const datePart = appointmentTime.split('T')[0];
                const startOfDay = `${datePart}T00:00`;
                const endOfDay = `${datePart}T23:59`;

                // Note: Ideally we repeat the logic from generateSlots here to be 100% sure.
                // For this implementation, we will trust the UI state but do a quick check on the starting slot
                // To be robust, we really should fetch the whole day again or use a transaction.
                // Let's implement a robust check.

                // 1. Fetch Config
                let capacity = 1;
                const globalConfigRef = doc(db, "configuracoes", "geral");
                const globalConfigSnap = await getDoc(globalConfigRef);
                if (globalConfigSnap.exists() && globalConfigSnap.data().capacityPerSlot) {
                    capacity = globalConfigSnap.data().capacityPerSlot;
                }

                const dayConfigSnap = await getDoc(doc(db, "configuracoes", datePart));
                if (dayConfigSnap.exists() && dayConfigSnap.data().capacityPerSlot) {
                    capacity = parseInt(dayConfigSnap.data().capacityPerSlot);
                }

                // 2. Fetch Existing Appointments
                const qCheck = query(
                    collection(db, "appointments"),
                    where("appointmentTime", ">=", startOfDay),
                    where("appointmentTime", "<=", endOfDay)
                );
                const checkSnap = await getDocs(qCheck);

                // Build Occupancy Map
                // We need to know intervals. Assuming we can get interval from Config again or pass it.
                // Let's fetch interval again to be safe.
                let agendaInterval = 30;
                const timeConfigSnap = await getDoc(doc(db, "configuracoes", "tempos"));
                if (timeConfigSnap.exists() && timeConfigSnap.data().agendaInterval) {
                    agendaInterval = parseInt(timeConfigSnap.data().agendaInterval);
                }

                const allSlots = [];
                let t = new Date(`${datePart}T08:00:00`);
                const eTime = new Date(`${datePart}T18:00:00`);
                while (t < eTime) {
                    const h = t.getHours().toString().padStart(2,'0');
                    const m = t.getMinutes().toString().padStart(2,'0');
                    allSlots.push(`${h}:${m}`);
                    t.setMinutes(t.getMinutes() + agendaInterval);
                }

                const occupancy = {};
                allSlots.forEach(s => occupancy[s] = 0);

                checkSnap.forEach(d => {
                    const data = d.data();
                    if (data.status !== 'Cancelado' && data.appointmentTime) {
                        if (editingAppointmentId && d.id === editingAppointmentId) return; // Ignore self

                        const timePart = data.appointmentTime.split('T')[1];
                        const apptSlots = data.slotsNeeded || 1;
                        const idx = allSlots.indexOf(timePart);
                        if (idx !== -1) {
                            for(let i=0; i<apptSlots; i++) {
                                const st = allSlots[idx+i];
                                if(st) occupancy[st] = (occupancy[st] || 0) + 1;
                            }
                        }
                    }
                });

                // Check requested slots
                const reqTimePart = appointmentTime.split('T')[1];
                const startIdx = allSlots.indexOf(reqTimePart);

                let isBlocked = false;
                if (startIdx === -1) isBlocked = true; // Invalid time
                else {
                    for(let i=0; i<slotsNeeded; i++) {
                        const checkTime = allSlots[startIdx + i];
                        if (!checkTime || (occupancy[checkTime] || 0) >= capacity) {
                            isBlocked = true;
                            break;
                        }
                    }
                }

                if (isBlocked) {
                    showFeedback("Ops! Esse horário acabou de ser reservado ou não há vagas suficientes. Por favor, escolha outro.", "error");
                    // Voltar para etapa 2 para escolher outro horario
                    goToStep(2);
                    checkAndGenerateSlots();
                    return;
                }

                const dataToSave = {
                    petName: petName,
                    observations: observations,
                    services: selectedServices,
                    // Legacy field fallback (first service)
                    serviceType: selectedServices[0],
                    totalValue: currentTotalValue,
                    petSize: petSize,
                    paymentMethod: paymentMethod,
                    appointmentTime: appointmentTime,
                    status: 'Agendado',
                    durationMinutes: duration,
                    slotsNeeded: slotsNeeded
                };

                if (editingAppointmentId) {
                     const docRef = doc(db, "appointments", editingAppointmentId);
                     await updateDoc(docRef, dataToSave);
                     await showCustomAlert('Agendamento alterado com sucesso!');
                } else {
                    dataToSave.ownerPhone = ownerPhone;
                    dataToSave.ownerName = ownerName || "Nome não informado";
                    dataToSave.createdAt = toLocalISOString(new Date());

                    await addDoc(collection(db, "appointments"), dataToSave);
                    await showCustomAlert('Agendamento realizado com sucesso!');
                }

                // Cleanup
                editingAppointmentId = null;
                document.querySelector('#schedule-form button[type="submit"]').textContent = 'Confirmar Agendamento';

                // Clear form
                document.getElementById('petName').value = '';
                document.getElementById('observations').value = '';
                document.querySelectorAll('input[name="serviceOption"]').forEach(cb => cb.checked = false);
                document.getElementById('price-display').textContent = 'Total Estimado: R$ 0,00';
                const summaryPrice = document.querySelector('#order-summary .summary-price');
                if (summaryPrice) summaryPrice.textContent = 'R$ 0,00';
                const summaryServices = document.getElementById('summary-services');
                if (summaryServices) summaryServices.textContent = 'Nenhum serviço selecionado';
                const summaryTime = document.getElementById('summary-time');
                if (summaryTime) summaryTime.textContent = 'Duração: --';

                document.getElementById('petSize').value = '';
                document.getElementById('paymentMethod').value = '';
                appointmentDateInput.value = '';
                slotsContainer.innerHTML = '<p class="empty-slots-msg">Selecione o porte, os serviços e a data para ver os horários disponíveis.</p>';
                selectedSlot = null;

                // Redirect
                showScreen('my-pets-screen');
                loadMyPets();

            } catch (e) {
                console.error("Error saving document: ", e);
                await showCustomAlert("Erro ao salvar. Tente novamente.");
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const runtimeConfig = window.__MELLUPET_CONFIG || {};
const firebaseConfig = runtimeConfig.firebase;

if (!firebaseConfig) {
    throw new Error('Configuração ausente: crie config/runtime-config.js a partir do arquivo de exemplo.');
}

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

// Authentication / Storage Check
const ownerPhone = localStorage.getItem('petshop_owner_phone');
const ownerName = localStorage.getItem('petshop_owner_name');

if (!ownerPhone) {
    window.location.href = 'index.html';
}

// Get walletId from URL
const urlParams = new URLSearchParams(window.location.search);
const walletId = urlParams.get('walletId');

if (!walletId) {
    window.location.href = 'index.html';
}

// Global state
let pricingConfig = {};
let walletData = null;

const servicesListAll = [
    "Banho Master",
    "Banho e Tosa",
    "Tosa", // Substituirá Banho e Tosa se não houver saldo
    "Hidratação Vanilla",
    "Hidratação Ouro 24K",
    "Tosa Higiênica",
    "Corte das unhas",
    "Escov. dos dentes",
    "Carding",
    "Desembolo de nós"
];

// Load configs and wallet
async function init() {
    try {
        const [priceSnap, walletSnap] = await Promise.all([
            getDoc(doc(db, "configuracoes", "precos")),
            getDoc(doc(db, "carteiras", walletId))
        ]);

        if (priceSnap.exists()) {
            pricingConfig = priceSnap.data();
            if (pricingConfig["Tosa"] && !pricingConfig["Banho e Tosa"]) pricingConfig["Banho e Tosa"] = pricingConfig["Tosa"];
            if (pricingConfig["Banho + Tosa"] && !pricingConfig["Banho e Tosa"]) pricingConfig["Banho e Tosa"] = pricingConfig["Banho + Tosa"];
            if (pricingConfig["SPA Premium"] && !pricingConfig["Tosa Higiênica"]) pricingConfig["Tosa Higiênica"] = pricingConfig["SPA Premium"];
        }

        if (walletSnap.exists()) {
            walletData = walletSnap.data();
            if (walletData.phone !== ownerPhone) {
                await showCustomAlert("Você não tem permissão para usar este pacote.");
                window.location.href = 'index.html';
                return;
            }
            renderFormBasedOnWallet();
        } else {
            await showCustomAlert("Pacote não encontrado.");
            window.location.href = 'index.html';
        }
    } catch (e) {
        console.error("Erro na inicialização:", e);
        await showCustomAlert("Erro ao carregar dados do pacote.");
        window.location.href = 'index.html';
    }
}

// --- Stepper Logic ---
let currentStep = 1;
const totalSteps = 2;

function goToStep(step) {
    currentStep = step;
    document.querySelectorAll('.form-section').forEach(el => el.classList.remove('active'));
    document.querySelector(`.section-${step}`).classList.add('active');

    document.querySelectorAll('.step').forEach((el, index) => {
        if (index + 1 <= step) el.classList.add('active');
        else el.classList.remove('active');
    });

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

// Render UI based on wallet logic
function renderFormBasedOnWallet() {
    const titleEl = document.getElementById('wallet-info-subtitle');
    const petNameInput = document.getElementById('petName');
    const petSizeInput = document.getElementById('petSize');

    // Set title and lock fields if individual
    if (walletData.type === 'individual') {
        titleEl.textContent = `Pacote Individual - Pet: ${walletData.petName}`;
        petNameInput.value = walletData.petName;
        petNameInput.readOnly = true;
        petNameInput.style.backgroundColor = '#f0f0f0';
        petSizeInput.value = walletData.petSize || '';
    } else {
        titleEl.textContent = `Pacote Compartilhado - Porte: ${walletData.petSize}`;
        petSizeInput.value = walletData.petSize;
    }

    // O porte vem sempre 100% travado
    petSizeInput.disabled = true;

    renderServicesList();

    // Trigger update calculation manually after setting up
    updateServiceUI();
    calculateTotalAndDuration();
    checkAndGenerateSlots();
}

function renderServicesList() {
    const pkgContainer = document.getElementById('package-services-container');
    const extraContainer = document.getElementById('extra-services-container');

    pkgContainer.innerHTML = '';
    extraContainer.innerHTML = '';

    const saldo = walletData.saldo || {};
    const packageItems = [];
    const extraItems = [];

    servicesListAll.forEach(service => {
        // Exceção: Banho e Tosa nunca está no pacote por padrão na regra, mas pode estar se adicionarem depois.
        // A regra diz: "APENAS o 'Banho' (Master) deve vir marcado por padrão se houver saldo"

        // Impede que 'Banho e Tosa' vá para a lista de extras (será substituído visualmente e logicamente por 'Tosa' nos extras)
        if (service === 'Banho e Tosa') {
             if (saldo[service] && saldo[service] > 0) {
                 packageItems.push({ name: service, count: saldo[service] });
             }
             return; // Pula o Banho e Tosa, ele não pode ser extra
        }

        if (saldo[service] && saldo[service] > 0) {
            packageItems.push({ name: service, count: saldo[service] });
        } else {
            // Se for Tosa, só deve aparecer se for listado como extra
            extraItems.push(service);
        }
    });

    if (packageItems.length === 0) {
        pkgContainer.innerHTML = '<p style="color:red; text-align:center;">Seu pacote não tem mais créditos disponíveis.</p>';
    }

    packageItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'service-item-pack';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '0.5rem';

        const isBanhoMaster = item.name === 'Banho Master';
        // Se for Banho Master e tiver saldo, trava selecionado
        const isChecked = isBanhoMaster ? 'checked' : '';
        const isDisabled = isBanhoMaster ? 'disabled' : ''; // Prevent unchecking base

        // Note: we use "disabled" but we must submit its value, so we handle it on submit or use readonly.
        // Alternatively, let them click but preventDefault if it's the only bath.
        // We will just let the standard logic handle mutual exclusion and locking "Banho Master" if no other bath.

        div.innerHTML = `
            <input type="checkbox" name="serviceOption" value="${item.name}" data-is-package="true" id="srv-${item.name.replace(/\s+/g, '')}" ${isChecked} style="width: auto; transform: scale(1.2);">
            <label for="srv-${item.name.replace(/\s+/g, '')}" style="margin: 0; font-weight: normal; cursor: pointer; flex: 1;">
                ${item.name} <span style="color:#666; font-size:0.85rem;">(Saldo: ${item.count})</span>
            </label>
            <span class="free-badge">R$ 0,00</span>
        `;
        pkgContainer.appendChild(div);
    });

    extraItems.forEach(service => {
        // Tosa é extra, não deve aparecer se for do pacote (o saldo vem como 'Banho e Tosa')
        // Então deixamos passar apenas os que estão em extraItems
        const div = document.createElement('div');
        div.className = 'service-item-extra';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '0.5rem';

        if (service === 'Desembolo de nós') {
            div.innerHTML = `
                <input type="checkbox" name="serviceOption" value="${service}" data-is-package="false" data-price="15" id="srv-${service.replace(/\s+/g, '')}" style="width: auto; transform: scale(1.2);">
                <label for="srv-${service.replace(/\s+/g, '')}" id="lbl-${service.replace(/\s+/g, '')}" style="margin: 0; font-weight: normal; cursor: pointer; flex: 1;">
                    Desembolo de nós - a partir de R$ 15,00 (necessário avaliação)
                </label>
            `;
        } else {
            div.innerHTML = `
                <input type="checkbox" name="serviceOption" value="${service}" data-is-package="false" id="srv-${service.replace(/\s+/g, '')}" style="width: auto; transform: scale(1.2);">
                <label for="srv-${service.replace(/\s+/g, '')}" id="lbl-${service.replace(/\s+/g, '')}" style="margin: 0; font-weight: normal; cursor: pointer; flex: 1;">
                    ${service}
                </label>
            `;
        }
        extraContainer.appendChild(div);
    });

    // Reattach listeners
    document.querySelectorAll('input[name="serviceOption"]').forEach(cb => {
        cb.addEventListener('change', async (e) => {
            const isChecked = e.target.checked;
            const value = e.target.value;

            // Mutual exclusion for baths
            if (value === 'Banho Master' || value === 'Banho e Tosa' || value === 'Tosa') {
                const masterCb = document.querySelector('input[name="serviceOption"][value="Banho Master"]');
                const tosaBaseCb = document.querySelector('input[name="serviceOption"][value="Banho e Tosa"]'); // if any
                const tosaExtraCb = document.querySelector('input[name="serviceOption"][value="Tosa"]'); // new extra Tosa

                if (isChecked) {
                    if ((value === 'Banho e Tosa' || value === 'Tosa') && masterCb) masterCb.checked = false;
                    else if (value === 'Banho Master') {
                        if (tosaBaseCb) tosaBaseCb.checked = false;
                        if (tosaExtraCb) tosaExtraCb.checked = false;
                    }
                } else {
                    const otherChecked = (value === 'Banho Master') ? ((tosaBaseCb && tosaBaseCb.checked) || (tosaExtraCb && tosaExtraCb.checked)) : (masterCb && masterCb.checked);
                    if (!otherChecked) {
                        e.preventDefault();
                        e.target.checked = true;
                        await showCustomAlert('Todo agendamento precisa incluir pelo menos um banho base.');
                        return;
                    }
                }
            }

            updateServiceUI();
            calculateTotalAndDuration();
            checkAndGenerateSlots();
        });
    });
}

const petSizeInput = document.getElementById('petSize');
const appointmentDateInput = document.getElementById('appointmentDate');
const slotsContainer = document.getElementById('slots-container');

petSizeInput.addEventListener('change', () => {
    updateServiceUI();
    calculateTotalAndDuration();
    checkAndGenerateSlots();
});

appointmentDateInput.addEventListener('change', checkAndGenerateSlots);


function updateServiceUI() {
    const size = petSizeInput.value;
    if (!size) return;

    // Calculate valid services for discount (ONLY applied to EXTRA services? Standard rule: discount on 2+ services. We apply it to extras if they select 2+ extras. Let's stick to simple total for extras: if they pick 2+ extras, they get discount on extras.)
    const extraCheckboxes = document.querySelectorAll('input[name="serviceOption"][data-is-package="false"]:checked');
    const validExtrasForDiscount = Array.from(extraCheckboxes).filter(cb => cb.value !== 'Desembolo de nós');
    const validCount = validExtrasForDiscount.length;
    const discountActive = validCount >= 2;

    document.querySelectorAll('input[name="serviceOption"][data-is-package="false"]').forEach(cb => {
        const service = cb.value;
        const label = document.getElementById(`lbl-${service.replace(/\s+/g, '')}`);
        if (!label) return;

        if (service === 'Desembolo de nós') {
            label.innerHTML = 'Desembolo de nós - a partir de R$ 15,00 (necessário avaliação)';
            return;
        }

        let lookupService = service;
        if (service === 'Tosa' && pricingConfig['Tosa']) {
             lookupService = 'Tosa';
        }

        const data = pricingConfig[lookupService];
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

let currentTotalValue = 0;
let currentTotalDuration = 0;

async function calculateTotalAndDuration() {
    const selectedCheckboxes = document.querySelectorAll('input[name="serviceOption"]:checked');
    const count = selectedCheckboxes.length;
    const size = petSizeInput.value;
    const priceDisplay = document.getElementById('price-display');

    if (count === 0) {
        if(priceDisplay) priceDisplay.innerHTML = '<span style="font-size: 0.8rem; font-weight: normal; color: #666;">A pagar no local:</span> R$ 0,00';
        currentTotalValue = 0;
        currentTotalDuration = 0;
        return;
    }

    if(priceDisplay) priceDisplay.textContent = 'Calculando...';

    try {
        const timeSnap = await getDoc(doc(db, "configuracoes", "tempos"));

        let totalPrice = 0; // Only sum extras
        let totalDuration = 0; // Sum all items

        const timeData = timeSnap.exists() ? timeSnap.data() : {};
        const serviceTimes = (timeData.services || {});
        if (serviceTimes["Tosa"] && !serviceTimes["Banho e Tosa"]) serviceTimes["Banho e Tosa"] = serviceTimes["Tosa"];
        if (serviceTimes["Banho + Tosa"] && !serviceTimes["Banho e Tosa"]) serviceTimes["Banho e Tosa"] = serviceTimes["Banho + Tosa"];
        if (serviceTimes["SPA Premium"] && !serviceTimes["Tosa Higiênica"]) serviceTimes["Tosa Higiênica"] = serviceTimes["SPA Premium"];
        const sizeExtras = (timeData.sizes || {});

        const extraCheckboxes = document.querySelectorAll('input[name="serviceOption"][data-is-package="false"]:checked');
        const validExtrasForDiscount = Array.from(extraCheckboxes).filter(cb => cb.value !== 'Desembolo de nós');
        const validCount = validExtrasForDiscount.length;
        const discountActive = validCount >= 2;
        let hasDesembolo = false;

        selectedCheckboxes.forEach(cb => {
            const serviceName = cb.value;
            const isPackageItem = cb.getAttribute('data-is-package') === 'true';

            if (serviceName === 'Desembolo de nós') {
                hasDesembolo = true;
            }

            // Price calculation ONLY if NOT a package item
            if (!isPackageItem) {
                if (cb.hasAttribute('data-price')) {
                    totalPrice += parseFloat(cb.getAttribute('data-price')) || 0;
                }
                let lookupName = serviceName;
                // A Tosa que aparece como extra para pacotes vai usar o valor da aba geral configurada como "Tosa"
                if (serviceName === 'Tosa' && pricingConfig['Tosa']) {
                     lookupName = 'Tosa';
                }

                if (pricingConfig[lookupName] && serviceName !== 'Desembolo de nós') {
                    let base = 0;
                    if (size === 'P') base = parseFloat(pricingConfig[lookupName].priceP) || 0;
                    else if (size === 'M') base = parseFloat(pricingConfig[lookupName].priceM) || 0;
                    else if (size === 'G') base = parseFloat(pricingConfig[lookupName].priceG) || 0;

                    const discount = parseFloat(pricingConfig[lookupName].discount) || 0;

                    if (discountActive) {
                        totalPrice += base * (1 - (discount / 100));
                    } else {
                        totalPrice += base;
                    }
                }
            }

            // Duration calculation uses ALL items
            const serviceDuration = serviceTimes[serviceName] ?? 30;
            const parsedServiceDuration = Number.parseInt(serviceDuration, 10);
            totalDuration += Number.isNaN(parsedServiceDuration) ? 30 : parsedServiceDuration;
        });

        if (size && sizeExtras[size]) {
            totalDuration += parseInt(sizeExtras[size]);
        }

        currentTotalValue = totalPrice;
        currentTotalDuration = totalDuration;

        let valStr = totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        if (hasDesembolo) valStr += ' + Avaliação';

        if (priceDisplay) {
            priceDisplay.innerHTML = `<span style="font-size: 0.8rem; font-weight: normal; color: #666;">A pagar no local:</span> ${valStr}`;
        }

        const summaryServices = document.getElementById('summary-services');
        const summaryTime = document.getElementById('summary-time');

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
            summaryTime.textContent = 'Duração: ' + (timeText || '--');
        }

    } catch (e) {
        console.error("Error calculating total:", e);
        if(priceDisplay) priceDisplay.innerHTML = 'Erro ao calcular';
    }
}


let selectedSlot = null;
let currentSelectionData = {};

async function checkAndGenerateSlots() {
    const dateVal = appointmentDateInput.value;
    const selectedCheckboxes = document.querySelectorAll('input[name="serviceOption"]:checked');
    const size = petSizeInput.value;

    if (!dateVal || selectedCheckboxes.length === 0 || !size) {
        slotsContainer.innerHTML = '<p class="empty-slots-msg">Selecione os serviços e a data para ver os horários disponíveis.</p>';
        return;
    }

    const selectedDate = new Date(dateVal + 'T00:00:00');
    const today = new Date();
    today.setHours(0,0,0,0);

    if (selectedDate.getDay() === 0) {
        await showCustomAlert("Não funcionamos aos domingos.");
        appointmentDateInput.value = '';
        slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; font-size: 0.9rem;">Selecione os serviços e a data para ver os horários disponíveis.</p>';
        return;
    }

    if (selectedDate < today) {
        await showCustomAlert("Por favor, selecione uma data futura.");
        appointmentDateInput.value = '';
        slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; font-size: 0.9rem;">Selecione os serviços e a data para ver os horários disponíveis.</p>';
        return;
    }

    await generateSlots(dateVal);
}


async function generateSlots(dateString) {
    slotsContainer.innerHTML = '<p class="loading" style="grid-column: 1/-1;">Calculando disponibilidade...</p>';
    selectedSlot = null;

    try {
        if (currentTotalDuration === 0) await calculateTotalAndDuration();

        let capacity = 1;
        let agendaInterval = 30;

        const [globalConfigSnap, timeConfigSnap, dayConfigSnap] = await Promise.all([
            getDoc(doc(db, "configuracoes", "geral")),
            getDoc(doc(db, "configuracoes", "tempos")),
            getDoc(doc(db, "configuracoes", dateString))
        ]);

        if (globalConfigSnap.exists() && globalConfigSnap.data().capacityPerSlot) capacity = globalConfigSnap.data().capacityPerSlot;
        if (timeConfigSnap.exists() && timeConfigSnap.data().agendaInterval) agendaInterval = parseInt(timeConfigSnap.data().agendaInterval);

        const totalDuration = currentTotalDuration;
        const slotsNeeded = Math.ceil(totalDuration / agendaInterval);

        let blockedAllDay = false;
        const blockedSlots = new Set();
        if (dayConfigSnap.exists()) {
            const configData = dayConfigSnap.data();
            if (configData.capacityPerSlot) capacity = parseInt(configData.capacityPerSlot);
            if (configData.blockedAllDay) blockedAllDay = true;
            if (configData.blockedSlots && Array.isArray(configData.blockedSlots)) {
                configData.blockedSlots.forEach(s => blockedSlots.add(s));
            }
        }

        if (blockedAllDay) {
             slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #d32f2f; font-weight: bold;">Fechado neste dia.</p>';
             return;
        }

        const startOfDay = `${dateString}T00:00`;
        const endOfDay = `${dateString}T23:59`;
        const q = query(
            collection(db, "appointments"),
            where("appointmentTime", ">=", startOfDay),
            where("appointmentTime", "<=", endOfDay)
        );
        const querySnapshot = await getDocs(q);

        const allSlots = [];
        let currentTime = new Date(`${dateString}T08:00:00`);
        const endTimeDate = new Date(`${dateString}T18:00:00`);

        while (currentTime < endTimeDate) {
            const h = currentTime.getHours().toString().padStart(2, '0');
            const m = currentTime.getMinutes().toString().padStart(2, '0');
            allSlots.push(`${h}:${m}`);
            currentTime.setMinutes(currentTime.getMinutes() + agendaInterval);
        }

        const occupancy = {};
        allSlots.forEach(s => occupancy[s] = 0);

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.status !== 'Cancelado' && data.appointmentTime) {
                const timePart = data.appointmentTime.split('T')[1];
                const apptSlotsNeeded = data.slotsNeeded || 1;
                const startIndex = allSlots.indexOf(timePart);
                if (startIndex !== -1) {
                    for (let i = 0; i < apptSlotsNeeded; i++) {
                        const slotTime = allSlots[startIndex + i];
                        if (slotTime) occupancy[slotTime] = (occupancy[slotTime] || 0) + 1;
                    }
                }
            }
        });

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
            let canBook = true;
            let failureReason = '';

            if (isToday) {
                const [h, m] = time.split(':').map(Number);
                if (h < currentHour || (h === currentHour && m < currentMinute)) {
                    canBook = false;
                    failureReason = 'past';
                }
            }

            if (canBook && (index + slotsNeeded > allSlots.length)) {
                canBook = false;
                failureReason = 'eod';
            }

            if (canBook) {
                for (let i = 0; i < slotsNeeded; i++) {
                    const checkTime = allSlots[index + i];
                    if (blockedSlots.has(checkTime)) {
                        canBook = false;
                        failureReason = 'blocked';
                        break;
                    }
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
                if (failureReason === 'eod') btn.style.display = 'none';
                else if (failureReason === 'blocked') btn.title = "Horário indisponível";
                else if (failureReason === 'full') btn.title = "Horário esgotado";
                else if (failureReason === 'past') btn.title = "Horário já passou";
            } else {
                btn.onclick = () => {
                    const prev = slotsContainer.querySelector('.selected');
                    if (prev) prev.classList.remove('selected');
                    btn.classList.add('selected');
                    selectedSlot = fullIso;
                    currentSelectionData = { duration: totalDuration, slotsNeeded };
                };
            }

            slotsContainer.appendChild(btn);
        });

    } catch (error) {
        console.error("Erro ao carregar horários:", error);
        slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Erro ao carregar horários. Tente novamente.</p>';
    }
}

function toLocalISOString(date) {
    const pad = (n) => n < 10 ? '0' + n : n;
    return date.getFullYear() + '-' +
        pad(date.getMonth() + 1) + '-' +
        pad(date.getDate()) + 'T' +
        pad(date.getHours()) + ':' +
        pad(date.getMinutes()) + ':' +
        pad(date.getSeconds());
}


const scheduleForm = document.getElementById('schedule-package-form');

scheduleForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateStep1() || !validateStep2()) {
        return;
    }

    const submitBtn = scheduleForm.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return;

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processando...';

    try {
        const petName = document.getElementById('petName').value.trim();
        const obsInput = document.getElementById('observations').value.trim();
        const petSize = document.getElementById('petSize').value;

        const packageServicesUsed = [];
        const extraServicesUsed = [];
        const allServicesUsed = [];

        document.querySelectorAll('input[name="serviceOption"]:checked').forEach(cb => {
            allServicesUsed.push(cb.value);
            if (cb.getAttribute('data-is-package') === 'true') {
                packageServicesUsed.push(cb.value);
            } else {
                extraServicesUsed.push(cb.value);
            }
        });

        const appointmentTime = selectedSlot;
        const { duration, slotsNeeded } = currentSelectionData;

        // Verify capacity once more quickly
        const datePart = appointmentTime.split('T')[0];
        const reqTimePart = appointmentTime.split('T')[1];

        // Format observations
        const finalObs = `[AGENDAMENTO DE PACOTE]\nPacote: ${packageServicesUsed.join(', ')}\nExtras: ${extraServicesUsed.length > 0 ? extraServicesUsed.join(', ') : 'Nenhum'}\n\n${obsInput}`;

        const dataToSave = {
            petName: petName,
            observations: finalObs,
            services: allServicesUsed,
            serviceType: allServicesUsed[0], // legacy
            totalValue: currentTotalValue,
            petSize: petSize,
            appointmentTime: appointmentTime,
            status: 'Agendado',
            durationMinutes: duration,
            slotsNeeded: slotsNeeded,
            ownerPhone: ownerPhone,
            ownerName: ownerName || "Nome não informado",
            createdAt: toLocalISOString(new Date()),

            // Package specific fields
            isPackage: true,
            walletId: walletId,
            packageItems: packageServicesUsed,
            extraItems: extraServicesUsed
        };

        // 1. Save appointment
        await addDoc(collection(db, "appointments"), dataToSave);

        // 2. Deduct from wallet
        const docRef = doc(db, "carteiras", walletId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const currentSaldo = docSnap.data().saldo || {};
            const newSaldo = { ...currentSaldo };

            packageServicesUsed.forEach(srv => {
                if (newSaldo[srv] && newSaldo[srv] > 0) {
                    newSaldo[srv] -= 1;
                }
            });

            await updateDoc(docRef, {
                saldo: newSaldo,
                lastUpdated: toLocalISOString(new Date())
            });
        }

        await showCustomAlert('Agendamento de pacote realizado com sucesso! Seus créditos foram atualizados.');
        window.location.href = 'index.html';

    } catch (e) {
        console.error("Error saving appointment: ", e);
        await showCustomAlert("Erro ao salvar. Tente novamente.");
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Run Init
init();
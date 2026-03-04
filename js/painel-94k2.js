import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
    import { getFirestore, collection, onSnapshot, doc, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy, where, limit, writeBatch, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
    import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

    const runtimeConfig = window.__MELLUPET_CONFIG || {};
    const firebaseConfig = runtimeConfig.firebase;

    if (!firebaseConfig) {
        alert('Configuração ausente: crie config/runtime-config.js a partir do arquivo de exemplo.');
        throw new Error('Firebase config ausente em window.__MELLUPET_CONFIG.firebase');
    }

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    // --- State & Elements ---
    const agendaDateInput = document.getElementById('agendaDate');
    const listContainer = document.getElementById('appointments-list');
    const historyContainer = document.getElementById('history-list');

    // New Appointment Elements
    const btnNewAppointment = document.getElementById('btn-new-appointment');
    const newAppointmentModal = document.getElementById('new-appointment-modal');
    const newAppointmentForm = document.getElementById('new-appointment-form');
    const newApptServicesContainer = document.getElementById('new-appt-services-container');
    const newApptPriceDisplay = document.getElementById('new-appt-price-display');
    const newApptDate = document.getElementById('newApptDate');
    const newApptTime = document.getElementById('newApptTime');
    const newApptPetSize = document.getElementById('newApptPetSize');

    const configDateInput = document.getElementById('configDate');
    const configOptions = document.getElementById('config-options');
    const blockAllDayCheckbox = document.getElementById('blockAllDay');
    const slotsCheckboxesContainer = document.getElementById('slots-checkboxes');
    const configMessage = document.getElementById('config-message');
    const globalCapacityInput = document.getElementById('globalCapacity');
    const configDayCapacityInput = document.getElementById('configDayCapacity');

    // Week Grid Elements
    const weekGrid = document.getElementById('week-grid');
    const weekLabel = document.getElementById('week-label');

    let unsubscribe = null; // Store listener for Agenda
    let historyUnsubscribe = null; // Store listener for History
    let weekUnsubscribe = null; // Store listener for Week

    // Week State
    let currentWeekStart = new Date();
    // Adjust to Monday of current week
    const day = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1); // If sunday (-6), else (day-1)
    currentWeekStart.setDate(diff);
    currentWeekStart.setHours(0,0,0,0);

    // Time slots definition (08:00 to 17:00)
    const timeSlots = [
        "08:00", "09:00", "10:00", "11:00", "12:00",
        "13:00", "14:00", "15:00", "16:00", "17:00"
    ];

    // --- Auth Logic ---
    const loginScreen = document.getElementById('login-screen');
    const mainPanel = document.getElementById('main-panel');
    const loginForm = document.getElementById('admin-login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginScreen.style.display = 'none';
            mainPanel.style.display = 'block';

            // Only load data after auth is confirmed
            loadAppointments();
            loadGlobalSettings();
            renderServiceDescriptions();
            loadServiceDescriptions();
            renderPriceTable();
            renderTimeTable();
            loadPriceSettings();
            loadTimeSettings();
        } else {
            loginScreen.style.display = 'flex';
            mainPanel.style.display = 'none';
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const btn = document.getElementById('login-btn');

        btn.disabled = true;
        btn.textContent = 'Aguarde...';
        loginError.style.display = 'none';
        document.getElementById('reset-msg').style.display = 'none';

        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                // Success is handled by onAuthStateChanged
                btn.disabled = false;
                btn.textContent = 'Entrar';
            })
            .catch((error) => {
                console.error("Auth error:", error);
                loginError.style.display = 'block';
                btn.disabled = false;
                btn.textContent = 'Entrar';
            });
    });

    const forgotPasswordLink = document.getElementById('forgot-password-link');
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('loginEmail');
        const email = emailInput.value.trim();
        const resetMsg = document.getElementById('reset-msg');
        loginError.style.display = 'none';

        if (!email) {
            resetMsg.style.display = 'block';
            resetMsg.style.color = '#d84b4b'; // Soft red
            resetMsg.textContent = 'Por favor, digite seu e-mail no campo acima para recuperar a senha.';
            emailInput.focus();
            return;
        }

        resetMsg.style.display = 'block';
        resetMsg.style.color = '#666';
        resetMsg.textContent = 'Enviando...';

        sendPasswordResetEmail(auth, email)
            .then(() => {
                resetMsg.style.color = '#4CAF50'; // Green
                resetMsg.textContent = 'Link de recuperação enviado! Verifique seu e-mail.';
            })
            .catch((error) => {
                console.error("Reset error:", error);
                resetMsg.style.color = '#d84b4b'; // Soft red
                resetMsg.textContent = 'Erro ao enviar e-mail de recuperação. Verifique se o e-mail está correto.';
            });
    });

    logoutBtn.addEventListener('click', () => {
        signOut(auth).catch(error => console.error("Logout error:", error));
    });

    // --- Initialization ---
    // Set default date to today for both inputs
    const today = toLocalDateString(new Date());
    agendaDateInput.value = today;
    configDateInput.value = today;

    // --- Functions ---

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

    function toLocalDateString(date) {
        const pad = (n) => n < 10 ? '0' + n : n;
        return date.getFullYear() + '-' +
            pad(date.getMonth() + 1) + '-' +
            pad(date.getDate());
    }

    function toLocalISOString(date) {
        const pad = (n) => n < 10 ? '0' + n : n;
        return date.getFullYear() + '-' +
            pad(date.getMonth() + 1) + '-' +
            pad(date.getDate()) + 'T' +
            pad(date.getHours()) + ':' +
            pad(date.getMinutes());
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

    window.toggleCard = (header) => {
        const card = header.parentElement;
        card.classList.toggle('collapsed');
    };

    window.switchTab = (tabName) => {
        // Hide all contents
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

        // Show selected
        document.getElementById(`tab-${tabName}`).classList.add('active');

        // Update button state
        const buttons = document.querySelectorAll('.tab-btn');
        // 0: Agenda, 1: Week, 2: History, 3: Config
        if (tabName === 'agenda') {
            buttons[0].classList.add('active');
            if (historyUnsubscribe) { historyUnsubscribe(); historyUnsubscribe = null; }
            if (weekUnsubscribe) { weekUnsubscribe(); weekUnsubscribe = null; }
            loadAppointments();
        }
        else if (tabName === 'semana') {
            buttons[1].classList.add('active');
            if (unsubscribe) { unsubscribe(); unsubscribe = null; }
            if (historyUnsubscribe) { historyUnsubscribe(); historyUnsubscribe = null; }
            loadWeekSchedule();
        }
        else if (tabName === 'historico') {
            buttons[2].classList.add('active');
            if (unsubscribe) { unsubscribe(); unsubscribe = null; }
            if (weekUnsubscribe) { weekUnsubscribe(); weekUnsubscribe = null; }
            loadHistory();
        }
        else if (tabName === 'config') {
            buttons[3].classList.add('active');
            if (unsubscribe) { unsubscribe(); unsubscribe = null; }
            if (historyUnsubscribe) { historyUnsubscribe(); historyUnsubscribe = null; }
            if (weekUnsubscribe) { weekUnsubscribe(); weekUnsubscribe = null; }
            loadConfiguration();
        }
    };

    window.loadAppointments = () => {
        const dateVal = agendaDateInput.value;
        if (!dateVal) return;

        // Unsubscribe previous listener if exists
        if (unsubscribe) {
            unsubscribe();
        }

        listContainer.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">Carregando agendamentos...</p>';

        // Query Range for the entire day
        const startOfDay = `${dateVal}T00:00`;
        const endOfDay = `${dateVal}T23:59`;

        const q = query(
            collection(db, "appointments"),
            where("appointmentTime", ">=", startOfDay),
            where("appointmentTime", "<=", endOfDay)
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
            listContainer.innerHTML = ''; // Clear list

            const activeDocs = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const s = (data.status || '').toLowerCase();
                // Filter out finished/cancelled
                if (s !== 'concluído' && s !== 'cancelado') {
                    activeDocs.push({id: docSnap.id, ...data});
                }
            });

            activeDocs.sort((a, b) => {
                const timeA = (a.appointmentTime || '');
                const timeB = (b.appointmentTime || '');
                return timeA.localeCompare(timeB);
            });

            if (activeDocs.length === 0) {
                listContainer.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">Nenhum agendamento ativo para este dia.</p>';
                return;
            }

            activeDocs.forEach((item) => {
                listContainer.appendChild(createCard(item.id, item, false));
            });
            // Re-apply filters after loading
            filterAppointments();
        }, (error) => {
            console.error("Error fetching appointments:", error);
            const code = error?.code ? ` (${error.code})` : '';
            listContainer.innerHTML = `<p style="text-align: center; color: red; grid-column: 1/-1;">Erro ao carregar agendamentos${code}.</p>`;
        });
    };

    window.filterAppointments = () => {
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        if (!searchInput || !statusFilter) return;

        const filterText = searchInput.value.toLowerCase();
        const filterPhone = filterText.replace(/\D/g, ''); // Extract digits
        const filterStatus = statusFilter.value;

        const cards = document.querySelectorAll('#appointments-list .card');

        cards.forEach(card => {
            const petName = (card.getAttribute('data-pet-name') || '').toLowerCase();
            const ownerPhone = (card.getAttribute('data-owner-phone') || '');
            const status = card.getAttribute('data-status') || '';

            let show = true;

            // Status Filter
            if (filterStatus !== 'Todos' && status !== filterStatus) {
                show = false;
            }

            // Search Filter
            if (show && filterText.trim() !== '') {
                const nameMatch = petName.includes(filterText);
                let phoneMatch = false;
                if (filterPhone.length > 0) {
                    phoneMatch = ownerPhone.includes(filterPhone);
                }

                if (!nameMatch && !phoneMatch) {
                    show = false;
                }
            }

            card.style.display = show ? 'flex' : 'none';
        });
    };

    window.loadHistory = () => {
        if (historyUnsubscribe) {
            historyUnsubscribe();
        }

        // Load last 50 appointments
        historyContainer.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">Carregando histórico...</p>';

        const q = query(
            collection(db, "appointments"),
            orderBy("appointmentTime", "desc"),
            limit(100) // Fetch more to filter client side if needed
        );

        historyUnsubscribe = onSnapshot(q, (snapshot) => {
            historyContainer.innerHTML = '';

            const historyDocs = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const s = (data.status || '').toLowerCase();
                if (s === 'concluído' || s === 'cancelado') {
                    historyDocs.push({id: docSnap.id, ...data});
                }
            });

            if (historyDocs.length === 0) {
                historyContainer.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">Nenhum histórico recente encontrado.</p>';
                return;
            }

            // Limit display to 50
            historyDocs.slice(0, 50).forEach((item) => {
                historyContainer.appendChild(createCard(item.id, item, true));
            });
        });
    };

    // --- Week Logic ---

    window.changeWeek = (direction) => {
        // direction: -1 or 1
        currentWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
        loadWeekSchedule();
    };

    window.loadWeekSchedule = async () => {
        if (weekUnsubscribe) {
            weekUnsubscribe();
        }

        // Calculate Range
        const startOfWeek = new Date(currentWeekStart);
        const endOfWeek = new Date(currentWeekStart);
        endOfWeek.setDate(endOfWeek.getDate() + 6); // Sunday (which we ignore in grid but fetch for range safety)
        endOfWeek.setHours(23, 59, 59, 999);

        // Update Label
        const startStr = startOfWeek.toLocaleDateString('pt-BR', {day: 'numeric', month: 'numeric'});
        const endStr = endOfWeek.toLocaleDateString('pt-BR', {day: 'numeric', month: 'numeric'});
        // Get week number (rough estimate)
        const oneJan = new Date(startOfWeek.getFullYear(), 0, 1);
        const numberOfDays = Math.floor((startOfWeek - oneJan) / (24 * 60 * 60 * 1000));
        const weekNum = Math.ceil((startOfWeek.getDay() + 1 + numberOfDays) / 7);

        weekLabel.textContent = `Semana ${weekNum} (${startStr} a ${endStr})`;

        weekGrid.innerHTML = '<p style="grid-column: 1/-1; padding: 2rem; text-align: center;">Carregando...</p>';

        // 1. Fetch Configs for the week
        // We need configs for Mon-Sat. Firestore doesn't support "IN" with dates easily if ID is date
        // So we'll just fetch them in parallel.
        const weekDates = [];
        for (let i = 0; i < 6; i++) { // 0=Mon, 5=Sat
            const d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            weekDates.push(toLocalDateString(d));
        }

        const configs = {};
        try {
            const configPromises = weekDates.map(dateStr => getDoc(doc(db, "configuracoes", dateStr)));
            const configSnaps = await Promise.all(configPromises);
            configSnaps.forEach((snap, idx) => {
                if (snap.exists()) {
                    configs[weekDates[idx]] = snap.data();
                }
            });
        } catch (e) {
            console.error("Error loading configs:", e);
        }

        // 2. Fetch Appointments
        const rangeStart = toLocalISOString(startOfWeek);
        const rangeEnd = toLocalISOString(endOfWeek);

        const q = query(
            collection(db, "appointments"),
            where("appointmentTime", ">=", rangeStart),
            where("appointmentTime", "<=", rangeEnd)
        );

        weekUnsubscribe = onSnapshot(q, (snapshot) => {
            const appointments = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                appointments.push({id: doc.id, ...data});
            });

            renderWeekGrid(weekDates, configs, appointments);
        });
    };

    function renderWeekGrid(weekDates, configs, appointments) {
        weekGrid.innerHTML = '';

        // Header Row
        // Empty top-left
        const emptyHeader = document.createElement('div');
        emptyHeader.className = 'week-header';
        weekGrid.appendChild(emptyHeader);

        const daysOfWeek = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        weekDates.forEach((dateStr, idx) => {
            const [y, m, d] = dateStr.split('-');
            const header = document.createElement('div');
            header.className = 'week-header';
            header.innerHTML = `${daysOfWeek[idx]}<br><span style="font-weight:normal">${d}/${m}</span>`;
            weekGrid.appendChild(header);
        });

        // Time Rows
        timeSlots.forEach(time => {
            // Time Label
            const label = document.createElement('div');
            label.className = 'time-label';
            label.textContent = time;
            weekGrid.appendChild(label);

            // Cells for each day
            weekDates.forEach(dateStr => {
                const cell = document.createElement('div');
                cell.className = 'week-cell';

                const fullIso = `${dateStr}T${time}`;

                // Check Blocking
                let isBlocked = false;
                if (configs[dateStr]) {
                    if (configs[dateStr].blockedAllDay) isBlocked = true;
                    if (configs[dateStr].blockedSlots && configs[dateStr].blockedSlots.includes(time)) isBlocked = true;
                }

                if (isBlocked) {
                    cell.classList.add('cell-blocked');
                    cell.textContent = 'Bloqueado';
                } else {
                    // Check Appointments (Find all for this slot by matching the date and hour part)
                    const slotHour = time.split(':')[0]; // e.g., "08"
                    const apps = appointments.filter(a => {
                        if (!a.appointmentTime) return false;
                        const aDateStr = a.appointmentTime.split('T')[0];
                        const aTimeStr = a.appointmentTime.split('T')[1];
                        if (aDateStr !== dateStr) return false;
                        if (!aTimeStr) return false;
                        const aHour = aTimeStr.split(':')[0];
                        return aHour === slotHour;
                    });

                    if (apps.length > 0) {
                        const firstApp = apps[0];
                        cell.classList.add('cell-booked');

                        // Status Class logic (based on first item)
                        const s = (firstApp.status || '').toLowerCase();
                        if (s.includes('concluído')) cell.classList.add('cell-status-concluido');
                        else if (s.includes('cancelado')) cell.classList.add('cell-status-cancelado');

                        // Icon mapping
                        let icon = '📅';
                        if (s.includes('banho')) icon = '🚿';
                        else if (s.includes('secando')) icon = '💨';
                        else if (s.includes('pronto')) icon = '✅';
                        else if (s.includes('fila')) icon = '⏳';
                        else if (s.includes('cancelado')) icon = '❌';
                        else if (s.includes('concluído')) icon = '🏁';

                        // Badge logic
                        let badgeHtml = '';
                        if (apps.length > 1) {
                            badgeHtml = `<div class="count-badge">+${apps.length - 1}</div>`;
                        }

                        // Add time prefix for fractional times (e.g. 17:30)
                        let timeLabelHtml = '';
                        if (firstApp.appointmentTime) {
                            const tStr = firstApp.appointmentTime.split('T')[1];
                            if (tStr && !tStr.endsWith(':00')) {
                                timeLabelHtml = `<span style="font-size:0.7rem; font-weight:bold; color:#fff; background:rgba(0,0,0,0.3); padding:1px 3px; border-radius:3px; margin-right:3px;">${tStr}</span>`;
                            }
                        }

                        cell.innerHTML = `
                            ${badgeHtml}
                            <div class="pet-mini">${timeLabelHtml}${icon} ${escapeHtml(firstApp.petName)}</div>
                            <div class="owner-mini">${escapeHtml(firstApp.ownerName || '')}</div>
                        `;

                        // Pass full array to modal
                        cell.onclick = () => openModal(apps);
                    }
                }
                weekGrid.appendChild(cell);
            });
        });
    }

    // --- New Appointment Modal Logic ---

    function renderNewApptServices() {
        newApptServicesContainer.innerHTML = '';
        servicesList.forEach(srv => {
            const id = `new-appt-srv-${srv.replace(/\s+/g, '')}`;
            const isBanhoMaster = srv === 'Banho Master';
            const html = `
                <div style="display:flex; align-items:center; gap:0.25rem;">
                    <input type="checkbox" id="${id}" value="${srv}" class="new-appt-service-cb" ${isBanhoMaster ? 'checked' : ''}>
                    <label for="${id}" style="font-size:0.9rem;">${srv}</label>
                </div>
            `;
            newApptServicesContainer.innerHTML += html;
        });

        document.querySelectorAll('.new-appt-service-cb').forEach(cb => {
            cb.addEventListener('change', async (e) => {
                // Mutual exclusion
                if (e.target.checked) {
                    if (e.target.value === 'Banho e Tosa') {
                        const masterCb = document.querySelector('.new-appt-service-cb[value="Banho Master"]');
                        if (masterCb) masterCb.checked = false;
                    } else if (e.target.value === 'Banho Master') {
                        const tosaCb = document.querySelector('.new-appt-service-cb[value="Banho e Tosa"]');
                        if (tosaCb) tosaCb.checked = false;
                    }
                }
                await updateNewAppointmentSlots();
            });
        });
    }

    if (btnNewAppointment) {
        btnNewAppointment.addEventListener('click', () => {
            // Reset form
            newAppointmentForm.reset();
            renderNewApptServices();
            newApptDate.value = toLocalDateString(new Date());
            newApptPriceDisplay.textContent = 'Total Estimado: R$ 0,00';
            newApptTime.innerHTML = '<option value="">Selecione Porte, Serviços e Data</option>';
            newAppointmentModal.classList.add('active');
            updateNewAppointmentSlots();
        });
    }

    window.closeNewAppointmentModal = () => {
        newAppointmentModal.classList.remove('active');
    };

    if (newApptPetSize) newApptPetSize.addEventListener('change', updateNewAppointmentSlots);
    if (newApptDate) {
        newApptDate.addEventListener('change', updateNewAppointmentSlots);
        newApptDate.addEventListener('input', updateNewAppointmentSlots);
    }

    async function updateNewAppointmentSlots() {
        if (!newApptDate || !newApptTime || !newApptPetSize) return;

        const dateVal = newApptDate.value;
        const petSize = newApptPetSize.value;
        const selectedServices = [];
        document.querySelectorAll('.new-appt-service-cb:checked').forEach(cb => selectedServices.push(cb.value));

        if (!dateVal || !petSize || selectedServices.length === 0) {
            newApptTime.innerHTML = '<option value="">Selecione Porte, Serviços e Data</option>';
            newApptPriceDisplay.textContent = 'Total Estimado: R$ 0,00';
            return;
        }

        const dateObj = new Date(dateVal + 'T00:00:00');
        if (dateObj.getDay() === 0) {
            newApptTime.innerHTML = '<option value="">Fechado aos domingos</option>';
            return;
        }

        try {
            const [globalConfigSnap, timeConfigSnap, priceConfigSnap, dayConfigSnap] = await Promise.all([
                getDoc(doc(db, "configuracoes", "geral")),
                getDoc(doc(db, "configuracoes", "tempos")),
                getDoc(doc(db, "configuracoes", "precos")),
                getDoc(doc(db, "configuracoes", dateVal))
            ]);

            // --- Price Calculation ---
            let newTotalValue = 0;
            const priceData = priceConfigSnap.exists() ? priceConfigSnap.data() : {};
            if (priceData["Tosa"] && !priceData["Banho e Tosa"]) priceData["Banho e Tosa"] = priceData["Tosa"];
            if (priceData["Banho + Tosa"] && !priceData["Banho e Tosa"]) priceData["Banho e Tosa"] = priceData["Banho + Tosa"];

            const validServicesForDiscount = selectedServices.filter(s => s !== 'Desembolo de nós');
            const validCount = validServicesForDiscount.length;
            const hasDesembolo = selectedServices.includes('Desembolo de nós');

            selectedServices.forEach(srv => {
                if (priceData[srv]) {
                    let base = 0;
                    if (petSize === 'P') base = parseFloat(priceData[srv].priceP) || 0;
                    else if (petSize === 'M') base = parseFloat(priceData[srv].priceM) || 0;
                    else if (petSize === 'G') base = parseFloat(priceData[srv].priceG) || 0;

                    const discount = parseFloat(priceData[srv].discount) || 0;
                    if (validCount >= 2 && srv !== 'Desembolo de nós') {
                        newTotalValue += base * (1 - (discount/100));
                    } else {
                        newTotalValue += base;
                    }
                }
            });

            const formattedPrice = newTotalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            newApptPriceDisplay.textContent = hasDesembolo ? `Total Estimado: ${formattedPrice} + Avaliação` : `Total Estimado: ${formattedPrice}`;
            newAppointmentForm.setAttribute('data-calculated-price', newTotalValue);

            // --- Slots Calculation ---
            let capacity = 1;
            if (globalConfigSnap.exists() && globalConfigSnap.data().capacityPerSlot) {
                capacity = parseInt(globalConfigSnap.data().capacityPerSlot) || 1;
            }

            const timeData = timeConfigSnap.exists() ? timeConfigSnap.data() : {};
            const serviceTimes = timeData.services || {};
            if (serviceTimes["Tosa"] && !serviceTimes["Banho e Tosa"]) serviceTimes["Banho e Tosa"] = serviceTimes["Tosa"];
            if (serviceTimes["Banho + Tosa"] && !serviceTimes["Banho e Tosa"]) serviceTimes["Banho e Tosa"] = serviceTimes["Banho + Tosa"];
            const sizeExtras = timeData.sizes || {};
            const agendaInterval = parseInt(timeData.agendaInterval) || 30;

            let totalDuration = 0;
            selectedServices.forEach(srv => {
                totalDuration += serviceTimes[srv] ? parseInt(serviceTimes[srv]) : 30;
            });
            if (sizeExtras[petSize]) totalDuration += parseInt(sizeExtras[petSize]);
            const slotsNeeded = Math.ceil(totalDuration / agendaInterval);
            newAppointmentForm.setAttribute('data-duration', totalDuration);
            newAppointmentForm.setAttribute('data-slots', slotsNeeded);

            let blockedAllDay = false;
            const blockedSlots = new Set();
            if (dayConfigSnap.exists()) {
                const dayData = dayConfigSnap.data();
                if (dayData.capacityPerSlot) capacity = parseInt(dayData.capacityPerSlot); // Override global
                if (dayData.blockedAllDay) blockedAllDay = true;
                if (Array.isArray(dayData.blockedSlots)) dayData.blockedSlots.forEach(s => blockedSlots.add(s));
            }

            if (blockedAllDay) {
                newApptTime.innerHTML = '<option value="">Fechado neste dia</option>';
                return;
            }

            const startOfDay = `${dateVal}T00:00`;
            const endOfDay = `${dateVal}T23:59`;
            const q = query(
                collection(db, "appointments"),
                where("appointmentTime", ">=", startOfDay),
                where("appointmentTime", "<=", endOfDay)
            );
            const querySnapshot = await getDocs(q);

            const allSlots = [];
            let t = new Date(`${dateVal}T08:00:00`);
            const endT = new Date(`${dateVal}T18:00:00`);
            while (t < endT) {
                allSlots.push(`${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`);
                t.setMinutes(t.getMinutes() + agendaInterval);
            }

            const occupancy = {};
            allSlots.forEach(s => occupancy[s] = 0);

            querySnapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (data.status === 'Cancelado' || data.status === 'Concluído') return;
                if (!data.appointmentTime) return;

                const timePart = data.appointmentTime.split('T')[1];
                const apptSlots = data.slotsNeeded || 1;
                const startIdx = allSlots.indexOf(timePart);
                if (startIdx !== -1) {
                    for (let i = 0; i < apptSlots; i++) {
                        const check = allSlots[startIdx + i];
                        if (check) occupancy[check] = (occupancy[check] || 0) + 1;
                    }
                }
            });

            const previous = newApptTime.value;
            const now = new Date();
            const isToday = (new Date(`${dateVal}T00:00:00`).toDateString() === now.toDateString());

            newApptTime.innerHTML = '';
            let firstValid = null;

            allSlots.forEach((slot, index) => {
                let isPast = false;
                if (isToday) {
                    const [h,m] = slot.split(':').map(Number);
                    if (h < now.getHours() || (h === now.getHours() && m < now.getMinutes())) isPast = true;
                }

                let outOfBounds = (index + slotsNeeded > allSlots.length);
                let isBlocked = false;
                let isFull = false;

                if (!isPast && !outOfBounds) {
                    for (let i = 0; i < slotsNeeded; i++) {
                        const check = allSlots[index + i];
                        if (blockedSlots.has(check)) {
                            isBlocked = true;
                            break;
                        }
                        if ((occupancy[check] || 0) >= capacity) {
                            isFull = true;
                        }
                    }
                }

                if (!isPast && !outOfBounds && !isBlocked) {
                    const opt = document.createElement('option');
                    opt.value = slot;
                    opt.textContent = isFull ? `${slot} (Encaixe)` : slot;
                    opt.setAttribute('data-is-full', isFull ? 'true' : 'false');

                    if (isFull) {
                        opt.style.color = '#d32f2f'; // Highlight full slots slightly if browser supports
                    }

                    newApptTime.appendChild(opt);
                    if (!firstValid && !isFull) firstValid = slot;
                }
            });

            if (newApptTime.options.length === 0) {
                newApptTime.innerHTML = '<option value="">Sem horários disponíveis</option>';
            } else {
                if (previous && Array.from(newApptTime.options).some(o => o.value === previous)) {
                    newApptTime.value = previous;
                } else if (firstValid) {
                    newApptTime.value = firstValid;
                }
            }

        } catch (e) {
            console.error('Error loading new appointment slots:', e);
            newApptTime.innerHTML = '<option value="">Erro ao carregar horários</option>';
        }
    }

    if (newAppointmentForm) {
        newAppointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const ownerName = document.getElementById('newApptOwnerName').value.trim();
            const ownerPhone = document.getElementById('newApptOwnerPhone').value.trim();
            const petName = document.getElementById('newApptPetName').value.trim();
            const petSize = document.getElementById('newApptPetSize').value;
            const apptDate = document.getElementById('newApptDate').value;
            const apptTime = document.getElementById('newApptTime').value;
            const initialStatus = document.getElementById('newApptInitialStatus').value;
            const paymentMethod = document.getElementById('newApptPayment').value;
            const observations = document.getElementById('newApptObs').value.trim();

            const selectedServices = [];
            document.querySelectorAll('.new-appt-service-cb:checked').forEach(cb => selectedServices.push(cb.value));

            if (!ownerName || !petName || !petSize || !apptDate || !apptTime || selectedServices.length === 0) {
                alert('Preencha todos os campos obrigatórios.');
                return;
            }

            const selectedOption = newApptTime.options[newApptTime.selectedIndex];
            if (selectedOption && selectedOption.getAttribute('data-is-full') === 'true') {
                if (!confirm(`Atenção: O horário das ${apptTime} já está com a capacidade máxima ou o agendamento excede o final do dia. Deseja forçar o encaixe?`)) {
                    return;
                }
            }

            const submitBtn = document.getElementById('btn-submit-new-appt');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Aguarde...';

            try {
                const totalValue = parseFloat(newAppointmentForm.getAttribute('data-calculated-price')) || 0;
                const durationMinutes = parseInt(newAppointmentForm.getAttribute('data-duration')) || 30;
                const slotsNeeded = parseInt(newAppointmentForm.getAttribute('data-slots')) || 1;

                const appointmentTimeIso = `${apptDate}T${apptTime}`;
                const now = toLocalISOString(new Date());

                const newDocRef = doc(collection(db, "appointments"));
                await setDoc(newDocRef, {
                    ownerName: ownerName,
                    ownerPhone: ownerPhone,
                    petName: petName,
                    petSize: petSize,
                    services: selectedServices,
                    serviceType: selectedServices.join(', '), // legacy
                    appointmentTime: appointmentTimeIso,
                    status: initialStatus,
                    paymentMethod: paymentMethod,
                    observations: observations,
                    totalValue: totalValue,
                    valorDesembolo: 0,
                    durationMinutes: durationMinutes,
                    slotsNeeded: slotsNeeded,
                    createdAt: now
                });

                alert('Agendamento criado com sucesso!');
                closeNewAppointmentModal();
            } catch (error) {
                console.error("Error creating appointment:", error);
                alert("Erro ao criar agendamento.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    // --- Modal Logic ---
    window.openModal = (appts) => {
        const modal = document.getElementById('appointment-modal');
        const modalBody = document.getElementById('modal-body');

        modalBody.innerHTML = '';

        const list = Array.isArray(appts) ? appts : [appts];

        list.forEach(appt => {
            const card = createCard(appt.id, appt, false);
            // Tweak card styles for modal if necessary
            card.style.boxShadow = 'none';
            card.style.border = '1px solid #eee';
            card.style.marginBottom = '1rem';

            modalBody.appendChild(card);
        });

        modal.classList.add('active');
    };

    window.closeModal = (event, force) => {
        if (force || event.target.classList.contains('modal-overlay')) {
            document.getElementById('appointment-modal').classList.remove('active');
        }
    };

    function getStatusClass(status) {
        const s = (status || '').toLowerCase();
        if (s.includes('agendado')) return 'status-agendado';
        if (s.includes('banho')) return 'status-banho';
        if (s.includes('secando')) return 'status-secando';
        if (s.includes('pronto')) return 'status-pronto';
        if (s.includes('concluído')) return 'status-concluido';
        if (s.includes('cancelado')) return 'status-cancelado';
        return 'status-fila';
    }

    function syncCardVisualStatus(btnElement, newStatus) {
        if (!btnElement) return;
        const card = btnElement.closest('.card');
        if (!card) return;

        card.setAttribute('data-status', newStatus);

        const badge = card.querySelector('.status-badge');
        if (badge) {
            badge.textContent = newStatus;
            badge.className = `status-badge ${getStatusClass(newStatus)}`;
        }

        const actionButtons = card.querySelectorAll('.btn-status');
        actionButtons.forEach(button => {
            button.classList.remove('active');
            if (button === btnElement) {
                button.classList.add('active');
            }
        });

        const whatsappButton = card.querySelector('.whatsapp-btn');
        const isPronto = (newStatus || '').toLowerCase().includes('pronto');
        if (whatsappButton) {
            whatsappButton.style.display = isPronto ? 'inline-flex' : 'none';
        }
    }

    function createCard(id, data, isHistory) {
        const card = document.createElement('div');
        card.className = 'card';

        // Data Attributes for Filtering
        card.setAttribute('data-pet-name', (data.petName || '').toLowerCase());
        card.setAttribute('data-owner-phone', (data.ownerPhone || '').replace(/\D/g, ''));
        card.setAttribute('data-status', data.status || '');

        // Determine status class
        const statusClass = getStatusClass(data.status);
        const s = (data.status || '').toLowerCase();

        // Format Date
        const dateObj = new Date(data.appointmentTime);
        const dateStr = dateObj.toLocaleDateString('pt-BR');
        const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        // Owner Name Display
        const ownerName = data.ownerName ? ` (${data.ownerName})` : '';

        // Extra Fields
        let serviceType = data.serviceType || 'Não informado';
        if (data.services && Array.isArray(data.services)) {
            serviceType = data.services.join(', ');
        }

        const petSize = data.petSize || 'Não informado';
        const paymentMethod = data.paymentMethod || 'Não informado';

        let totalValue = data.totalValue
            ? data.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : '';

        // Add Avaliação text if Desembolo is present in services array or serviceType string
        let hasDesembolo = false;
        if (data.services && Array.isArray(data.services)) {
            if (data.services.includes('Desembolo de nós')) hasDesembolo = true;
        } else if (data.serviceType && data.serviceType.includes('Desembolo de nós')) {
            hasDesembolo = true;
        }

        const valorDesembolo = data.valorDesembolo ? parseFloat(data.valorDesembolo) : 0;

        if (hasDesembolo && valorDesembolo === 0) {
            totalValue += ' + Avaliação';
        }

        let desemboloInputHtml = '';
        if (hasDesembolo && !isHistory) {
             desemboloInputHtml = `
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
                    <label style="font-size: 0.9rem; color: #333;">Valor Desembolo:</label>
                    <input type="number" id="desembolo-${id}" value="${valorDesembolo > 0 ? valorDesembolo : ''}" step="0.01" placeholder="0,00" style="width: 80px; padding: 0.25rem; border: 1px solid #ddd; border-radius: 4px;">
                    <button onclick="saveDesembolo('${id}')" style="background-color: var(--primary); color: white; border: none; border-radius: 4px; padding: 0.25rem 0.5rem; cursor: pointer;" title="Salvar Valor">💾</button>
                </div>
             `;
        }

        // Observations Section
        let obsHtml = '';
        if (data.observations) {
             obsHtml = `
                <div class="obs-alert">
                    <strong>⚠️ Observações:</strong>
                    <div style="white-space: pre-wrap;">${escapeHtml(data.observations)}</div>
                </div>
             `;
        }

        // Edit Obs Section
        const editObsHtml = `
            <details style="margin-top: 0.5rem; margin-bottom: 0.5rem;">
                <summary style="cursor: pointer; color: var(--secondary); font-size: 0.9rem;">📝 Editar Observações</summary>
                <textarea id="obs-input-${id}" class="obs-edit-area" rows="3" placeholder="Escreva aqui...">${escapeHtml(data.observations || '')}</textarea>
                <button class="btn-save" style="margin-top: 0.5rem; padding: 0.5rem;" onclick="saveObservation('${id}')">Salvar Observação</button>
            </details>
        `;

        // WhatsApp Button Logic
        let whatsappHtml = '';
        if (s.includes('pronto') && data.ownerPhone && !isHistory) {
            let phone = data.ownerPhone;
            if (phone.length <= 11) {
                phone = '55' + phone;
            }
            // Use escaped pet name for message if desired, but URL encoding handles safety there.
            const message = encodeURIComponent(`Olá! O banho do(a) ${data.petName} foi finalizado e ele(a) já está pronto(a) para ser buscado(a)! 🐶✨`);
            const link = `https://api.whatsapp.com/send?phone=${phone}&text=${message}`;
            whatsappHtml = `<a href="${link}" target="_blank" class="whatsapp-btn">📱 Avisar Dono (WhatsApp)</a>`;
        }

        let buttonsHtml = '';
        if (!isHistory) {
            const currentIsoDate = data.appointmentTime.split('T')[0];
            const currentTime = data.appointmentTime.split('T')[1];

            // Render just the current time initially to avoid confusion before dynamic slots are loaded
            const options = `<option value="${currentTime}" selected>${currentTime}</option>`;

            buttonsHtml = `
            <div class="actions">
                <button class="btn-status ${data.status === 'Agendado' ? 'active' : ''}" onclick="updateStatus('${id}', 'Agendado', this)">Agendado</button>
                <button class="btn-status ${data.status === 'Na Fila' ? 'active' : ''}" onclick="updateStatus('${id}', 'Na Fila', this)">Fila</button>
                <button class="btn-status ${data.status === 'No Banho' ? 'active' : ''}" onclick="updateStatus('${id}', 'No Banho', this)">Banho</button>
                <button class="btn-status ${data.status === 'Secando' ? 'active' : ''}" onclick="updateStatus('${id}', 'Secando', this)">Secando</button>
                <button class="btn-status ${data.status === 'Pronto' ? 'active' : ''}" onclick="updateStatus('${id}', 'Pronto', this)">Pronto</button>
            </div>

            ${whatsappHtml}

            <div style="display: flex; gap: 0.5rem;">
                <button class="btn-cancelar" onclick="cancelAppointment('${id}', this)">❌ Cancelar</button>
                <button class="btn-reschedule" onclick="toggleReschedule('${id}', this)">🗓️ Remarcar</button>
            </div>

            <div id="reschedule-area-${id}" class="reschedule-area">
                <label style="display:block; margin-bottom:0.5rem; font-weight:bold;">Alterar Serviços:</label>
                <div id="edit-services-${id}" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
                    <!-- JS will populate -->
                </div>

                <label style="display:block; margin-bottom:0.5rem; font-weight:bold;">Nova Data:</label>
                <input type="date" id="reschedule-date-${id}" value="${currentIsoDate}" style="width:100%; padding:0.5rem; margin-bottom:1rem; border:1px solid #ddd; border-radius:6px;">

                <label style="display:block; margin-bottom:0.5rem; font-weight:bold;">Novo Horário:</label>
                <select id="reschedule-time-${id}" style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:6px; margin-bottom:1rem;">
                    ${options}
                </select>

                <button class="btn-save" style="margin-top:0;" onclick="saveReschedule('${id}', this)">Salvar Alterações</button>
            </div>

            <button class="btn-concluir" onclick="confirmAndComplete('${id}', this)">✅ Concluir</button>
            `;
        } else {
            buttonsHtml = `
            <button class="delete-btn" onclick="deletePermanently('${id}')">🗑️ Apagar permanentemente</button>
            `;
        }

        card.innerHTML = `
            <div class="card-header">
                <span class="status-badge ${statusClass}">${data.status}</span>
                <h3 class="pet-name">${escapeHtml(data.petName)}${escapeHtml(ownerName)}</h3>
                <div class="pet-info" style="margin-top: 0.5rem; color: #333;">
                     <strong>Serviços:</strong> ${escapeHtml(serviceType)}
                </div>
                <div class="pet-info" style="color: #333;">
                     <strong>Porte:</strong> ${escapeHtml(petSize)} | <strong>Total:</strong> ${escapeHtml(totalValue)}
                </div>
                ${desemboloInputHtml}
                <div class="pet-info" style="color: #333;">
                     <strong>Pagamento:</strong> ${escapeHtml(paymentMethod)}
                </div>
                <div class="pet-info" style="margin-top: 0.5rem;">📅 ${dateStr} - 🕒 ${timeStr}</div>
                <div class="pet-info">📞 ${formatPhone(data.ownerPhone)}</div>
            </div>
            ${obsHtml}
            ${editObsHtml}
            ${buttonsHtml}
        `;

        return card;
    }

    function formatPhone(phone) {
        if (!phone) return '';
        if (phone.length === 11) {
            return `(${phone.substring(0,2)}) ${phone.substring(2,7)}-${phone.substring(7)}`;
        }
        return phone;
    }

    // --- Settings Logic ---

    async function generateDynamicSlotCheckboxes() {
        slotsCheckboxesContainer.innerHTML = 'Carregando horários...';

        try {
            const timeConfigSnap = await getDoc(doc(db, "configuracoes", "tempos"));
            let agendaInterval = 30;
            if (timeConfigSnap.exists() && timeConfigSnap.data().agendaInterval) {
                agendaInterval = parseInt(timeConfigSnap.data().agendaInterval);
            }

            const allSlots = [];
            let t = new Date(`2000-01-01T08:00:00`);
            const endT = new Date(`2000-01-01T18:00:00`);

            while (t < endT) {
                const h = t.getHours().toString().padStart(2, '0');
                const m = t.getMinutes().toString().padStart(2, '0');
                allSlots.push(`${h}:${m}`);
                t.setMinutes(t.getMinutes() + agendaInterval);
            }

            slotsCheckboxesContainer.innerHTML = '';
            allSlots.forEach(slot => {
                const label = document.createElement('label');
                label.className = 'checkbox-item';
                label.innerHTML = `
                    <input type="checkbox" name="blockedSlot" value="${slot}">
                    <span>${slot}</span>
                `;
                slotsCheckboxesContainer.appendChild(label);
            });
        } catch (error) {
            console.error("Error generating slot checkboxes:", error);
            slotsCheckboxesContainer.innerHTML = 'Erro ao carregar horários.';
        }
    }

    window.loadConfiguration = async () => {
        const dateVal = configDateInput.value;
        if (!dateVal) {
            configOptions.style.display = 'none';
            return;
        }

        const dateObj = new Date(dateVal + 'T00:00:00');
        if (dateObj.getDay() === 0) {
            configOptions.style.display = 'none';
            configMessage.textContent = "Domingos são fechados por padrão e não podem ser modificados.";
            configMessage.style.display = 'block';
            configMessage.style.color = '#d32f2f'; // Red color for emphasis
            return;
        }

        configOptions.style.display = 'block';
        configMessage.style.display = 'none';
        configMessage.style.color = '#666'; // Reset color

        // Reset form
        blockAllDayCheckbox.checked = false;
        configDayCapacityInput.value = '';

        await generateDynamicSlotCheckboxes();

        try {
            const docRef = doc(db, "configuracoes", dateVal);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.capacityPerSlot) {
                    configDayCapacityInput.value = data.capacityPerSlot;
                }
                if (data.blockedAllDay) {
                    blockAllDayCheckbox.checked = true;
                }
                if (data.blockedSlots && Array.isArray(data.blockedSlots)) {
                    data.blockedSlots.forEach(slot => {
                        const cb = document.querySelector(`input[name="blockedSlot"][value="${slot}"]`);
                        if (cb) cb.checked = true;
                    });
                }
            }
        } catch (error) {
            console.error("Error loading config:", error);
            alert("Erro ao carregar configurações.");
        }
    };

    window.saveConfiguration = async () => {
        const dateVal = configDateInput.value;
        if (!dateVal) return;

        const dateObj = new Date(dateVal + 'T00:00:00');
        if (dateObj.getDay() === 0) {
            alert("Não é possível alterar configurações de domingos.");
            return;
        }

        const blockedAllDay = blockAllDayCheckbox.checked;
        const blockedSlots = [];
        document.querySelectorAll('input[name="blockedSlot"]:checked').forEach(cb => {
            blockedSlots.push(cb.value);
        });

        const data = {
            blockedAllDay: blockedAllDay,
            blockedSlots: blockedSlots
        };

        const customCap = parseInt(configDayCapacityInput.value);
        if (!isNaN(customCap) && customCap > 0) {
            data.capacityPerSlot = customCap;
        } else {
            // we remove it if it was previously set and now is empty
            data.capacityPerSlot = null;
        }

        try {
            await setDoc(doc(db, "configuracoes", dateVal), data, {merge: true}); // Use merge so we don't overwrite if other data exists implicitly
            configMessage.textContent = "Configurações salvas com sucesso! ✅";
            configMessage.style.display = 'block';
            setTimeout(() => {
                configMessage.style.display = 'none';
            }, 3000);
        } catch (error) {
            console.error("Error saving config:", error);
            alert("Erro ao salvar configurações.");
        }
    };

    // --- Global Actions (Status Update / Delete) ---
    window.saveObservation = async (id) => {
        const input = document.getElementById(`obs-input-${id}`);
        const newText = input.value.trim();

        try {
             await updateDoc(doc(db, "appointments", id), {
                observations: newText
            });
            alert("Observação salva com sucesso!");
        } catch(e) {
            console.error("Error saving obs:", e);
            alert("Erro ao salvar observação.");
        }
    };

    window.saveDesembolo = async (id) => {
        const input = document.getElementById(`desembolo-${id}`);
        const newValue = parseFloat(input.value);

        if (isNaN(newValue) || newValue < 0) {
            alert("Por favor, insira um valor válido.");
            return;
        }

        try {
            const docRef = doc(db, "appointments", id);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                alert("Agendamento não encontrado.");
                return;
            }

            const data = docSnap.data();
            const currentTotal = parseFloat(data.totalValue) || 0;
            const currentDesembolo = parseFloat(data.valorDesembolo) || 0;

            // Calculate new total: remove old desembolo, add new desembolo
            const newTotal = (currentTotal - currentDesembolo) + newValue;

            await updateDoc(docRef, {
                valorDesembolo: newValue,
                totalValue: newTotal
            });

            alert("Valor do desembolo salvo e total atualizado!");
        } catch (e) {
            console.error("Error saving desembolo:", e);
            alert("Erro ao salvar valor do desembolo.");
        }
    };

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
            const docRef = doc(db, "appointments", id);
            await updateDoc(docRef, {
                status: newStatus
            });
            syncCardVisualStatus(btnElement, newStatus);
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

    window.cancelAppointment = async (id, btnElement) => {
        if (confirm("Tem certeza que deseja CANCELAR este agendamento?")) {
            let originalText = '';
            if (btnElement) {
                btnElement.disabled = true;
                originalText = btnElement.textContent;
                btnElement.textContent = 'Processando...';
            }
            try {
                const docRef = doc(db, "appointments", id);
                await updateDoc(docRef, {
                    status: 'Cancelado'
                });
                closeModal(null, true);
            } catch (e) {
                console.error("Error canceling document: ", e);
                alert("Erro ao cancelar.");
            } finally {
                if (btnElement) {
                    btnElement.disabled = false;
                    btnElement.textContent = originalText;
                }
            }
        }
    };

    window.confirmAndComplete = async (id, btnElement) => {
        if (confirm("Tem certeza que deseja CONCLUIR este agendamento?")) {
            let originalText = '';
            if (btnElement) {
                btnElement.disabled = true;
                originalText = btnElement.textContent;
                btnElement.textContent = 'Processando...';
            }
            try {
                const docRef = doc(db, "appointments", id);
                await updateDoc(docRef, {
                    status: 'Concluído'
                });
                closeModal(null, true);
            } catch (e) {
                console.error("Error completing document: ", e);
                alert("Erro ao concluir.");
            } finally {
                if (btnElement) {
                    btnElement.disabled = false;
                    btnElement.textContent = originalText;
                }
            }
        }
    };

    window.deletePermanently = async (id) => {
        if (confirm("Tem certeza que deseja APAGAR este agendamento permanentemente?")) {
            try {
                await deleteDoc(doc(db, "appointments", id));
                // If we are in history tab, the listener will update the list
            } catch (e) {
                console.error("Error deleting document: ", e);
                alert("Erro ao apagar agendamento.");
            }
        }
    };

    window.deleteAllHistory = async () => {
        if (!confirm("ESTA AÇÃO É IRREVERSÍVEL. Deseja apagar todo o histórico?")) {
            return;
        }

        const sure = prompt("Para confirmar, digite 'APAGAR' (sem aspas):");
        if (sure !== 'APAGAR') {
            alert("Ação cancelada.");
            return;
        }

        try {
            // Get all Completed or Cancelled appointments
            // Note: Firestore 'in' query supports up to 10 values
            const q = query(
                collection(db, "appointments"),
                where("status", "in", ["Concluído", "Cancelado"])
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                alert("Nenhum histórico para apagar.");
                return;
            }

            const batch = writeBatch(db);
            snapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            alert("Histórico apagado com sucesso!");
        } catch (e) {
            console.error("Error deleting history: ", e);
            alert("Erro ao apagar histórico.");
        }
    };


    async function buildRescheduleOptions(id) {
        const area = document.getElementById(`reschedule-area-${id}`);
        const dateInput = document.getElementById(`reschedule-date-${id}`);
        const timeInput = document.getElementById(`reschedule-time-${id}`);
        if (!area || !dateInput || !timeInput) return;

        const dateVal = dateInput.value;
        const petSize = area.getAttribute('data-size') || 'M';
        const selectedServices = [];
        document.querySelectorAll(`.edit-service-cb-${id}:checked`).forEach(cb => selectedServices.push(cb.value));

        if (!dateVal || selectedServices.length === 0) {
            timeInput.innerHTML = '<option value="">Selecione serviços e data</option>';
            return;
        }

        const dateObj = new Date(dateVal + 'T00:00:00');
        if (dateObj.getDay() === 0) {
            timeInput.innerHTML = '<option value="">Fechado aos domingos</option>';
            return;
        }

        try {
            const [globalConfigSnap, timeConfigSnap, dayConfigSnap] = await Promise.all([
                getDoc(doc(db, "configuracoes", "geral")),
                getDoc(doc(db, "configuracoes", "tempos")),
                getDoc(doc(db, "configuracoes", dateVal))
            ]);

            let capacity = 1;
            if (globalConfigSnap.exists() && globalConfigSnap.data().capacityPerSlot) {
                capacity = parseInt(globalConfigSnap.data().capacityPerSlot) || 1;
            }

            const timeData = timeConfigSnap.exists() ? timeConfigSnap.data() : {};
            const serviceTimes = timeData.services || {};
            if (serviceTimes["Tosa"] && !serviceTimes["Banho e Tosa"]) serviceTimes["Banho e Tosa"] = serviceTimes["Tosa"];
            if (serviceTimes["Banho + Tosa"] && !serviceTimes["Banho e Tosa"]) serviceTimes["Banho e Tosa"] = serviceTimes["Banho + Tosa"];
            const sizeExtras = timeData.sizes || {};
            const agendaInterval = parseInt(timeData.agendaInterval) || 30;

            let totalDuration = 0;
            selectedServices.forEach(srv => {
                totalDuration += serviceTimes[srv] ? parseInt(serviceTimes[srv]) : 30;
            });
            if (sizeExtras[petSize]) totalDuration += parseInt(sizeExtras[petSize]);
            const slotsNeeded = Math.ceil(totalDuration / agendaInterval);

            let blockedAllDay = false;
            const blockedSlots = new Set();
            if (dayConfigSnap.exists()) {
                const dayData = dayConfigSnap.data();
                if (dayData.capacityPerSlot) capacity = parseInt(dayData.capacityPerSlot); // Override global
                if (dayData.blockedAllDay) blockedAllDay = true;
                if (Array.isArray(dayData.blockedSlots)) dayData.blockedSlots.forEach(s => blockedSlots.add(s));
            }

            if (blockedAllDay) {
                timeInput.innerHTML = '<option value="">Fechado neste dia</option>';
                return;
            }

            const startOfDay = `${dateVal}T00:00`;
            const endOfDay = `${dateVal}T23:59`;
            const q = query(
                collection(db, "appointments"),
                where("appointmentTime", ">=", startOfDay),
                where("appointmentTime", "<=", endOfDay)
            );
            const querySnapshot = await getDocs(q);

            const allSlots = [];
            let t = new Date(`${dateVal}T08:00:00`);
            const endT = new Date(`${dateVal}T18:00:00`);
            while (t < endT) {
                allSlots.push(`${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`);
                t.setMinutes(t.getMinutes() + agendaInterval);
            }

            const occupancy = {};
            allSlots.forEach(s => occupancy[s] = 0);

            querySnapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (docSnap.id === id) return;
                if (data.status === 'Cancelado' || data.status === 'Concluído') return;
                if (!data.appointmentTime) return;

                const timePart = data.appointmentTime.split('T')[1];
                const apptSlots = data.slotsNeeded || 1;
                const startIdx = allSlots.indexOf(timePart);
                if (startIdx !== -1) {
                    for (let i = 0; i < apptSlots; i++) {
                        const check = allSlots[startIdx + i];
                        if (check) occupancy[check] = (occupancy[check] || 0) + 1;
                    }
                }
            });

            const previous = timeInput.value;
            const now = new Date();
            const isToday = (new Date(`${dateVal}T00:00:00`).toDateString() === now.toDateString());

            timeInput.innerHTML = '';
            allSlots.forEach((slot, index) => {
                let canBook = true;
                if (isToday) {
                    const [h,m] = slot.split(':').map(Number);
                    if (h < now.getHours() || (h === now.getHours() && m < now.getMinutes())) canBook = false;
                }
                if (canBook && (index + slotsNeeded > allSlots.length)) canBook = false;

                if (canBook) {
                    for (let i = 0; i < slotsNeeded; i++) {
                        const check = allSlots[index + i];
                        if (blockedSlots.has(check) || (occupancy[check] || 0) >= capacity) {
                            canBook = false;
                            break;
                        }
                    }
                }

                const opt = document.createElement('option');
                opt.value = slot;
                opt.textContent = slot;
                opt.disabled = !canBook;
                timeInput.appendChild(opt);
            });

            const firstEnabled = Array.from(timeInput.options).find(o => !o.disabled);
            if (previous && Array.from(timeInput.options).some(o => o.value === previous && !o.disabled)) {
                timeInput.value = previous;
            } else if (firstEnabled) {
                timeInput.value = firstEnabled.value;
            } else {
                timeInput.innerHTML = '<option value="">Sem horários disponíveis</option>';
            }
        } catch (e) {
            console.error('Error loading reschedule slots:', e);
            timeInput.innerHTML = '<option value="">Erro ao carregar horários</option>';
        }
    }

    window.toggleReschedule = async (id, btnElement) => {
        const area = document.getElementById(`reschedule-area-${id}`);
        if (!area) return;

        const isOpen = area.style.display === 'block';
        if (isOpen) {
            area.style.display = 'none';
            if (btnElement) btnElement.textContent = '🗓️ Remarcar';
            return;
        }

        const servicesDiv = document.getElementById(`edit-services-${id}`);
        servicesDiv.innerHTML = 'Carregando serviços...';

        try {
            const apptRef = doc(db, "appointments", id);
            const apptSnap = await getDoc(apptRef);
            let currentServices = [];
            let currentSize = 'M';

            if (apptSnap.exists()) {
                const d = apptSnap.data();
                if (d.services && Array.isArray(d.services)) currentServices = d.services;
                else if (d.serviceType) currentServices = [d.serviceType];
                if (d.petSize) currentSize = d.petSize;

                area.setAttribute('data-size', currentSize);
            }

            servicesDiv.innerHTML = '';
            servicesList.forEach(srv => {
                const checked = currentServices.includes(srv) ? 'checked' : '';
                const html = `
                    <div style="display:flex; align-items:center; gap:0.25rem;">
                        <input type="checkbox" id="edit-srv-${id}-${srv.replace(/\s+/g, '')}" value="${srv}" ${checked} class="edit-service-cb-${id}">
                        <label for="edit-srv-${id}-${srv.replace(/\s+/g, '')}" style="font-size:0.85rem;">${srv}</label>
                    </div>
                `;
                servicesDiv.innerHTML += html;
            });

            document.querySelectorAll(`.edit-service-cb-${id}`).forEach(cb => {
                cb.addEventListener('change', async (e) => {
                    if (e.target.checked) {
                        if (e.target.value === 'Banho e Tosa') {
                            const masterCb = document.querySelector(`.edit-service-cb-${id}[value="Banho Master"]`);
                            if (masterCb) masterCb.checked = false;
                        } else if (e.target.value === 'Banho Master') {
                            const tosaCb = document.querySelector(`.edit-service-cb-${id}[value="Banho e Tosa"]`);
                            if (tosaCb) tosaCb.checked = false;
                        }
                    }
                    await buildRescheduleOptions(id);
                });
            });

            const dateInput = document.getElementById(`reschedule-date-${id}`);
            if (dateInput) {
                dateInput.addEventListener('change', () => buildRescheduleOptions(id));
                dateInput.addEventListener('input', () => buildRescheduleOptions(id));
            }

            area.style.display = 'block';
            if (btnElement) btnElement.textContent = '✖ Fechar remarcar';
            await buildRescheduleOptions(id);

        } catch(e) {
            console.error("Error preparing edit:", e);
            servicesDiv.innerHTML = "Erro ao carregar.";
        }
    };

    window.saveReschedule = async (id, btnElement) => {
        const dateInput = document.getElementById(`reschedule-date-${id}`);
        const timeInput = document.getElementById(`reschedule-time-${id}`);
        const area = document.getElementById(`reschedule-area-${id}`);
        const petSize = area.getAttribute('data-size') || 'M';

        const newDate = dateInput.value;
        const newTime = timeInput.value;

        // Get selected services
        const selectedServices = [];
        document.querySelectorAll(`.edit-service-cb-${id}:checked`).forEach(cb => selectedServices.push(cb.value));

        let originalText = '';
        if (btnElement) {
            btnElement.disabled = true;
            originalText = btnElement.textContent;
            btnElement.textContent = 'Processando...';
        }

        if (selectedServices.length === 0) {
            alert("Selecione pelo menos um serviço.");
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.textContent = originalText;
            }
            return;
        }

        if (!newDate || !newTime) {
            alert("Selecione data e horário.");
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.textContent = originalText;
            }
            return;
        }

        // Sunday Check
        const dateObj = new Date(newDate + 'T00:00:00');
        if (dateObj.getDay() === 0) {
            alert("Não é possível agendar ou remarcar para Domingos.");
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.textContent = originalText;
            }
            return;
        }

        const newAppointmentTime = `${newDate}T${newTime}`;

        // --- Recalculate Price & Duration ---
        let newTotalValue = 0;
        let newDuration = 0;
        let newSlotsNeeded = 1;

        try {
            const [priceSnap, timeSnap, globalConfigSnap, dayConfigSnap] = await Promise.all([
                getDoc(doc(db, "configuracoes", "precos")),
                getDoc(doc(db, "configuracoes", "tempos")),
                getDoc(doc(db, "configuracoes", "geral")),
                getDoc(doc(db, "configuracoes", newDate))
            ]);

            const priceData = priceSnap.exists() ? priceSnap.data() : {};
            // Migração de compatibilidade de nomes antigos:
            if (priceData["Tosa"] && !priceData["Banho e Tosa"]) {
                priceData["Banho e Tosa"] = priceData["Tosa"];
            }
            if (priceData["Banho + Tosa"] && !priceData["Banho e Tosa"]) {
                priceData["Banho e Tosa"] = priceData["Banho + Tosa"];
            }

            const timeData = timeSnap.exists() ? timeSnap.data() : {};
            const serviceTimes = timeData.services || {};
            // Migração de compatibilidade de nomes antigos:
            if (serviceTimes["Tosa"] && !serviceTimes["Banho e Tosa"]) {
                serviceTimes["Banho e Tosa"] = serviceTimes["Tosa"];
            }
            if (serviceTimes["Banho + Tosa"] && !serviceTimes["Banho e Tosa"]) {
                serviceTimes["Banho e Tosa"] = serviceTimes["Banho + Tosa"];
            }
            const sizeExtras = timeData.sizes || {};
            let agendaInterval = parseInt(timeData.agendaInterval) || 30;

            const validServicesForDiscount = selectedServices.filter(s => s !== 'Desembolo de nós');
            const validCount = validServicesForDiscount.length;

            selectedServices.forEach(srv => {
                // Price
                if (priceData[srv]) {
                    let base = 0;
                    if (petSize === 'P') base = parseFloat(priceData[srv].priceP) || 0;
                    else if (petSize === 'M') base = parseFloat(priceData[srv].priceM) || 0;
                    else if (petSize === 'G') base = parseFloat(priceData[srv].priceG) || 0;

                    const discount = parseFloat(priceData[srv].discount) || 0;
                    if (validCount >= 2 && srv !== 'Desembolo de nós') {
                        newTotalValue += base * (1 - (discount/100));
                    } else {
                        newTotalValue += base;
                    }
                }
                // Duration
                if (serviceTimes[srv]) {
                    newDuration += parseInt(serviceTimes[srv]);
                } else {
                    newDuration += 30;
                }
            });

            // Size Extra Duration
            if (sizeExtras[petSize]) {
                newDuration += parseInt(sizeExtras[petSize]);
            }

            newSlotsNeeded = Math.ceil(newDuration / agendaInterval);

            // --- Check Capacity ---
            // Fetch appointments for the target day to check occupancy
            const startOfDay = `${newDate}T00:00`;
            const endOfDay = `${newDate}T23:59`;

            const q = query(
                collection(db, "appointments"),
                where("appointmentTime", ">=", startOfDay),
                where("appointmentTime", "<=", endOfDay)
            );
            const snapshot = await getDocs(q);

            // Build all slots for the day
            const allSlots = [];
            let t = new Date(`${newDate}T08:00:00`);
            const eTime = new Date(`${newDate}T18:00:00`);
            while (t < eTime) {
                const h = t.getHours().toString().padStart(2,'0');
                const m = t.getMinutes().toString().padStart(2,'0');
                allSlots.push(`${h}:${m}`);
                t.setMinutes(t.getMinutes() + agendaInterval);
            }

            const occupancy = {};
            allSlots.forEach(s => occupancy[s] = 0);

            snapshot.forEach(doc => {
                if (doc.id !== id && doc.data().status !== 'Cancelado' && doc.data().status !== 'Concluído') {
                    const data = doc.data();
                    const timePart = data.appointmentTime.split('T')[1];
                    const slots = data.slotsNeeded || 1;
                    const idx = allSlots.indexOf(timePart);
                    if (idx !== -1) {
                        for(let i=0; i<slots; i++) {
                            const st = allSlots[idx+i];
                            if(st) occupancy[st] = (occupancy[st] || 0) + 1;
                        }
                    }
                }
            });

            // Check requested slots
            const startIdx = allSlots.indexOf(newTime);
            let capacity = 1;
            if (globalConfigSnap.exists() && globalConfigSnap.data().capacityPerSlot) {
                capacity = parseInt(globalConfigSnap.data().capacityPerSlot) || 1;
            }
            if (dayConfigSnap.exists() && dayConfigSnap.data().capacityPerSlot) {
                capacity = parseInt(dayConfigSnap.data().capacityPerSlot);
            }

            let isFull = false;

            if (startIdx === -1) {
                alert("Horário inválido (fora do expediente).");
                if (btnElement) {
                    btnElement.disabled = false;
                    btnElement.textContent = originalText;
                }
                return;
            }

            for(let i=0; i<newSlotsNeeded; i++) {
                const checkTime = allSlots[startIdx+i];
                if (!checkTime || (occupancy[checkTime] || 0) >= capacity) {
                    isFull = true;
                    break;
                }
            }

            if (isFull) {
                if (!confirm(`Atenção: A nova duração (${newDuration}min) requer ${newSlotsNeeded} horários, mas não há vagas suficientes. Deseja forçar o encaixe?`)) {
                    if (btnElement) {
                        btnElement.disabled = false;
                        btnElement.textContent = originalText;
                    }
                    return;
                }
            }

            // Update
            await updateDoc(doc(db, "appointments", id), {
                appointmentTime: newAppointmentTime,
                status: 'Agendado',
                services: selectedServices,
                // Update legacy field for compatibility if needed, or keep it as first service
                serviceType: selectedServices.join(', '),
                totalValue: newTotalValue,
                durationMinutes: newDuration,
                slotsNeeded: newSlotsNeeded
            });

            alert("Agendamento alterado com sucesso!");
            area.style.display = 'none';
            const toggleButton = document.querySelector(`#reschedule-area-${id}`)?.parentElement?.querySelector('.btn-reschedule');
            if (toggleButton) toggleButton.textContent = '🗓️ Remarcar';
            closeModal(null, true);

        } catch(e) {
            console.error("Error rescheduling:", e);
            alert("Erro ao salvar alterações.");
        } finally {
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.textContent = originalText;
            }
        }
    };

    // --- Event Listeners ---

    // Agenda Tab
    agendaDateInput.addEventListener('change', () => {
        loadAppointments();
    });
    agendaDateInput.addEventListener('input', () => {
        loadAppointments();
    });

    // Filters
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');

    if (searchInput) {
        searchInput.addEventListener('input', filterAppointments);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', filterAppointments);
    }

    // Configurações Tab
    configDateInput.addEventListener('change', () => {
        loadConfiguration();
    });
    configDateInput.addEventListener('input', () => {
        loadConfiguration();
    });

    // --- Execution ---
    // --- Global Capacity Settings Logic ---
    window.loadGlobalSettings = async () => {
        if (!auth.currentUser) return;
        try {
            const docRef = doc(db, "configuracoes", "geral");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.capacityPerSlot) {
                    globalCapacityInput.value = data.capacityPerSlot;
                }
            }
        } catch (e) {
            console.error("Error loading global settings:", e);
        }
    };

    window.saveGlobalSettings = async () => {
        if (!auth.currentUser) return;
        const capacity = parseInt(globalCapacityInput.value) || 1;
        try {
            await setDoc(doc(db, "configuracoes", "geral"), { capacityPerSlot: capacity }, { merge: true });
            alert("Capacidade global salva com sucesso!");
        } catch (e) {
            console.error("Error saving global settings:", e);
            alert("Erro ao salvar capacidade global.");
        }
    };

    // --- Service Descriptions Settings Logic ---
    function renderServiceDescriptions() {
        const container = document.getElementById('service-descriptions-container');
        if (!container) return;
        container.innerHTML = '';

        servicesList.forEach((service, index) => {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.style.marginBottom = '1rem';
            div.innerHTML = `
                <label style="font-weight: bold; display: block; margin-bottom: 0.5rem;">${service}</label>
                <textarea id="desc-${index}" rows="3" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 6px; resize: vertical;"></textarea>
            `;
            container.appendChild(div);
        });
    }

    async function loadServiceDescriptions() {
        try {
            const docRef = doc(db, "configuracoes", "descricoes");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                servicesList.forEach((service, index) => {
                    const textarea = document.getElementById(`desc-${index}`);
                    if (textarea && data[service]) {
                        textarea.value = data[service];
                    }
                });
            }
        } catch (e) {
            console.error("Error loading descriptions:", e);
        }
    }

    window.saveServiceDescriptions = async () => {
        const descriptions = {};
        servicesList.forEach((service, index) => {
            const textarea = document.getElementById(`desc-${index}`);
            if (textarea) {
                descriptions[service] = textarea.value.trim();
            }
        });

        try {
            await setDoc(doc(db, "configuracoes", "descricoes"), descriptions, { merge: true });
            alert("Descrições salvas com sucesso!");
        } catch (e) {
            console.error("Error saving descriptions:", e);
            alert("Erro ao salvar descrições.");
        }
    };

    // --- Pricing Logic ---

    function renderPriceTable() {
        const container = document.getElementById('price-table-container');
        container.innerHTML = '';

        servicesList.forEach((service, index) => {
            const isDesembolo = service === 'Desembolo de nós';
            const disabledAttr = isDesembolo ? 'disabled' : '';
            const bgStyle = isDesembolo ? 'background-color: #f0f0f0; color: #aaa;' : '';
            const val = isDesembolo ? '0' : '';

            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.gap = '0.5rem';
            row.style.alignItems = 'flex-end';
            row.style.marginBottom = '1.5rem';
            row.style.flexWrap = 'wrap';
            row.style.borderBottom = '1px solid #eee';
            row.style.paddingBottom = '1rem';

            row.innerHTML = `
                <div style="flex: 100%; margin-bottom: 0.5rem;">
                    <label style="font-weight: bold; font-size: 1.1rem; color: var(--primary);">${service}</label>
                </div>
                <div style="flex: 1; min-width: 90px;">
                    <label style="font-size: 0.8rem; color: #666;">Preço P (R$)</label>
                    <input type="number" id="price-p-${index}" class="price-input" min="0" step="0.01" value="${val}" ${disabledAttr} style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 6px; ${bgStyle}">
                </div>
                <div style="flex: 1; min-width: 90px;">
                    <label style="font-size: 0.8rem; color: #666;">Preço M (R$)</label>
                    <input type="number" id="price-m-${index}" class="price-input" min="0" step="0.01" value="${val}" ${disabledAttr} style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 6px; ${bgStyle}">
                </div>
                <div style="flex: 1; min-width: 90px;">
                    <label style="font-size: 0.8rem; color: #666;">Preço G (R$)</label>
                    <input type="number" id="price-g-${index}" class="price-input" min="0" step="0.01" value="${val}" ${disabledAttr} style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 6px; ${bgStyle}">
                </div>
                <div style="flex: 1; min-width: 90px;">
                    <label style="font-size: 0.8rem; color: #666;">% Desc. Combo</label>
                    <input type="number" id="price-disc-${index}" class="price-input" min="0" max="100" step="1" value="${val}" ${disabledAttr} style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 6px; ${bgStyle}">
                </div>
            `;
            container.appendChild(row);
        });
    }

    async function loadPriceSettings() {
        try {
            const docRef = doc(db, "configuracoes", "precos");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();

                // Migração de compatibilidade de nomes antigos:
                if (data["Tosa"] && !data["Banho e Tosa"]) {
                    data["Banho e Tosa"] = data["Tosa"];
                }
                if (data["Banho + Tosa"] && !data["Banho e Tosa"]) {
                    data["Banho e Tosa"] = data["Banho + Tosa"];
                }

                // Services
                servicesList.forEach((service, index) => {
                    if (data[service]) {
                        document.getElementById(`price-p-${index}`).value = data[service].priceP || 0;
                        document.getElementById(`price-m-${index}`).value = data[service].priceM || 0;
                        document.getElementById(`price-g-${index}`).value = data[service].priceG || 0;
                        document.getElementById(`price-disc-${index}`).value = data[service].discount || 0;
                    }
                });
            }
        } catch (e) {
            console.error("Error loading prices:", e);
        }
    }

    window.savePriceSettings = async () => {
        const prices = {};

        // Services
        servicesList.forEach((service, index) => {
            const p = parseFloat(document.getElementById(`price-p-${index}`).value) || 0;
            const m = parseFloat(document.getElementById(`price-m-${index}`).value) || 0;
            const g = parseFloat(document.getElementById(`price-g-${index}`).value) || 0;
            const discount = parseFloat(document.getElementById(`price-disc-${index}`).value) || 0;
            prices[service] = { priceP: p, priceM: m, priceG: g, discount: discount };
        });

        try {
            await setDoc(doc(db, "configuracoes", "precos"), prices);
            alert("Tabela de preços salva com sucesso!");
        } catch (e) {
            console.error("Error saving prices:", e);
            alert("Erro ao salvar preços.");
        }
    };

    // --- Time & Duration Settings Logic ---

    function renderTimeTable() {
        const container = document.getElementById('time-services-container');
        container.innerHTML = '';

        servicesList.forEach((service, index) => {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.innerHTML = `
                <label>${service}</label>
                <input type="number" id="time-dur-${index}" class="time-input" value="30">
            `;
            container.appendChild(div);
        });
    }

    async function loadTimeSettings() {
        try {
            const docRef = doc(db, "configuracoes", "tempos");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.agendaInterval) document.getElementById('agendaInterval').value = data.agendaInterval;

                if (data.services) {
                    // Migração de compatibilidade de nomes antigos:
                    if (data.services["Tosa"] && !data.services["Banho e Tosa"]) {
                        data.services["Banho e Tosa"] = data.services["Tosa"];
                    }
                    if (data.services["Banho + Tosa"] && !data.services["Banho e Tosa"]) {
                        data.services["Banho e Tosa"] = data.services["Banho + Tosa"];
                    }
                    servicesList.forEach((service, index) => {
                        if (data.services[service]) {
                            document.getElementById(`time-dur-${index}`).value = data.services[service];
                        }
                    });
                }

                if (data.sizes) {
                    if (data.sizes['P']) document.getElementById('extraP').value = data.sizes['P'];
                    if (data.sizes['M']) document.getElementById('extraM').value = data.sizes['M'];
                    if (data.sizes['G']) document.getElementById('extraG').value = data.sizes['G'];
                }
            }
        } catch (e) {
            console.error("Error loading time settings:", e);
        }
    }

    window.saveTimeSettings = async () => {
        const agendaInterval = parseInt(document.getElementById('agendaInterval').value) || 30;

        const services = {};
        servicesList.forEach((service, index) => {
             services[service] = parseInt(document.getElementById(`time-dur-${index}`).value) || 30;
        });

        const sizes = {
            'P': parseInt(document.getElementById('extraP').value) || 0,
            'M': parseInt(document.getElementById('extraM').value) || 15,
            'G': parseInt(document.getElementById('extraG').value) || 30
        };

        try {
            await setDoc(doc(db, "configuracoes", "tempos"), {
                agendaInterval: agendaInterval,
                services: services,
                sizes: sizes
            });
            alert("Configurações de tempo salvas com sucesso!");
        } catch (e) {
            console.error("Error saving time settings:", e);
            alert("Erro ao salvar configurações de tempo.");
        }
    };

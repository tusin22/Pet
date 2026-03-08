import re

with open('js/index.js', 'r') as f:
    content = f.read()

# 1. Insert updateSubmitButtonState right after generateSlots function closing bracket or before checkAndGenerateSlots
new_func = """
    function updateSubmitButtonState() {
        const submitBtn = document.getElementById('btn-submit');
        if (submitBtn) {
            submitBtn.disabled = !selectedSlot;
        }
    }
"""
content = content.replace("async function checkAndGenerateSlots() {", new_func + "\n    async function checkAndGenerateSlots() {")

# 2. Update the Sunday logic
old_sunday = """        // Check if Sunday (0)
        if (selectedDate.getDay() === 0) {
            await showCustomAlert("Não funcionamos aos domingos.");
            appointmentDateInput.value = '';
            slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; font-size: 0.9rem;">Selecione Serviço, Porte e Data para ver os horários.</p>';
            return;
        }"""
new_sunday = """        // Check if Sunday (0)
        if (selectedDate.getDay() === 0) {
            slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; padding: 20px;">Não funcionamos aos domingos. Por favor, escolha outra data.</p>';
            selectedSlot = null;
            updateSubmitButtonState();
            return;
        }"""
content = content.replace(old_sunday, new_sunday)

# 3. Update the selectSlot function
old_select = """    function selectSlot(btn, fullIso, duration, slotsNeeded) {
        const prev = slotsContainer.querySelector('.selected');
        if (prev) prev.classList.remove('selected');
        btn.classList.add('selected');
        selectedSlot = fullIso;
        currentSelectionData = { duration, slotsNeeded };
    }"""
new_select = """    function selectSlot(btn, fullIso, duration, slotsNeeded) {
        const prev = slotsContainer.querySelector('.selected');
        if (prev) prev.classList.remove('selected');
        btn.classList.add('selected');
        selectedSlot = fullIso;
        currentSelectionData = { duration, slotsNeeded };
        updateSubmitButtonState();
    }"""
content = content.replace(old_select, new_select)

# 4. updateSubmitButtonState in goToStep
old_gotostep = """        } else if (step === totalSteps) {
            btnPrev.style.display = 'block';
            btnNext.style.display = 'none';
            btnSubmit.style.display = 'block';
        } else {"""
new_gotostep = """        } else if (step === totalSteps) {
            btnPrev.style.display = 'block';
            btnNext.style.display = 'none';
            btnSubmit.style.display = 'block';
            updateSubmitButtonState();
        } else {"""
content = content.replace(old_gotostep, new_gotostep)

# 5. Reset selectedSlot and disable button when starting checkAndGenerateSlots error paths
old_past = """        if (selectedDate < today) {
            await showCustomAlert("Por favor, selecione uma data futura.");
            appointmentDateInput.value = '';
            slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; font-size: 0.9rem;">Selecione Serviço, Porte e Data para ver os horários.</p>';
            return;
        }"""
new_past = """        if (selectedDate < today) {
            await showCustomAlert("Por favor, selecione uma data futura.");
            appointmentDateInput.value = '';
            slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; font-size: 0.9rem;">Selecione Serviço, Porte e Data para ver os horários.</p>';
            selectedSlot = null;
            updateSubmitButtonState();
            return;
        }"""
content = content.replace(old_past, new_past)

# 6. Add updateSubmitButtonState to places where slotsContainer.innerHTML is reset
old_err1 = """            if (blockedAllDay) {
                 slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #d32f2f; font-weight: bold;">Fechado neste dia.</p>';
                 return;
            }"""
new_err1 = """            if (blockedAllDay) {
                 slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #d32f2f; font-weight: bold;">Fechado neste dia.</p>';
                 updateSubmitButtonState();
                 return;
            }"""
content = content.replace(old_err1, new_err1)

old_err2 = """            if (allSlots.length === 0) {
                 slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">Não há horários configurados.</p>';
                 return;
            }"""
new_err2 = """            if (allSlots.length === 0) {
                 slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">Não há horários configurados.</p>';
                 updateSubmitButtonState();
                 return;
            }"""
content = content.replace(old_err2, new_err2)

old_err3 = """            slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Erro ao carregar horários. Tente novamente.</p>';
        }
    }"""
new_err3 = """            slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Erro ao carregar horários. Tente novamente.</p>';
            updateSubmitButtonState();
        }
    }"""
content = content.replace(old_err3, new_err3)

old_start = """    async function generateSlots(dateString) {
        slotsContainer.innerHTML = '<p class="loading" style="grid-column: 1/-1;">Calculando disponibilidade...</p>';
        selectedSlot = null;"""
new_start = """    async function generateSlots(dateString) {
        slotsContainer.innerHTML = '<p class="loading" style="grid-column: 1/-1;">Calculando disponibilidade...</p>';
        selectedSlot = null;
        updateSubmitButtonState();"""
content = content.replace(old_start, new_start)

# Add updateSubmitButtonState when checkAndGenerateSlots has early returns
old_check1 = """        if (!dateVal || selectedCheckboxes.length === 0 || !size) {
            slotsContainer.innerHTML = '<p class="empty-slots-msg">Selecione o porte, os serviços e a data para ver os horários disponíveis.</p>';
            return;
        }"""
new_check1 = """        if (!dateVal || selectedCheckboxes.length === 0 || !size) {
            slotsContainer.innerHTML = '<p class="empty-slots-msg">Selecione o porte, os serviços e a data para ver os horários disponíveis.</p>';
            selectedSlot = null;
            updateSubmitButtonState();
            return;
        }"""
content = content.replace(old_check1, new_check1)

with open('js/index.js', 'w') as f:
    f.write(content)

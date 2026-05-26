// =========================================================================
// FIREBASE CONFIGURATION
// =========================================================================
const firebaseConfig = {
    apiKey: "AIzaSyCeP1EDq1-WjuIdrek6QJJEV9ojVWOvCYQ",
    authDomain: "fsm-app-5557d.firebaseapp.com",
    databaseURL: "https://fsm-app-5557d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "fsm-app-5557d",
    storageBucket: "fsm-app-5557d.firebasestorage.app",
    messagingSenderId: "160452263001",
    appId: "1:160452263001:web:ebf0b64b467d3e1864c548",
    measurementId: "G-0Q0JLCSNXE"
};

// =========================================================================
// APPLICATION STATE
// =========================================================================
let db = JSON.parse(localStorage.getItem('fsm_db_v11')) || { 
    models: ["Magner 150", "Kisan Newton", "SBM SB-2000"], 
    banks: ["MAIB", "Moldindconbank", "Victoriabank"], 
    routes: ["Маршрут 1 (Центр)", "Маршрут 2 (Ботаника)"], 
    employees: ["Инженер 1", "Инженер 2"], 
    cities: ["Кишинев", "Бельцы"], 
    addresses: [], 
    machines: [], 
    history: [] 
};

// Fallback initializations for older localStorage schemas
db.models = db.models || ["Magner 150", "Kisan Newton", "SBM SB-2000"];
db.banks = db.banks || ["MAIB", "Moldindconbank", "Victoriabank"];
db.routes = db.routes || ["Маршрут 1 (Центр)", "Маршрут 2 (Ботаника)"];
db.employees = db.employees || ["Инженер 1", "Инженер 2"];
db.cities = db.cities || ["Кишинев", "Бельцы"];
db.addresses = db.addresses || [];
db.machines = db.machines || [];
db.history = db.history || [];

// Deduplicate array of objects by their 'id' property, merging contents
function deduplicateById(arr) {
    if (!Array.isArray(arr)) return [];
    const map = new Map();
    arr.forEach(item => {
        if (!item || item.id === undefined || item.id === null) return;
        const id = String(item.id);
        const existing = map.get(id);
        if (!existing) {
            map.set(id, { ...item });
        } else {
            const merged = { ...existing };
            Object.keys(item).forEach(k => {
                if (item[k] !== undefined && item[k] !== null && item[k] !== '') {
                    merged[k] = item[k];
                }
            });
            map.set(id, merged);
        }
    });
    return Array.from(map.values()).map(item => {
        if (typeof item.id === 'string' && !isNaN(item.id)) {
            item.id = Number(item.id);
        }
        return item;
    });
}

// Helper to convert Firebase objects back to JS arrays
function ensureArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) {
        return val.filter(x => x !== null && x !== undefined);
    }
    if (typeof val === 'object') {
        return Object.values(val);
    }
    return [];
}

// Run initial deduplication of local storage database
db.addresses = deduplicateById(ensureArray(db.addresses));
db.machines = deduplicateById(ensureArray(db.machines));
db.history = deduplicateById(ensureArray(db.history));

// Initialize app UI on load
document.addEventListener('DOMContentLoaded', () => {
    renderAll();
    initializeFirebase();
});

// =========================================================================
// TOAST NOTIFICATIONS
// =========================================================================
let toastTimeout;
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.style.display = 'block';
    // Small timeout to allow element block generation for transition
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { 
        toast.classList.remove('show');
        setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 3500);
}

function showError(title, text) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'none';
    
    const titleEl = document.getElementById('loadingTitle');
    titleEl.innerText = title;
    titleEl.style.color = 'var(--danger-color)';
    
    const textEl = document.getElementById('loadingText');
    textEl.innerHTML = `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); padding: 12px; border-radius: 8px; margin-top: 12px; color: var(--text-primary); text-align: center; max-width: 280px; font-size: 13px;">
            ${text}
        </div>
    `;
}

// =========================================================================
// FIREBASE SYNCHRONIZATION
// =========================================================================
function initializeFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            throw new Error("SDK_NOT_LOADED");
        }
        if (typeof firebase.database === 'undefined') {
            throw new Error("DATABASE_SDK_NOT_LOADED");
        }
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();
        const statusEl = document.getElementById('netStatus');
        
        // Listen for connectivity status
        database.ref(".info/connected").on("value", (snap) => {
            if (snap.val() === true) {
                statusEl.innerText = "🟢 В сети";
                statusEl.className = "net-status";
                statusEl.style.color = "var(--success-color)";
                statusEl.style.borderColor = "rgba(16, 185, 129, 0.2)";
                statusEl.style.backgroundColor = "rgba(16, 185, 129, 0.05)";
            } else {
                statusEl.innerText = "🔴 Офлайн";
                statusEl.className = "net-status";
                statusEl.style.color = "var(--warning-color)";
                statusEl.style.borderColor = "rgba(245, 158, 11, 0.2)";
                statusEl.style.backgroundColor = "rgba(245, 158, 11, 0.05)";
            }
        });

        // Set a connection timeout (8s)
        const timeoutId = setTimeout(() => {
            const overlay = document.getElementById('loadingOverlay');
            if (overlay && overlay.style.display !== 'none') {
                showError("Ошибка подключения", "База данных Firebase не отвечает. Переход в автономный режим.");
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 3000);
            }
        }, 8000);

        // Fetch cloud data and listen for updates
        database.ref('fsm_data').on('value', (snapshot) => {
            clearTimeout(timeoutId); 
            const data = snapshot.val();
            
            if (data) {
                db = data;
                // Convert arrays/objects from Firebase safely
                db.models = ensureArray(db.models);
                db.banks = ensureArray(db.banks);
                db.routes = ensureArray(db.routes);
                db.employees = ensureArray(db.employees);
                db.cities = ensureArray(db.cities);
                
                const rawAddr = ensureArray(db.addresses);
                const rawMach = ensureArray(db.machines);
                const rawHist = ensureArray(db.history);
                
                db.addresses = deduplicateById(rawAddr);
                db.machines = deduplicateById(rawMach);
                db.history = deduplicateById(rawHist);
                
                db.machines.forEach(m => { 
                    m.characteristics = ensureArray(m.characteristics); 
                });
                db.history.forEach(h => { 
                    h.tasks = ensureArray(h.tasks); 
                });
                
                localStorage.setItem('fsm_db_v11', JSON.stringify(db));
                renderAll();
                
                // If duplicates were cleaned up, sync the cleaned database back to the cloud
                if (rawAddr.length !== db.addresses.length || 
                    rawMach.length !== db.machines.length || 
                    rawHist.length !== db.history.length) {
                    console.log("Cleaned up duplicates from Firebase. Syncing clean database back.");
                    saveData();
                }
            }
            
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) overlay.style.display = 'none';
        }, (error) => {
            clearTimeout(timeoutId);
            statusEl.innerText = "🔴 Ошибка БД";
            statusEl.style.color = "var(--danger-color)";
            statusEl.style.borderColor = "rgba(239, 68, 68, 0.2)";
            statusEl.style.backgroundColor = "rgba(239, 68, 68, 0.05)";
            
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) overlay.style.display = 'none';
            showToast("Ошибка загрузки данных из Firebase: " + error.message);
        });

    } catch (err) {
        console.error("Firebase init failed:", err);
        const statusEl = document.getElementById('netStatus');
        if (err.message === "SDK_NOT_LOADED") {
            statusEl.innerText = "🔴 Ошибка: Не загружен Firebase SDK";
        } else if (err.message === "DATABASE_SDK_NOT_LOADED") {
            statusEl.innerText = "🔴 Ошибка: Не загружен SDK БД";
        } else {
            statusEl.innerText = "🔴 Ошибка ключей: " + err.message;
        }
        statusEl.style.color = "var(--danger-color)";
        statusEl.style.borderColor = "rgba(239, 68, 68, 0.2)";
        statusEl.style.backgroundColor = "rgba(239, 68, 68, 0.05)";
        
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    }
}

function saveData(path = null, data = null) {
    localStorage.setItem('fsm_db_v11', JSON.stringify(db));
    renderAll();

    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
        // ALWAYS write the entire database to maintain array structure compatibility for older clients
        firebase.database().ref('fsm_data').set(db).catch((error) => {
            console.log("Синхронизация отложена (офлайн): " + error.message);
        });
    }
}

// =========================================================================
// GEOLOCATION SERVICES
// =========================================================================
function getCurrentLocation() {
    showToast('⏳ Запрашиваем GPS у телефона...');
    
    // Check if running inside Capacitor
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Geolocation) {
        window.Capacitor.Plugins.Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }).then((position) => {
            receiveLocation(position.coords.latitude, position.coords.longitude);
        }).catch((error) => {
            showToast('❌ Ошибка GPS Capacitor: ' + error.message);
        });
    } else {
        if (!navigator.geolocation) {
            showToast('⚠️ Геолокация не поддерживается браузером');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => receiveLocation(position.coords.latitude, position.coords.longitude),
            (error) => showToast('❌ Ошибка GPS: ' + error.message),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    }
}

// Global hook for Capacitor or manual callbacks
async function receiveLocation(lat, lon) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ru`);
        const data = await response.json();
        
        if (data && data.address) {
            const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
            const road = data.address.road || data.address.pedestrian || data.address.suburb || '';
            const house = data.address.house_number || '';
            
            let fullAddress = [];
            if (city) fullAddress.push(city);
            if (road) fullAddress.push(road + (house ? ' ' + house : ''));
            
            document.getElementById('addrText').value = fullAddress.join(', ') || data.display_name;
            showToast('✅ Точный адрес определен!');
        } else {
            document.getElementById('addrText').value = `${lat}, ${lon}`;
            showToast('⚠️ Вставлены координаты (улица не найдена)');
        }
    } catch (e) {
        document.getElementById('addrText').value = `${lat}, ${lon}`;
        showToast('⚠️ Ошибка сети, вставлены координаты');
    }
}

// Bind to window to allow access globally
window.receiveLocation = receiveLocation;

function openMapInKodular(query) {
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(mapUrl, '_blank');
}

// =========================================================================
// CUSTOM DIALOG & MODAL CONTROLLERS
// =========================================================================
let confirmStep = 0;
let confirmCallback = null;

function doubleConfirm(actionText, callback) {
    confirmStep = 1;
    confirmCallback = callback;
    
    document.getElementById('confirmTitle').innerText = "ШАГ 1 из 2";
    document.getElementById('confirmTitle').style.color = "var(--primary-color)";
    document.getElementById('confirmText').innerText = `Вы уверены, что хотите ${actionText}?`;
    
    const confirmBtn = document.getElementById('confirmBtn');
    confirmBtn.innerText = "Да, уверен";
    confirmBtn.className = "btn-success";
    document.getElementById('confirmModal').style.display = 'flex';
}

document.getElementById('confirmBtn').onclick = function() {
    if (confirmStep === 1) {
        confirmStep = 2;
        document.getElementById('confirmTitle').innerText = "ШАГ 2 из 2 (ОКОНЧАТЕЛЬНО)";
        document.getElementById('confirmTitle').style.color = "var(--danger-color)";
        document.getElementById('confirmText').innerText = "Вы точно подтверждаете это действие? Отменить его будет невозможно.";
        
        const confirmBtn = document.getElementById('confirmBtn');
        confirmBtn.innerText = "Подтверждаю";
        confirmBtn.className = "btn-danger";
    } else if (confirmStep === 2) {
        document.getElementById('confirmModal').style.display = 'none';
        if (confirmCallback) confirmCallback();
        confirmStep = 0;
        confirmCallback = null;
    }
};

function closeConfirm() {
    document.getElementById('confirmModal').style.display = 'none';
    confirmStep = 0;
    confirmCallback = null;
}

let promptCallback = null;

function customPrompt(title, defaultValue, callback) {
    document.getElementById('promptTitle').innerText = title;
    document.getElementById('promptInput').value = defaultValue;
    promptCallback = callback;
    document.getElementById('promptModal').style.display = 'flex';
    document.getElementById('promptInput').focus();
}

document.getElementById('promptBtn').onclick = function() {
    const val = document.getElementById('promptInput').value;
    document.getElementById('promptModal').style.display = 'none';
    if (promptCallback) promptCallback(val);
    promptCallback = null;
};

function closePrompt() {
    document.getElementById('promptModal').style.display = 'none';
    promptCallback = null;
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    confirmStep = 0;
    confirmCallback = null;
    promptCallback = null;
}

// Helper to format Date objects for datetime-local input fields
function getLocalDatetimeString(dateObj) {
    const d = new Date(dateObj);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}

// =========================================================================
// TAB BAR ROUTER
// =========================================================================
function switchTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active-tab'));
    document.getElementById(tabId).classList.add('active-tab');
    
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    btn.classList.add('active');
    
    renderAll();
}

// =========================================================================
// DIRECTORY & CATALOG SERVICES
// =========================================================================
function addDictItem(type, inputId) {
    const val = document.getElementById(inputId).value.trim();
    if (val && !db[type].includes(val)) { 
        db[type].push(val); 
        saveData(type, db[type]); 
        document.getElementById(inputId).value = ''; 
        showToast('✅ Добавлено в справочник');
    }
}

function editDictItem(type, oldVal) {
    customPrompt("Введите новое значение:", oldVal, (newVal) => {
        if (newVal !== null && newVal.trim() !== "" && newVal !== oldVal) {
            doubleConfirm(`ИЗМЕНИТЬ "${oldVal}" на "${newVal}" (это обновит все связанные записи)`, () => {
                const index = db[type].indexOf(oldVal);
                if (index !== -1) db[type][index] = newVal.trim();
                
                // Cascade updates to associated elements
                if (type === 'banks') {
                    db.addresses.forEach(a => { if (a.bank === oldVal) a.bank = newVal.trim(); });
                } else if (type === 'routes') {
                    db.addresses.forEach(a => { if (a.route === oldVal) a.route = newVal.trim(); });
                } else if (type === 'models') {
                    db.machines.forEach(m => { if (m.model === oldVal) m.model = newVal.trim(); });
                } else if (type === 'employees') {
                    db.machines.forEach(m => { if (m.employee === oldVal) m.employee = newVal.trim(); });
                    db.history.forEach(h => { if (h.employee === oldVal) h.employee = newVal.trim(); });
                }
                
                // Cascade updates affect multiple collections, so we save the entire DB
                saveData();
                showToast('✅ Справочник обновлен');
            });
        }
    });
}

function deleteDictItem(type, val) {
    doubleConfirm(`УДАЛИТЬ "${val}" из справочника`, () => {
        db[type] = db[type].filter(x => x !== val);
        saveData(type, db[type]);
        showToast('🗑️ Удалено из справочника');
    });
}

// =========================================================================
// ADDRESS MANAGEMENT
// =========================================================================
function addAddress() {
    const bank = document.getElementById('addrBank').value;
    const address = document.getElementById('addrText').value.trim();
    const route = document.getElementById('addrRoute').value;
    const city = document.getElementById('addrCity').value;
    
    if (!bank || !address || !route || !city) return showToast('⚠️ Заполните все поля!');
    
    const newAddr = { id: Date.now(), bank, address, route, city };
    db.addresses.push(newAddr);
    saveData('addresses/' + newAddr.id, newAddr);
    document.getElementById('addrText').value = '';
    showToast('✅ Адрес добавлен!');
}

function openEditAddress(id) {
    const a = db.addresses.find(x => x.id == id);
    if (!a) return;
    
    document.getElementById('editAddrId').value = id;
    
    // Refresh dropdowns in edit address modal
    populateDropdown('editAddrBank', db.banks, a.bank);
    populateDropdown('editAddrRoute', db.routes, a.route);
    populateDropdown('editAddrCity', db.cities, a.city || '');
    
    document.getElementById('editAddrText').value = a.address;
    document.getElementById('editAddressModal').style.display = 'flex';
}

function saveEditAddress() {
    doubleConfirm('СОХРАНИТЬ ИЗМЕНЕНИЯ в адресе', () => {
        const id = parseInt(document.getElementById('editAddrId').value);
        const a = db.addresses.find(x => x.id == id);
        if (a) {
            a.bank = document.getElementById('editAddrBank').value;
            a.address = document.getElementById('editAddrText').value.trim();
            a.route = document.getElementById('editAddrRoute').value;
            a.city = document.getElementById('editAddrCity').value;
            saveData('addresses/' + a.id, a);
            closeAllModals();
            showToast('✅ Адрес обновлен!');
        }
    });
}

function deleteAddress(id) {
    doubleConfirm('УДАЛИТЬ этот адрес', () => {
        db.addresses = db.addresses.filter(x => x.id != id);
        saveData('addresses/' + id, null);
        showToast('🗑️ Адрес удален');
    });
}

// =========================================================================
// MACHINE MANAGEMENT
// =========================================================================
function openAddMachineModal(addressId) {
    const a = db.addresses.find(x => x.id == addressId);
    if (!a) return;
    
    document.getElementById('addMachAddressId').value = addressId;
    document.getElementById('addMachAddressText').innerText = `📍 ${a.bank}, ${a.address}`;
    
    populateDropdown('addMachModel', db.models);
    populateDropdown('addMachEmployee', db.employees);
    
    document.getElementById('addMachSerial').value = '';
    document.getElementById('addMachInv').value = '';
    document.getElementById('addMachFreq').value = '1';
    
    document.getElementById('addMachineModal').style.display = 'flex';
}

function saveNewMachine() {
    const addressId = document.getElementById('addMachAddressId').value;
    const model = document.getElementById('addMachModel').value;
    const serial = document.getElementById('addMachSerial').value.trim();
    const inv = document.getElementById('addMachInv').value.trim();
    const employee = document.getElementById('addMachEmployee').value;
    
    const freqVal = parseInt(document.getElementById('addMachFreq').value);
    const freq = isNaN(freqVal) ? 1 : freqVal;

    if (!model || !serial) return showToast('⚠️ Заполните Модель и S/N!');
    
    const newMachine = { 
        id: Date.now(), 
        addressId: parseInt(addressId), 
        model, 
        serial, 
        inv, 
        freq, 
        employee,
        characteristics: [] 
    };
    db.machines.push(newMachine);
    
    saveData('machines/' + newMachine.id, newMachine);
    closeAllModals();
    showToast('✅ Машина добавлена!');
}

function openMachineDetails(machineId) {
    const m = db.machines.find(x => x.id == machineId);
    if (!m) return;
    const a = db.addresses.find(x => x.id == m.addressId);
    
    document.getElementById('detMachId').value = m.id;
    document.getElementById('detMachTitle').innerText = `📠 ${m.model}`;
    document.getElementById('detMachSubtitle').innerText = `📍 ${a ? a.bank + ', ' + a.address : 'Адрес удален'}`;
    
    // Populate dropdowns in details modal
    populateAddressDropdown('detMachAddress', m.addressId);
    populateDropdown('detMachModel', db.models, m.model);
    populateDropdown('detMachEmployee', db.employees, m.employee || '');
    
    document.getElementById('detMachSerial').value = m.serial;
    document.getElementById('detMachInv').value = m.inv || '';
    document.getElementById('detMachFreq').value = m.freq;
    
    renderCharacteristicsList(m.id);
    document.getElementById('machineDetailsModal').style.display = 'flex';
}

function saveEditMachine() {
    doubleConfirm('СОХРАНИТЬ ИЗМЕНЕНИЯ в данных машины', () => {
        const id = parseInt(document.getElementById('detMachId').value);
        const m = db.machines.find(x => x.id == id);
        if (!m) return;
        
        const newSerial = document.getElementById('detMachSerial').value.trim();
        const newAddressId = parseInt(document.getElementById('detMachAddress').value);

        // Check if Serial was updated - Add log
        if (m.serial !== newSerial) {
            db.history.forEach(h => {
                if (h.machineId == m.id && !h.machineSerial) {
                    h.machineSerial = m.serial;
                }
            });

            const hChange = {
                id: Date.now(),
                machineId: m.id,
                machineSerial: newSerial,
                machineInv: m.inv || '',
                date: new Date().toISOString(),
                counter: "",
                tasks: ["Замена системной платы / Смена S/N"],
                notes: `Серийный номер изменен с [${m.serial}] на [${newSerial}]`
            };
            db.history.unshift(hChange);
            saveData('history/' + hChange.id, hChange);
        }

        // Check if location was updated - Add log
        if (m.addressId != newAddressId) {
            const oldAddr = db.addresses.find(a => a.id == m.addressId);
            const newAddr = db.addresses.find(a => a.id == newAddressId);
            const oldAddrText = oldAddr ? `${oldAddr.bank}, ${oldAddr.address}` : 'Неизвестно';
            const newAddrText = newAddr ? `${newAddr.bank}, ${newAddr.address}` : 'Неизвестно';
            
            const hMove = {
                id: Date.now() + 1, 
                machineId: m.id,
                machineSerial: newSerial,
                machineInv: m.inv || '',
                date: new Date().toISOString(),
                counter: "",
                tasks: ["Перемещение оборудования"],
                notes: `Машина перемещена:\nОткуда: ${oldAddrText}\nКуда: ${newAddrText}`
            };
            db.history.unshift(hMove);
            saveData('history/' + hMove.id, hMove);
        }

        m.addressId = newAddressId;
        m.model = document.getElementById('detMachModel').value;
        m.serial = newSerial;
        m.inv = document.getElementById('detMachInv').value.trim();
        m.employee = document.getElementById('detMachEmployee').value;
        
        const freqVal = parseInt(document.getElementById('detMachFreq').value);
        m.freq = isNaN(freqVal) ? 1 : freqVal;
        
        saveData('machines/' + m.id, m);
        closeAllModals();
        showToast('✅ Данные машины обновлены!');
    });
}

function deleteMachine() {
    doubleConfirm('УДАЛИТЬ эту машину', () => {
        const id = parseInt(document.getElementById('detMachId').value);
        db.machines = db.machines.filter(x => x.id != id);
        saveData('machines/' + id, null);
        closeAllModals();
        showToast('🗑️ Машина удалена');
    });
}

// Characteristics lists
function renderCharacteristicsList(machineId) {
    const m = db.machines.find(x => x.id == machineId);
    const list = document.getElementById('detCharsList');
    if (!m) return;
    
    if (!m.characteristics || m.characteristics.length === 0) {
        list.innerHTML = '<p style="font-size:12px; color:var(--text-muted); margin:4px 0;">Характеристики пока не добавлены.</p>';
        return;
    }
    
    list.innerHTML = m.characteristics.map(c => `
        <div class="list-item" style="background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: var(--radius-sm); margin-bottom: 6px;">
            <span style="font-size: 13px;">${c.text}</span>
            <div class="actions">
                <button class="btn-outline" style="padding: 4px 8px; font-size:11px;" onclick="editCharacteristic(${m.id}, ${c.id})">✏️</button>
                <button class="btn-danger" style="padding: 4px 8px; font-size:11px;" onclick="deleteCharacteristic(${m.id}, ${c.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function addCharacteristic() {
    const machineId = parseInt(document.getElementById('detMachId').value);
    const text = document.getElementById('detNewCharText').value.trim();
    if (!text) return;
    
    const m = db.machines.find(x => x.id == machineId);
    if (m) {
        if (!m.characteristics) m.characteristics = [];
        const newChar = { id: Date.now(), text };
        m.characteristics.push(newChar);
        document.getElementById('detNewCharText').value = '';
        saveData('machines/' + m.id, m);
        renderCharacteristicsList(machineId);
        showToast('✅ Характеристика добавлена');
    }
}

function editCharacteristic(machineId, charId) {
    const m = db.machines.find(x => x.id == machineId);
    if (!m) return;
    const c = m.characteristics.find(x => x.id == charId);
    if (!c) return;
    
    customPrompt("Редактировать характеристику:", c.text, (newText) => {
        if (newText !== null && newText.trim() !== "" && newText !== c.text) {
            doubleConfirm('ИЗМЕНИТЬ эту характеристику', () => {
                c.text = newText.trim();
                saveData('machines/' + m.id, m);
                renderCharacteristicsList(machineId);
                showToast('✅ Характеристика обновлена');
            });
        }
    });
}

function deleteCharacteristic(machineId, charId) {
    doubleConfirm('УДАЛИТЬ эту характеристику', () => {
        const m = db.machines.find(x => x.id == machineId);
        if (m) {
            m.characteristics = m.characteristics.filter(x => x.id != charId);
            saveData('machines/' + m.id, m);
            renderCharacteristicsList(machineId);
            showToast('🗑️ Характеристика удалена');
        }
    });
}

// =========================================================================
// SERVICE & MAINTENANCE REGISTRATION
// =========================================================================
function isCurrentMonth(dateString) {
    const d = new Date(dateString);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function openServiceModal(machineId) {
    const m = db.machines.find(x => x.id == machineId);
    if (!m) return;
    const a = db.addresses.find(x => x.id == m.addressId);
    if (!a) return;
    
    document.getElementById('modalMachineId').value = machineId;
    document.getElementById('modalTitle').innerText = `ТО: ${m.model}`;
    document.getElementById('modalSubtitle').innerText = `${a.bank}, ${a.address}\nS/N: ${m.serial}`;
    
    document.getElementById('modalDate').value = getLocalDatetimeString(new Date());
    document.getElementById('modalCounter').value = '';
    document.getElementById('modalNotes').value = '';
    document.getElementById('modalParts').value = '';
    document.querySelectorAll('.work-check').forEach(cb => cb.checked = false);
    
    // Populate performer dropdown and preselect machine's responsible employee
    populateDropdown('modalEmployee', db.employees, m.employee || '');
    
    document.getElementById('serviceModal').style.display = 'flex';
}

function saveService() {
    const machineId = parseInt(document.getElementById('modalMachineId').value);
    const dateVal = document.getElementById('modalDate').value;
    let counter = document.getElementById('modalCounter').value.trim();
    const employee = document.getElementById('modalEmployee').value;
    const parts = document.getElementById('modalParts').value.trim();
    const notes = document.getElementById('modalNotes').value.trim();
    let tasks = [];
    document.querySelectorAll('.work-check:checked').forEach(cb => tasks.push(cb.value));

    const m = db.machines.find(x => x.id == machineId);
    if (!m) return;

    // Auto-Counter Filling logic (recovers last entered number in history)
    if (!counter || counter === '') {
        const sortedHistory = [...db.history].sort((a, b) => new Date(b.date) - new Date(a.date));
        const prevRecord = sortedHistory.find(h => h.machineId == machineId && h.counter && h.counter.trim() !== '');
        if (prevRecord) {
            counter = prevRecord.counter;
        }
    }

    let isoDate;
    if (!dateVal) {
        isoDate = new Date().toISOString();
    } else {
        try {
            isoDate = new Date(dateVal).toISOString();
        } catch (e) {
            isoDate = new Date().toISOString();
        }
    }

    const newRecord = { 
        id: Date.now(), 
        machineId, 
        machineSerial: m.serial, 
        machineInv: m.inv || '',
        date: isoDate, 
        counter, 
        employee,
        parts,
        tasks, 
        notes 
    };
    db.history.unshift(newRecord);
    
    saveData('history/' + newRecord.id, newRecord);
    closeAllModals();
    showToast('✅ ТО успешно сохранено!');
}

function openEditHistory(id) {
    const h = db.history.find(x => x.id == id);
    if (!h) return;
    
    document.getElementById('editHistId').value = id;
    document.getElementById('editHistDate').value = getLocalDatetimeString(h.date);
    document.getElementById('editHistCounter').value = h.counter || '';
    document.getElementById('editHistNotes').value = h.notes || '';
    document.getElementById('editHistParts').value = h.parts || '';
    
    document.querySelectorAll('.edit-work-check').forEach(cb => {
        cb.checked = h.tasks ? h.tasks.includes(cb.value) : false;
    });
    
    // Populate performing employee dropdown
    populateDropdown('editHistEmployee', db.employees, h.employee || '');
    
    document.getElementById('editHistoryModal').style.display = 'flex';
}

function saveEditHistory() {
    doubleConfirm('СОХРАНИТЬ ИЗМЕНЕНИЯ в записи истории', () => {
        const id = parseInt(document.getElementById('editHistId').value);
        const h = db.history.find(x => x.id == id);
        if (h) {
            const dateVal = document.getElementById('editHistDate').value;
            let isoDate;
            if (!dateVal) {
                isoDate = new Date().toISOString();
            } else {
                try {
                    isoDate = new Date(dateVal).toISOString();
                } catch (e) {
                    isoDate = new Date().toISOString();
                }
            }
            h.date = isoDate;
            h.counter = document.getElementById('editHistCounter').value.trim();
            h.employee = document.getElementById('editHistEmployee').value;
            h.parts = document.getElementById('editHistParts').value.trim();
            h.notes = document.getElementById('editHistNotes').value.trim();
            
            let tasks = [];
            document.querySelectorAll('.edit-work-check:checked').forEach(cb => tasks.push(cb.value));
            h.tasks = tasks;
            
            saveData('history/' + h.id, h);
            closeAllModals();
            showToast('✅ Запись истории обновлена!');
        }
    });
}

function deleteHistory(id) {
    doubleConfirm('УДАЛИТЬ эту запись обслуживания', () => {
        db.history = db.history.filter(x => x.id != id);
        saveData('history/' + id, null);
        showToast('🗑️ Запись истории удалена');
    });
}

// =========================================================================
// DATA POPULATION HELPERS
// =========================================================================
function populateDropdown(inputId, itemsArray, selectedValue = null) {
    const wrapper = document.getElementById('wrapper-' + inputId);
    const hiddenInput = document.getElementById(inputId);
    if (!wrapper || !hiddenInput) return;

    // Use currently selected value from DOM if selectedValue is not specified (is null)
    const currentValue = (selectedValue !== null) ? selectedValue : hiddenInput.value;
    let displayValue = 'Выберите...';
    
    if (currentValue && itemsArray.includes(currentValue)) {
        displayValue = currentValue;
    } else if (itemsArray.length > 0) {
        displayValue = itemsArray[0];
    }

    const resolvedValue = displayValue === 'Выберите...' ? '' : displayValue;

    wrapper.innerHTML = `
        <input type="hidden" id="${inputId}" value="${resolvedValue.replace(/"/g, '&quot;')}">
        <div class="custom-select-trigger" onclick="toggleCustomDropdown(event, '${inputId}')">
            <span id="trigger-text-${inputId}">${displayValue}</span>
            <span class="custom-select-arrow">▼</span>
        </div>
        <div class="custom-select-options" id="options-${inputId}">
            ${itemsArray.map(item => `
                <div class="custom-select-option ${item === resolvedValue ? 'selected' : ''}" 
                     onclick="selectCustomOption('${inputId}', '${item.replace(/'/g, "\\'")}')">
                    ${item}
                </div>
            `).join('')}
        </div>
    `;
}

function populateAddressDropdown(inputId, selectedId = 0) {
    const wrapper = document.getElementById('wrapper-' + inputId);
    const hiddenInput = document.getElementById(inputId);
    if (!wrapper || !hiddenInput) return;

    // If selectedId is 0 or not passed, look at current hidden input value
    const currentId = parseInt(selectedId) || parseInt(hiddenInput.value) || 0;
    let selectedAddr = db.addresses.find(a => a.id == currentId);
    let displayValue = 'Выберите адрес...';
    let resolvedValue = '';
    
    if (selectedAddr) {
        resolvedValue = selectedAddr.id;
        displayValue = `${selectedAddr.bank} - ${selectedAddr.address}`;
    } else if (db.addresses.length > 0) {
        resolvedValue = db.addresses[0].id;
        displayValue = `${db.addresses[0].bank} - ${db.addresses[0].address}`;
    }

    wrapper.innerHTML = `
        <input type="hidden" id="${inputId}" value="${resolvedValue}">
        <div class="custom-select-trigger" onclick="toggleCustomDropdown(event, '${inputId}')">
            <span id="trigger-text-${inputId}">${displayValue}</span>
            <span class="custom-select-arrow">▼</span>
        </div>
        <div class="custom-select-options" id="options-${inputId}">
            ${db.addresses.map(a => `
                <div class="custom-select-option ${a.id == resolvedValue ? 'selected' : ''}" 
                     onclick="selectCustomOption('${inputId}', '${a.id}', '${a.bank.replace(/'/g, "\\'")} - ${a.address.replace(/'/g, "\\'")}')">
                    ${a.bank} - ${a.address}
                </div>
            `).join('')}
        </div>
    `;
}

function toggleCustomDropdown(event, inputId) {
    event.stopPropagation();
    const wrapper = document.getElementById('wrapper-' + inputId);
    const optionsDiv = document.getElementById('options-' + inputId);
    if (!optionsDiv || !wrapper) return;
    
    const isOpen = wrapper.classList.contains('open');
    
    document.querySelectorAll('.custom-select-wrapper').forEach(el => {
        el.classList.remove('open');
    });
    document.querySelectorAll('.custom-select-options').forEach(el => {
        el.classList.remove('open');
    });
    
    if (!isOpen) {
        wrapper.classList.add('open');
        optionsDiv.classList.add('open');
    }
}

function selectCustomOption(inputId, value, label = null) {
    const hiddenInput = document.getElementById(inputId);
    const triggerText = document.getElementById('trigger-text-' + inputId);
    const optionsDiv = document.getElementById('options-' + inputId);
    const wrapper = document.getElementById('wrapper-' + inputId);
    
    if (hiddenInput && triggerText) {
        hiddenInput.value = value;
        triggerText.innerText = label || value;
        
        if (optionsDiv) {
            optionsDiv.querySelectorAll('.custom-select-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            const options = Array.from(optionsDiv.querySelectorAll('.custom-select-option'));
            const matchingOpt = options.find(opt => {
                const clickAttr = opt.getAttribute('onclick') || '';
                return clickAttr.includes(`'${value.replace(/'/g, "\\'")}'`) || clickAttr.includes(`"${value}"`);
            });
            if (matchingOpt) {
                matchingOpt.classList.add('selected');
            }
            optionsDiv.classList.remove('open');
        }
        if (wrapper) {
            wrapper.classList.remove('open');
        }
    }
}

// Global click handler to close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select-wrapper')) {
        document.querySelectorAll('.custom-select-wrapper').forEach(el => {
            el.classList.remove('open');
        });
        document.querySelectorAll('.custom-select-options').forEach(el => {
            el.classList.remove('open');
        });
    }
});

// Expose functions globally
window.toggleCustomDropdown = toggleCustomDropdown;
window.selectCustomOption = selectCustomOption;

// =========================================================================
// RENDER CONTEXT CONTROLLERS
// =========================================================================
function renderAll() {
    // Populate dynamic drop-downs in all forms
    populateDropdown('addrBank', db.banks);
    populateDropdown('addrRoute', db.routes);
    populateDropdown('addrCity', db.cities);
    
    // Check if active tabs need updates
    const activeTab = document.querySelector('.tab-content.active-tab');
    if (!activeTab) return;
    
    const id = activeTab.id;
    if (id === 'tab-dashboard') {
        renderDashboard();
    } else if (id === 'tab-addresses') {
        renderAddresses();
    } else if (id === 'tab-history') {
        renderHistory();
    } else if (id === 'tab-settings') {
        renderSettings();
    }
}

// Render Settings directories tags list
function renderSettings() {
    renderDictContainer('modelListContainer', 'models');
    renderDictContainer('bankListContainer', 'banks');
    renderDictContainer('routeListContainer', 'routes');
    renderDictContainer('employeeListContainer', 'employees');
    renderDictContainer('cityListContainer', 'cities');
}

function renderDictContainer(containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const list = db[type] || [];
    if (list.length === 0) {
        container.innerHTML = '<span style="font-size:13px; color:var(--text-muted)">Справочник пуст</span>';
        return;
    }
    
    container.innerHTML = list.map(item => `
        <div class="dict-tag">
            <span class="dict-tag-text">${item}</span>
            <div class="dict-tag-actions">
                <button class="dict-tag-btn" onclick="editDictItem('${type}', '${item}')" title="Редактировать">✏️</button>
                <button class="dict-tag-btn del" onclick="deleteDictItem('${type}', '${item}')" title="Удалить">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Render Dashboard Check-list
function renderDashboard() {
    const container = document.getElementById('dashboardList');
    if (!container) return;
    
    // Set Month Header text (Russian Months)
    const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    const now = new Date();
    document.getElementById('currentMonthTitle').innerText = `Чек-лист: ${months[now.getMonth()]} ${now.getFullYear()}`;
    
    if (db.addresses.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                <p style="font-size: 15px; margin-bottom: 12px;">База адресов пока пуста.</p>
                <p style="font-size: 13px; color: var(--text-muted)">Перейдите во вкладку <strong>📍 Адреса</strong>, чтобы добавить вашу первую локацию.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    // Group addresses by routes
    db.routes.forEach((route, routeIndex) => {
        const routeAddresses = db.addresses.filter(a => a.route === route);
        if (routeAddresses.length === 0) return;
        
        let totalTarget = 0;
        let totalCompleted = 0;
        let routeHtml = '';
        
        // Find all unique cities in this route
        const routeCities = [...new Set(routeAddresses.map(a => a.city || db.cities[0] || 'Кишинев'))].sort();
        
        routeCities.forEach(city => {
            const cityAddresses = routeAddresses.filter(a => (a.city || db.cities[0] || 'Кишинев') === city);
            
            // Filter addresses that actually have machines
            const activeCityAddresses = cityAddresses.filter(addr => db.machines.some(m => m.addressId == addr.id));
            if (activeCityAddresses.length === 0) return;
            
            let cityTarget = 0;
            let cityCompleted = 0;
            let cityAddressesHtml = '';
            
            activeCityAddresses.forEach(addr => {
                const addrMachines = db.machines.filter(m => m.addressId == addr.id);
                if (addrMachines.length === 0) return;
                
                let addrHtml = '';
                let addrTarget = 0;
                let addrCompleted = 0;
                
                addrMachines.forEach(mach => {
                    // Find all service records for this machine in the current month
                    const thisMonthServices = db.history.filter(h => h.machineId == mach.id && isCurrentMonth(h.date));
                    const completedCount = thisMonthServices.length;
                    
                    // Add to calculations
                    const targetCount = mach.freq;
                    addrTarget += targetCount;
                    addrCompleted += Math.min(completedCount, targetCount);
                    
                    let badgeClass = 'pending';
                    let badgeText = '';
                    
                    if (targetCount === 0) {
                        // Service by request
                        if (completedCount > 0) {
                            badgeClass = 'done';
                            badgeText = `Выполнено (${completedCount})`;
                        } else {
                            badgeClass = 'info';
                            badgeText = 'По запросу';
                        }
                    } else {
                        if (completedCount >= targetCount) {
                            badgeClass = 'done';
                            badgeText = 'Выполнено';
                        } else if (completedCount > 0) {
                            badgeClass = 'pending';
                            badgeText = `В процессе: ${completedCount}/${targetCount}`;
                        } else {
                            // Check if overdue
                            const machineHistory = db.history.filter(h => h.machineId == mach.id);
                            if (machineHistory.length > 0) {
                                const lastService = new Date(machineHistory[0].date);
                                const diffDays = Math.ceil(Math.abs(now - lastService) / (1000 * 60 * 60 * 24));
                                if (diffDays > 35) {
                                    badgeClass = 'overdue';
                                    badgeText = 'Просрочено';
                                } else {
                                    badgeClass = 'pending';
                                    badgeText = 'Ожидает ТО';
                                }
                            } else {
                                badgeClass = 'overdue';
                                badgeText = 'Требует ТО';
                            }
                        }
                    }
                    
                    addrHtml += `
                        <div class="list-item clickable" onclick="openServiceModal(${mach.id})" data-machine-text="${mach.model.toLowerCase()} ${mach.serial.toLowerCase()} ${mach.inv ? mach.inv.toLowerCase() : ''}${mach.employee ? ' ' + mach.employee.toLowerCase() : ''}">
                            <div class="list-item-main">
                                <span class="list-item-title">${mach.model}</span>
                                <span class="list-item-subtitle">S/N: ${mach.serial} ${mach.inv ? ' | Inv: ' + mach.inv : ''}${mach.employee ? ' | Отв: ' + mach.employee : ''}</span>
                            </div>
                            <span class="badge ${badgeClass}">${badgeText}</span>
                        </div>
                    `;
                });
                
                // Calculate address badge status
                let addrBadgeClass = 'pending';
                let addrBadgeText = '';
                if (addrTarget === 0) {
                    if (addrCompleted > 0) {
                        addrBadgeClass = 'done';
                        addrBadgeText = `Сделано: ${addrCompleted}`;
                    } else {
                        addrBadgeClass = 'info';
                        addrBadgeText = 'По запросу';
                    }
                } else {
                    addrBadgeText = `${addrCompleted}/${addrTarget}`;
                    if (addrCompleted >= addrTarget) {
                        addrBadgeClass = 'done';
                    } else {
                        addrBadgeClass = 'pending';
                    }
                }
                
                cityTarget += addrTarget;
                cityCompleted += addrCompleted;
                
                totalTarget += addrTarget;
                totalCompleted += addrCompleted;
                
                cityAddressesHtml += `
                    <details class="dash-address" data-address-text="${addr.bank.toLowerCase()} ${addr.address.toLowerCase()}">
                        <summary>
                            <span>📍 ${addr.bank}, ${addr.address}</span>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="badge ${addrBadgeClass}">${addrBadgeText}</span>
                                <span class="details-indicator">▼</span>
                            </div>
                        </summary>
                        <div class="details-content dash-address-content">
                            <button class="btn-outline" style="width:100%; margin-bottom:8px; font-size:12px; padding:6px 12px;" onclick="openMapInKodular('${addr.bank}, ${addr.address}')">🗺️ Показать на карте</button>
                            <div class="form-group" style="margin-bottom: 10px;">
                                <input type="text" placeholder="🔍 Поиск по адресу (модель, S/N)..." class="address-search-input" oninput="applyAddressSearch(this)" style="margin-bottom: 0; padding: 8px 10px; font-size: 13px;">
                            </div>
                            <div class="address-machines-list">
                                ${addrHtml}
                            </div>
                        </div>
                    </details>
                `;
            });
            
            // Calculate City badge status
            let cityBadgeClass = 'pending';
            let cityBadgeText = '';
            if (cityTarget === 0) {
                if (cityCompleted > 0) {
                    cityBadgeClass = 'done';
                    cityBadgeText = `Сделано: ${cityCompleted}`;
                } else {
                    cityBadgeClass = 'info';
                    cityBadgeText = 'По запросу';
                }
            } else {
                cityBadgeText = `${cityCompleted}/${cityTarget}`;
                if (cityCompleted >= cityTarget) {
                    cityBadgeClass = 'done';
                } else {
                    cityBadgeClass = 'pending';
                }
            }
            
            routeHtml += `
                <details class="dash-city" open>
                    <summary>
                        <span>🏙️ ${city}</span>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span class="badge ${cityBadgeClass}">${cityBadgeText}</span>
                            <span class="details-indicator">▼</span>
                        </div>
                    </summary>
                    <div class="details-content dash-city-content">
                        ${cityAddressesHtml}
                    </div>
                </details>
            `;
        });
        
        // Compute progress bar percentage
        const percent = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : (totalCompleted > 0 ? 100 : 0);
        
        html += `
            <details class="dash-route">
                <summary>
                    <div style="flex:1; display:flex; flex-direction:column; gap:4px; padding-right:12px;">
                        <span>🚗 ${route}</span>
                        <div class="progress-bar-container">
                            <div class="progress-info">
                                <span>Прогресс: ${percent}%</span>
                                <span>${totalCompleted}/${totalTarget} ТО</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: ${percent}%;"></div>
                            </div>
                        </div>
                    </div>
                    <span class="details-indicator">▼</span>
                </summary>
                <div class="details-content">
                    <div class="form-group" style="margin-bottom: 12px;">
                        <input type="text" placeholder="🔍 Поиск по маршруту (модель, S/N, адрес)..." class="route-search-input" oninput="applyRouteSearch(this)" style="margin-bottom: 0; padding: 8px 12px; font-size: 14px;">
                    </div>
                    ${routeHtml}
                </div>
            </details>
        `;
    });
    
    container.innerHTML = html;
}

// Render Database of addresses and machines
function renderAddresses() {
    const container = document.getElementById('addressList');
    if (!container) return;
    
    if (db.addresses.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 20px 0; color:var(--text-muted)">Список адресов пуст.</p>';
        return;
    }

    // 1. Group addresses by city and then by bank
    const cityGroups = {};
    db.addresses.forEach(a => {
        const city = a.city || db.cities[0] || 'Кишинев';
        const bank = a.bank || 'Другие';
        if (!cityGroups[city]) {
            cityGroups[city] = {};
        }
        if (!cityGroups[city][bank]) {
            cityGroups[city][bank] = [];
        }
        cityGroups[city][bank].push(a);
    });

    // 2. Render the hierarchy
    let html = '';
    const sortedCities = Object.keys(cityGroups).sort();

    sortedCities.forEach(city => {
        const banksInCity = cityGroups[city];
        const sortedBanks = Object.keys(banksInCity).sort();
        let banksHtml = '';

        sortedBanks.forEach(bank => {
            const addresses = banksInCity[bank];
            let addressesHtml = '';

            addresses.forEach(a => {
                const addrMachines = db.machines.filter(m => m.addressId == a.id);
                let machHtml = '';

                if (addrMachines.length === 0) {
                    machHtml = '<p style="font-size:11px; color:var(--text-muted); text-align:center; margin:8px 0;">Оборудование отсутствует.</p>';
                } else {
                    machHtml = addrMachines.map(m => `
                        <div class="machine-pill" onclick="openMachineDetails(${m.id})" data-machine-text="${m.model.toLowerCase()} ${m.serial.toLowerCase()} ${m.inv ? m.inv.toLowerCase() : ''}${m.employee ? ' ' + m.employee.toLowerCase() : ''}">
                            <div class="machine-pill-info">
                                <span class="machine-model">${m.model}</span>
                                <span class="machine-sn">S/N: ${m.serial} ${m.inv ? ' | Inv: ' + m.inv : ''}${m.employee ? ' | Отв: ' + m.employee : ''}</span>
                            </div>
                            <span class="badge info" style="padding: 2px 8px; font-size:10px;">${m.freq} ТО/мес</span>
                        </div>
                    `).join('');
                }

                addressesHtml += `
                    <div class="card address-card" data-address-text="${a.bank.toLowerCase()} ${a.address.toLowerCase()} ${a.route.toLowerCase()} ${(a.city || '').toLowerCase()}" style="margin-bottom: 8px;">
                        <details class="address-card-details">
                            <summary class="address-card-summary">
                                <div class="address-card-header-wrapper" style="flex: 1; display: flex; justify-content: space-between; align-items: flex-start;">
                                    <div>
                                        <div class="address-title" style="font-size: 14px; font-weight: 600; color: var(--text-primary);">📍 ${a.address}</div>
                                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Маршрут: ${a.route}</div>
                                    </div>
                                    <div class="actions" style="display: flex; gap: 8px; align-items: center; padding-right: 4px;">
                                        <button class="btn-outline" style="padding:4px 8px;" onclick="event.stopPropagation(); openEditAddress(${a.id})" title="Редактировать адрес">✏️</button>
                                        <button class="btn-danger" style="padding:4px 8px;" onclick="event.stopPropagation(); deleteAddress(${a.id})" title="Удалить адрес">🗑️</button>
                                        <span class="details-indicator" style="margin-left: 8px;">▼</span>
                                    </div>
                                </div>
                            </summary>
                            
                            <div class="machines-group" style="margin-top: 8px; padding: 8px; background: #fafafa;">
                                <div class="machines-group-title" style="font-size: 11px; margin-bottom: 6px;">Оборудование на точке</div>
                                <div class="form-group" style="margin-bottom: 8px;">
                                    <input type="text" placeholder="🔍 Поиск оборудования (модель, S/N)..." class="address-card-machine-search" oninput="filterAddressCardMachines(this)" style="margin-bottom: 0; padding: 6px 10px; font-size: 12px; height: auto;">
                                </div>
                                <div class="machines-card-list">
                                    ${machHtml}
                                </div>
                                <button class="btn-primary" style="padding: 6px; font-size:11px; margin-top:8px; width:100%;" onclick="openAddMachineModal(${a.id})">+ Добавить машину</button>
                            </div>
                        </details>
                    </div>
                `;
            });

            banksHtml += `
                <details class="addr-bank-collapsible">
                    <summary>
                        <span>🏦 ${bank}</span>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span class="badge info" style="padding: 2px 8px; font-size:10px;">${addresses.length}</span>
                            <span class="details-indicator">▼</span>
                        </div>
                    </summary>
                    <div class="details-content" style="padding: 8px; background: #fff;">
                        ${addressesHtml}
                    </div>
                </details>
            `;
        });

        html += `
            <details class="addr-city-collapsible">
                <summary>
                    <span>🏙️ ${city}</span>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="badge info" style="background-color: #00838f; color: #fff; padding: 2px 8px; font-size:10px;">${Object.values(banksInCity).reduce((sum, arr) => sum + arr.length, 0)}</span>
                        <span class="details-indicator">▼</span>
                    </div>
                </summary>
                <div class="details-content" style="padding: 10px 12px; background: #fff;">
                    ${banksHtml}
                </div>
            </details>
        `;
    });

    container.innerHTML = html;

    // Apply search filter if there is active text in search input
    const searchInput = document.getElementById('addressTabSearch');
    if (searchInput && searchInput.value.trim() !== '') {
        filterAddressTab(searchInput);
    }
}

// Render History
function renderHistory() {
    const container = document.getElementById('historyList');
    const searchVal = document.getElementById('historySearch').value.toLowerCase().trim();
    if (!container) return;
    
    let filtered = db.history;
    
    // Search filter logic
    if (searchVal) {
        filtered = db.history.filter(h => {
            const m = db.machines.find(x => x.id === h.machineId);
            const a = m ? db.addresses.find(x => x.id === m.addressId) : null;
            
            const model = m ? m.model.toLowerCase() : '';
            const serial = h.machineSerial ? h.machineSerial.toLowerCase() : (m ? m.serial.toLowerCase() : '');
            const bank = a ? a.bank.toLowerCase() : '';
            const addrText = a ? a.address.toLowerCase() : '';
            const notes = h.notes ? h.notes.toLowerCase() : '';
            const taskStr = h.tasks ? h.tasks.join(' ').toLowerCase() : '';
            const employee = h.employee ? h.employee.toLowerCase() : '';
            const parts = h.parts ? h.parts.toLowerCase() : '';
            
            return model.includes(searchVal) || 
                   serial.includes(searchVal) || 
                   bank.includes(searchVal) || 
                   addrText.includes(searchVal) || 
                   notes.includes(searchVal) ||
                   taskStr.includes(searchVal) ||
                   employee.includes(searchVal) ||
                   parts.includes(searchVal);
        });
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 20px 0; color:var(--text-muted)">История обслуживания пуста.</p>';
        return;
    }
    
    // Sort chronological descending
    const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let currentDayStr = '';
    let html = '';
    
    sorted.forEach(h => {
        const dateObj = new Date(h.date);
        
        // Format Day string (Russian)
        const days = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
        const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
        const dayStr = `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
        
        if (dayStr !== currentDayStr) {
            currentDayStr = dayStr;
            html += `<div class="day-header">${currentDayStr}</div>`;
        }
        
        const m = db.machines.find(x => x.id == h.machineId);
        const a = m ? db.addresses.find(x => x.id == m.addressId) : null;
        const timeStr = dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        
        const serial = h.machineSerial || (m ? m.serial : 'Неизвестно');
        const inv = h.machineInv || (m ? m.inv : '');
        const model = m ? m.model : 'Удаленная модель';
        const clientText = a ? `${a.bank}, ${a.address}` : 'Адрес удален';
        
        let tasksHtml = '';
        if (h.tasks && h.tasks.length > 0) {
            tasksHtml = `
                <div class="timeline-tasks">
                    ${h.tasks.map(t => `<span class="task-tag">${t}</span>`).join('')}
                </div>
            `;
        }
        
        html += `
            <div class="timeline-item">
                <div class="timeline-header">
                    <div class="timeline-title">${model}</div>
                    <div class="timeline-time">${timeStr}</div>
                </div>
                
                <div class="timeline-body">
                    <div class="timeline-meta-row">
                        <div class="timeline-meta-item">S/N: <strong>${serial}</strong>${inv ? ` | Inv: <strong>${inv}</strong>` : ''}</div>
                        ${h.counter ? `<div class="timeline-meta-item">Счетчик: <strong>${h.counter}</strong></div>` : ''}
                    </div>
                    <div style="font-size:12px; color:var(--text-secondary); margin-bottom: 4px;">📍 ${clientText}</div>
                    ${h.employee ? `<div style="font-size:12px; color:var(--text-secondary); margin-bottom: 4px;">👤 Исполнитель: <strong>${h.employee}</strong></div>` : ''}
                    
                    ${tasksHtml}
                    ${h.notes ? `<div class="timeline-notes">${h.notes}</div>` : ''}
                    ${h.parts ? `<div class="timeline-notes" style="border-left-color: var(--primary-color);">🛠️ Использованные запчасти:<br>${h.parts}</div>` : ''}
                </div>
                
                <div class="actions" style="margin-top: 12px; display:flex; justify-content:flex-end;">
                    <button class="btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="openEditHistory(${h.id})">✏️</button>
                    <button class="btn-danger" style="padding: 4px 8px; font-size: 11px;" onclick="deleteHistory(${h.id})">🗑️</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// =========================================================================
// SEARCH & FILTER FUNCTIONALITY FOR DASHBOARD (CHECK-LIST)
// =========================================================================
function applyRouteSearch(routeInput) {
    const routeVal = routeInput.value.toLowerCase().trim();
    const routeDetails = routeInput.closest('.details-content');
    if (!routeDetails) return;
    
    const addresses = routeDetails.querySelectorAll('.dash-address');
    
    addresses.forEach(addrEl => {
        const addrText = addrEl.getAttribute('data-address-text') || '';
        const addrInput = addrEl.querySelector('.address-search-input');
        const addrVal = addrInput ? addrInput.value.toLowerCase().trim() : '';
        
        const machineItems = addrEl.querySelectorAll('.address-machines-list .list-item');
        let visibleMachinesCount = 0;
        
        machineItems.forEach(item => {
            const machText = item.getAttribute('data-machine-text') || '';
            
            // Check matches: route input matches address or machine; and address input matches machine
            const routeMatches = routeVal === '' || addrText.includes(routeVal) || machText.includes(routeVal);
            const addrMatches = addrVal === '' || machText.includes(addrVal);
            
            if (routeMatches && addrMatches) {
                item.style.display = 'flex';
                visibleMachinesCount++;
            } else {
                item.style.display = 'none';
            }
        });
        
        // Hide the entire address card if no machines match
        if (visibleMachinesCount > 0) {
            addrEl.style.display = 'block';
        } else {
            addrEl.style.display = 'none';
        }
    });

    // Hide/show city collapsibles based on visible addresses
    const cities = routeDetails.querySelectorAll('.dash-city');
    cities.forEach(cityEl => {
        const cityAddresses = cityEl.querySelectorAll('.dash-address');
        const visibleAddresses = Array.from(cityAddresses).filter(a => a.style.display !== 'none');
        cityEl.style.display = visibleAddresses.length > 0 ? 'block' : 'none';
    });
}

function applyAddressSearch(addrInput) {
    const addrVal = addrInput.value.toLowerCase().trim();
    const addrEl = addrInput.closest('.dash-address');
    if (!addrEl) return;
    
    const routeDetails = addrEl.closest('.details-content');
    const routeInput = routeDetails ? routeDetails.querySelector('.route-search-input') : null;
    const routeVal = routeInput ? routeInput.value.toLowerCase().trim() : '';
    
    const addrText = addrEl.getAttribute('data-address-text') || '';
    const machineItems = addrEl.querySelectorAll('.address-machines-list .list-item');
    let visibleMachinesCount = 0;
    
    machineItems.forEach(item => {
        const machText = item.getAttribute('data-machine-text') || '';
        
        // Check matches
        const routeMatches = routeVal === '' || addrText.includes(routeVal) || machText.includes(routeVal);
        const addrMatches = addrVal === '' || machText.includes(addrVal);
        
        if (routeMatches && addrMatches) {
            item.style.display = 'flex';
            visibleMachinesCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Hide the entire address card if no machines match
    if (visibleMachinesCount > 0) {
        addrEl.style.display = 'block';
    } else {
        addrEl.style.display = 'none';
    }

    // Hide/show city collapsible based on sibling address visibilities
    const cityEl = addrEl.closest('.dash-city');
    if (cityEl) {
        const cityAddresses = cityEl.querySelectorAll('.dash-address');
        const visibleAddresses = Array.from(cityAddresses).filter(a => a.style.display !== 'none');
        cityEl.style.display = visibleAddresses.length > 0 ? 'block' : 'none';
    }
}

function filterAddressTab(inputEl) {
    const val = inputEl.value.toLowerCase().trim();
    
    // Get all city collapsibles
    const cities = document.querySelectorAll('#addressList .addr-city-collapsible');
    
    cities.forEach(city => {
        let cityHasVisibleBank = false;
        const banks = city.querySelectorAll('.addr-bank-collapsible');
        
        banks.forEach(bank => {
            let bankHasVisibleAddress = false;
            const cards = bank.querySelectorAll('.address-card');
            
            cards.forEach(card => {
                const addrText = card.getAttribute('data-address-text') || '';
                const details = card.querySelector('.address-card-details');
                const machines = card.querySelectorAll('.machine-pill');
                
                let cardHasMatch = addrText.includes(val);
                let matchingMachinesCount = 0;
                
                machines.forEach(mach => {
                    const machText = mach.getAttribute('data-machine-text') || '';
                    const machMatches = machText.includes(val);
                    
                    if (val === '' || machMatches || addrText.includes(val)) {
                        mach.style.display = 'flex';
                        if (val !== '' && machMatches) {
                            matchingMachinesCount++;
                        }
                    } else {
                        mach.style.display = 'none';
                    }
                });
                
                // Show the card if the card address info matches OR if at least one machine matches
                if (val === '' || cardHasMatch || matchingMachinesCount > 0) {
                    card.style.display = 'block';
                    bankHasVisibleAddress = true;
                    
                    // If we are searching and there is a match in this card, open the card details
                    if (val !== '') {
                        if (details) {
                            details.setAttribute('open', '');
                        }
                    } else {
                        // Clear search - close all address details
                        if (details) {
                            details.removeAttribute('open');
                        }
                    }
                } else {
                    card.style.display = 'none';
                    if (details) {
                        details.removeAttribute('open');
                    }
                }
            });
            
            if (val === '' || bankHasVisibleAddress) {
                bank.style.display = 'block';
                cityHasVisibleBank = true;
                if (val !== '') {
                    bank.setAttribute('open', '');
                } else {
                    bank.removeAttribute('open');
                }
            } else {
                bank.style.display = 'none';
                bank.removeAttribute('open');
            }
        });
        
        if (val === '' || cityHasVisibleBank) {
            city.style.display = 'block';
            if (val !== '') {
                city.setAttribute('open', '');
            } else {
                city.removeAttribute('open');
            }
        } else {
            city.style.display = 'none';
            city.removeAttribute('open');
        }
    });
}

function filterAddressCardMachines(inputEl) {
    const val = inputEl.value.toLowerCase().trim();
    const machinesGroup = inputEl.closest('.machines-group');
    if (!machinesGroup) return;
    
    const machines = machinesGroup.querySelectorAll('.machine-pill');
    machines.forEach(mach => {
        const machText = mach.getAttribute('data-machine-text') || '';
        if (val === '' || machText.includes(val)) {
            mach.style.display = 'flex';
        } else {
            mach.style.display = 'none';
        }
    });
}

// Expose functions globally for HTML inline handlers
window.applyRouteSearch = applyRouteSearch;
window.applyAddressSearch = applyAddressSearch;
window.filterAddressTab = filterAddressTab;
window.filterAddressCardMachines = filterAddressCardMachines;

// =========================================================================
// BARCODE & QR CODE SCANNER CONTROLLER
// =========================================================================
let html5QrCode = null;
let scannerTargetInputId = null;
let scannerSuccessCallback = null;

async function startScanner(targetInputId, onScanSuccessCallback = null) {
    scannerTargetInputId = targetInputId;
    scannerSuccessCallback = onScanSuccessCallback;

    document.getElementById('scannerModal').style.display = 'flex';
    const cameraSelect = document.getElementById('scannerCameraSelect');
    cameraSelect.innerHTML = '<option value="">Загрузка камер...</option>';

    try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
            cameraSelect.innerHTML = devices.map((device, idx) => {
                const label = device.label || `Камера ${idx + 1}`;
                const isBack = label.toLowerCase().includes('back') || label.toLowerCase().includes('задняя') || label.toLowerCase().includes('environment');
                return `<option value="${device.id}" ${isBack ? 'selected' : ''}>${label}</option>`;
            }).join('');

            html5QrCode = new Html5Qrcode("reader");
            const cameraId = cameraSelect.value || devices[0].id;
            await startCameraStream(cameraId);
        } else {
            showToast('⚠️ Камеры не найдены на устройстве');
            stopScanner();
        }
    } catch (err) {
        console.error("Camera access failed:", err);
        showToast('❌ Нет доступа к камере: ' + err.message);
        stopScanner();
    }
}

async function startCameraStream(cameraId) {
    if (!html5QrCode) return;

    try {
        await html5QrCode.start(
            cameraId,
            {
                fps: 10,
                qrbox: { width: 250, height: 150 }
            },
            onScanSuccess,
            onScanFailure
        );
    } catch (err) {
        showToast('❌ Ошибка запуска трансляции: ' + err.message);
    }
}

async function switchCamera(cameraId) {
    if (html5QrCode) {
        try {
            await html5QrCode.stop();
            await startCameraStream(cameraId);
        } catch (err) {
            console.error("Failed to switch camera:", err);
        }
    }
}

function onScanSuccess(decodedText, decodedResult) {
    if (navigator.vibrate) {
        navigator.vibrate(100);
    } else if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
        window.Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' }).catch(() => {});
    }

    showToast('✅ Код успешно отсканирован!');
    
    const targetInput = document.getElementById(scannerTargetInputId);
    if (targetInput) {
        targetInput.value = decodedText;
        targetInput.dispatchEvent(new Event('input', { bubbles: true }));
        targetInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (scannerSuccessCallback) {
        try {
            scannerSuccessCallback(decodedText);
        } catch (e) {
            console.error(e);
        }
    }

    stopScanner();
}

function onScanFailure(error) {
    // Quietly ignore scan failures as they occur on every frame
}

async function stopScanner() {
    document.getElementById('scannerModal').style.display = 'none';
    
    if (html5QrCode) {
        try {
            await html5QrCode.stop();
        } catch (err) {
            // Ignore stop errors if not active
        } finally {
            html5QrCode = null;
        }
    }
    
    scannerTargetInputId = null;
    scannerSuccessCallback = null;
}

// Expose scanner functions globally
window.startScanner = startScanner;
window.stopScanner = stopScanner;
window.switchCamera = switchCamera;



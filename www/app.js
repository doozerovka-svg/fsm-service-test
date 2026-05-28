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
    const savedTheme = localStorage.getItem('fsm_theme') || 'light';
    toggleDarkTheme(savedTheme === 'dark');
    checkUserRole();
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
    
    populateDropdown('addMachEmployee', db.employees, '');
    
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
    renderMachineHistory(m.id, 'detMachHistoryList');
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
            <div class="actions admin-only">
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
    document.getElementById('modalNotes').placeholder = "Что нужно заменить?";
    
    document.getElementById('modalDate').value = getLocalDatetimeString(new Date());
    document.getElementById('modalCounter').value = '';
    document.getElementById('modalNotes').value = '';
    document.getElementById('modalParts').value = '';
    document.querySelectorAll('.work-check').forEach(cb => cb.checked = false);
    
    // Populate performer dropdown and preselect machine's responsible employee
    populateDropdown('modalEmployee', db.employees, m.employee || '');
    
    // Load past repairs history inside service modal
    renderMachineHistory(m.id, 'prevServiceHistoryList');
    const prevHistoryContainer = document.getElementById('prevServiceHistoryContainer');
    if (prevHistoryContainer) prevHistoryContainer.style.display = 'none';
    const btnToggle = document.getElementById('btnTogglePrevService');
    if (btnToggle) btnToggle.innerText = '📜 Прошлые ремонты оборудования';
    
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
    triggerHapticFeedback();
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

function toggleHistoryChecked(id, isChecked) {
    const h = db.history.find(x => x.id == id);
    if (h) {
        h.checked = isChecked;
        saveData();
        showToast(isChecked ? '✅ Отметка установлена' : 'ℹ️ Отметка снята');
        triggerHapticFeedback();
    }
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
        
        // Default Employee selection hook removed
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
    
    // Default performer dropdown removed
    
    // Check dark mode toggle state
    const themeToggle = document.getElementById('darkThemeToggle');
    if (themeToggle) {
        themeToggle.checked = localStorage.getItem('fsm_theme') === 'dark';
    }
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
            <div class="dict-tag-actions admin-only">
                <button class="dict-tag-btn" onclick="editDictItem('${type}', '${item}')" title="Редактировать">✏️</button>
                <button class="dict-tag-btn del" onclick="deleteDictItem('${type}', '${item}')" title="Удалить">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Render Dashboard Check-list
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
    
    // Save open state before re-rendering
    const openRoutes = Array.from(document.querySelectorAll('#dashboardList .dash-route[open]')).map(el => el.getAttribute('data-route-id') || '');
    const openCities = Array.from(document.querySelectorAll('#dashboardList .dash-city[open]')).map(el => el.getAttribute('data-city-id') || '');
    const openAddresses = Array.from(document.querySelectorAll('#dashboardList .dash-address[open]')).map(el => el.getAttribute('data-address-id') || '');
    const isFirstLoad = document.querySelectorAll('#dashboardList .dash-route').length === 0;
    
    const searchInput = document.getElementById('dashboardSearch');
    const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    let html = '';
    const onlyPendingToggle = document.getElementById('onlyPendingToggle');
    const isOnlyPending = onlyPendingToggle && onlyPendingToggle.checked;
    
    // Group addresses by routes
    db.routes.forEach((route, routeIndex) => {
        const routeAddresses = db.addresses.filter(a => a.route === route);
        if (routeAddresses.length === 0) return;
        
        let totalTargetH1 = 0;
        let totalCompletedH1 = 0;
        let totalTargetH2 = 0;
        let totalCompletedH2 = 0;
        let routeHtml = '';
        
        // Find all unique cities in this route
        const routeCities = [...new Set(routeAddresses.map(a => a.city || db.cities[0] || 'Кишинев'))].sort();
        
        routeCities.forEach(city => {
            const cityAddresses = routeAddresses.filter(a => (a.city || db.cities[0] || 'Кишинев') === city);
            
            // Filter addresses that actually have machines
            const activeCityAddresses = cityAddresses.filter(addr => db.machines.some(m => m.addressId == addr.id));
            if (activeCityAddresses.length === 0) return;
            
            let cityTargetH1 = 0;
            let cityCompletedH1 = 0;
            let cityTargetH2 = 0;
            let cityCompletedH2 = 0;
            let cityAddressesHtml = '';
            
            activeCityAddresses.forEach(addr => {
                let addrMachines = db.machines.filter(m => m.addressId == addr.id);
                if (addrMachines.length === 0) return;
                
                let filteredMachs = [];
                let addrTargetH1 = 0;
                let addrCompletedH1 = 0;
                let addrTargetH2 = 0;
                let addrCompletedH2 = 0;
                
                addrMachines.forEach(mach => {
                    const thisMonthServices = db.history.filter(h => h.machineId == mach.id && isCurrentMonth(h.date));
                    const completedH1 = thisMonthServices.filter(h => new Date(h.date).getDate() <= 15).length;
                    const completedH2 = thisMonthServices.filter(h => new Date(h.date).getDate() > 15).length;
                    
                    const F = mach.freq;
                    let targetH1 = 0;
                    let targetH2 = 0;
                    
                    if (F > 0) {
                        const baseTarget = Math.floor(F / 2);
                        const rem = F % 2;
                        if (rem === 0) {
                            targetH1 = baseTarget;
                            targetH2 = baseTarget;
                        } else {
                            const excessH1 = Math.max(0, completedH1 - baseTarget);
                            const excessH2 = Math.max(0, completedH2 - baseTarget);
                            if (excessH1 >= 1) {
                                targetH1 = baseTarget + 1;
                                targetH2 = baseTarget;
                            } else if (excessH2 >= 1) {
                                targetH1 = baseTarget;
                                targetH2 = baseTarget + 1;
                            } else {
                                if (now.getDate() <= 15) {
                                    targetH1 = baseTarget + 1;
                                    targetH2 = baseTarget;
                                } else {
                                    targetH1 = baseTarget;
                                    targetH2 = baseTarget + 1;
                                }
                            }
                        }
                    }
                    
                    const compH1 = Math.min(completedH1, targetH1);
                    const compH2 = Math.min(completedH2, targetH2);
                    
                    // Check if machine is pending for current phase
                    let isPending = true;
                    if (now.getDate() <= 15) {
                        if (targetH1 > 0) isPending = completedH1 < targetH1;
                        else isPending = (completedH1 + completedH2) === 0;
                    } else {
                        if (targetH2 > 0) isPending = completedH2 < targetH2;
                        else isPending = (completedH1 + completedH2) === 0;
                    }
                    
                    if (isOnlyPending && !isPending) {
                        return; // Skip this machine
                    }
                    
                    addrTargetH1 += targetH1;
                    addrCompletedH1 += compH1;
                    addrTargetH2 += targetH2;
                    addrCompletedH2 += compH2;
                    
                    // Generate status dots
                    let dotsHtml = '<div class="status-dots">';
                    
                    if (targetH1 > 0) {
                        let dotClass = 'blue';
                        let tooltip = 'I половина: Ожидает';
                        if (completedH1 >= targetH1) {
                            dotClass = 'green';
                            tooltip = 'I половина: Выполнено';
                        } else if (completedH1 > 0) {
                            dotClass = 'blue';
                            tooltip = `I половина: Выполнено ${completedH1}/${targetH1}`;
                        } else if (now.getDate() > 15) {
                            dotClass = 'red';
                            tooltip = 'I половина: Просрочено';
                        }
                        dotsHtml += `<span class="status-dot ${dotClass}" data-tooltip="${tooltip}"></span>`;
                    } else {
                        dotsHtml += `<span class="status-dot grey" data-tooltip="I половина: ТО не требуется"></span>`;
                    }
                    
                    if (targetH2 > 0) {
                        let dotClass = 'blue';
                        let tooltip = 'II половина: Ожидает';
                        if (completedH2 >= targetH2) {
                            dotClass = 'green';
                            tooltip = 'II половина: Выполнено';
                        } else if (completedH2 > 0) {
                            dotClass = 'blue';
                            tooltip = `II половина: Выполнено ${completedH2}/${targetH2}`;
                        }
                        dotsHtml += `<span class="status-dot ${dotClass}" data-tooltip="${tooltip}"></span>`;
                    } else {
                        dotsHtml += `<span class="status-dot grey" data-tooltip="II половина: ТО не требуется"></span>`;
                    }
                    
                    if (targetH1 === 0 && targetH2 === 0) {
                        const totalCount = completedH1 + completedH2;
                        const dotClass = totalCount > 0 ? 'green' : 'grey';
                        const tooltip = totalCount > 0 ? `По запросу (Выполнено: ${totalCount})` : 'По запросу (Ожидает)';
                        dotsHtml = `<div class="status-dots"><span class="status-dot ${dotClass}" data-tooltip="${tooltip}"></span>`;
                    }
                    
                    dotsHtml += '</div>';
                    
                    filteredMachs.push({
                        mach,
                        dotsHtml
                    });
                });
                
                if (filteredMachs.length === 0) return;
                
                let addrHtml = '';
                filteredMachs.forEach(({ mach, dotsHtml }) => {
                    addrHtml += `
                        <div class="list-item clickable" onclick="openServiceModal(${mach.id})" data-machine-text="${mach.model.toLowerCase()} ${mach.serial.toLowerCase()} ${mach.inv ? mach.inv.toLowerCase() : ''}${mach.employee ? ' ' + mach.employee.toLowerCase() : ''}">
                            <div class="list-item-main">
                                <span class="list-item-title">${mach.model}</span>
                                <span class="list-item-subtitle">S/N: ${mach.serial} ${mach.inv ? ' | Inv: ' + mach.inv : ''}${mach.employee ? ' | Отв: ' + mach.employee : ''}</span>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                ${dotsHtml}
                                <button class="btn-outline square-btn tooltip" onclick="event.stopPropagation(); openProblemModal(${mach.id})" title="Зафиксировать поломку/ремонт" style="padding: 4px 6px; min-height: 24px; min-width: 24px; font-size: 11px; margin: 0; border-radius: 4px; border-color: var(--danger-color); color: var(--danger-color);">⚠️</button>
                            </div>
                        </div>
                    `;
                });
                
                // Calculate progress text
                let addrProgressText = '';
                if (addrTargetH1 > 0 || addrTargetH2 > 0) {
                    const parts = [];
                    if (addrTargetH1 > 0) parts.push(`I: ${addrCompletedH1}/${addrTargetH1}`);
                    if (addrTargetH2 > 0) parts.push(`II: ${addrCompletedH2}/${addrTargetH2}`);
                    addrProgressText = parts.join(' · ');
                } else {
                    const actualComp = db.machines.filter(m => m.addressId == addr.id)
                                          .reduce((sum, m) => sum + db.history.filter(h => h.machineId == m.id && isCurrentMonth(h.date)).length, 0);
                    addrProgressText = actualComp > 0 ? `Выполнено: ${actualComp}` : 'По запросу';
                }
                
                cityTargetH1 += addrTargetH1;
                cityCompletedH1 += addrCompletedH1;
                cityTargetH2 += addrTargetH2;
                cityCompletedH2 += addrCompletedH2;
                
                totalTargetH1 += addrTargetH1;
                totalCompletedH1 += addrCompletedH1;
                totalTargetH2 += addrTargetH2;
                totalCompletedH2 += addrCompletedH2;
                
                const addrStatus = calculateAggregateStatus(addrMachines);
                const addrDots = getStatusDotsHtmlForAggregated(addrStatus);
                const isAddrOpen = openAddresses.includes(String(addr.id)) || (searchVal !== '') ? 'open' : '';
                
                cityAddressesHtml += `
                    <details class="dash-address" ${isAddrOpen} data-address-id="${addr.id}" data-address-text="${addr.bank.toLowerCase()} ${addr.address.toLowerCase()}">
                        <summary style="display: flex; align-items: center; justify-content: space-between;">
                            <span>📍 ${addr.bank}, ${addr.address}</span>
                            <div style="display:flex; align-items:center; gap:8px; margin-left: auto;">
                                ${addrDots}
                                <span style="font-size: 11px; color: var(--text-muted); font-weight: 500; margin-right: 4px;">${addrProgressText}</span>
                                <span class="details-indicator">▼</span>
                            </div>
                        </summary>
                        <div class="details-content dash-address-content">
                            <button class="btn-outline" style="width:100%; margin-bottom:8px; font-size:12px; padding:6px 12px;" onclick="openMapInKodular('${addr.address.replace(/'/g, "\\'")}')">🗺️ Проложить маршрут</button>
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
            
            // Calculate City progress text inline
            let cityProgressText = '';
            if (cityTargetH1 > 0 || cityTargetH2 > 0) {
                const parts = [];
                if (cityTargetH1 > 0) parts.push(`I: ${cityCompletedH1}/${cityTargetH1}`);
                if (cityTargetH2 > 0) parts.push(`II: ${cityCompletedH2}/${cityTargetH2}`);
                cityProgressText = parts.join(' · ');
            } else {
                const actualComp = cityAddresses.reduce((sum, addr) => {
                    return sum + db.machines.filter(m => m.addressId == addr.id)
                                  .reduce((sum2, m) => sum2 + db.history.filter(h => h.machineId == m.id && isCurrentMonth(h.date)).length, 0);
                }, 0);
                cityProgressText = actualComp > 0 ? `Выполнено: ${actualComp}` : 'По запросу';
            }
            
            const cityMachines = db.machines.filter(m => {
                const a = db.addresses.find(addr => addr.id == m.addressId);
                return a && a.route === route && (a.city || 'Кишинев') === city;
            });
            const cityStatus = calculateAggregateStatus(cityMachines);
            const cityDots = getStatusDotsHtmlForAggregated(cityStatus);
            
            const isCityOpen = isFirstLoad || openCities.includes(route + '::' + city) || (searchVal !== '') ? 'open' : '';
            
            if (cityAddressesHtml !== '') {
                routeHtml += `
                    <details class="dash-city" ${isCityOpen} data-city-id="${route}::${city}">
                        <summary style="display: flex; align-items: center; justify-content: space-between;">
                            <span>🏙️ ${city}</span>
                            <div style="display:flex; align-items:center; gap:8px; margin-left: auto;">
                                ${cityDots}
                                <span style="font-size: 12px; color: var(--text-muted); font-weight: 600; margin-right: 4px;">${cityProgressText}</span>
                                <span class="details-indicator">▼</span>
                            </div>
                        </summary>
                        <div class="details-content dash-city-content">
                            ${cityAddressesHtml}
                        </div>
                    </details>
                `;
            }
        });
        
        // Compute progress bar percentages for Route
        const percentH1 = totalTargetH1 > 0 ? Math.round((totalCompletedH1 / totalTargetH1) * 100) : (totalCompletedH1 > 0 ? 100 : 0);
        const percentH2 = totalTargetH2 > 0 ? Math.round((totalCompletedH2 / totalTargetH2) * 100) : (totalCompletedH2 > 0 ? 100 : 0);
        
        const routeMachines = db.machines.filter(m => {
            const a = db.addresses.find(addr => addr.id == m.addressId);
            return a && a.route === route;
        });
        const routeStatus = calculateAggregateStatus(routeMachines);
        const routeDots = getStatusDotsHtmlForAggregated(routeStatus);
        
        const isRouteOpen = !isFirstLoad && openRoutes.includes(route) || (searchVal !== '') ? 'open' : '';
        
        if (routeHtml !== '') {
            html += `
                <details class="dash-route" ${isRouteOpen} data-route-id="${route}">
                    <summary>
                        <div style="flex:1; display:flex; flex-direction:column; gap:6px; padding-right:12px;">
                            <div style="display:flex; align-items:center; justify-content:space-between;">
                                <span>🚗 ${route}</span>
                                ${routeDots}
                            </div>
                            <div class="progress-bars-wrapper" style="display: flex; flex-direction: column; gap: 8px;">
                                <!-- I половина -->
                                <div class="progress-bar-container" style="margin-top: 2px;">
                                    <div class="progress-info" style="font-size: 11px; margin-bottom: 2px;">
                                        <span>I половина (1-15): ${percentH1}%</span>
                                        <span>${totalCompletedH1}/${totalTargetH1} ТО</span>
                                    </div>
                                    <div class="progress-bar-bg" style="height: 6px;">
                                        <div class="progress-bar-fill" style="width: ${percentH1}%; background-color: var(--primary-color);"></div>
                                    </div>
                                </div>
                                <!-- II половина -->
                                <div class="progress-bar-container" style="margin-top: 0;">
                                    <div class="progress-info" style="font-size: 11px; margin-bottom: 2px;">
                                        <span>II половина (16+): ${percentH2}%</span>
                                        <span>${totalCompletedH2}/${totalTargetH2} ТО</span>
                                    </div>
                                    <div class="progress-bar-bg" style="height: 6px;">
                                        <div class="progress-bar-fill" style="width: ${percentH2}%; background-color: #00838f;"></div>
                                    </div>
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
        }
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
                                        <button class="btn-outline admin-only" style="padding:4px 8px;" onclick="event.stopPropagation(); openEditAddress(${a.id})" title="Редактировать адрес">✏️</button>
                                        <button class="btn-danger admin-only" style="padding:4px 8px;" onclick="event.stopPropagation(); deleteAddress(${a.id})" title="Удалить адрес">🗑️</button>
                                        <span class="details-indicator" style="margin-left: 8px;">▼</span>
                                    </div>
                                </div>
                            </summary>
                            
                            <div style="padding: 0 8px; margin-top: 8px;">
                                <button class="btn-outline" style="width:100%; margin-bottom:8px; font-size:12px; padding:6px 12px;" onclick="openMapInKodular('${a.address.replace(/'/g, "\\'")}')">🗺️ Показать на карте</button>
                            </div>
                            
                            <div class="machines-group" style="margin-top: 8px; padding: 8px; background: #fafafa;">
                                <div class="machines-group-title" style="font-size: 11px; margin-bottom: 6px;">Оборудование на точке</div>
                                <div class="form-group" style="margin-bottom: 8px;">
                                    <input type="text" placeholder="🔍 Поиск оборудования (модель, S/N)..." class="address-card-machine-search" oninput="filterAddressCardMachines(this)" style="margin-bottom: 0; padding: 6px 10px; font-size: 12px; height: auto;">
                                </div>
                                <div class="machines-card-list">
                                    ${machHtml}
                                </div>
                                <button class="btn-primary admin-only" style="padding: 6px; font-size:11px; margin-top:8px; width:100%;" onclick="openAddMachineModal(${a.id})">+ Добавить машину</button>
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
    
    // Update weekly statistics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyRecords = db.history.filter(h => new Date(h.date) >= oneWeekAgo);
    const weeklyCount = weeklyRecords.length;
    const weeklyVerified = weeklyRecords.filter(h => h.checked).length;
    
    const statsCountEl = document.getElementById('statsWeeklyCount');
    const statsVerifiedEl = document.getElementById('statsWeeklyVerified');
    if (statsCountEl) statsCountEl.innerText = `${weeklyCount} ТО`;
    if (statsVerifiedEl) statsVerifiedEl.innerText = `${weeklyVerified} подтверждено`;
    
    let filtered = db.history;
    
    // Apply segmented control verification filters
    if (historyFilterStatus === 'unverified') {
        filtered = db.history.filter(h => !h.checked);
    } else if (historyFilterStatus === 'verified') {
        filtered = db.history.filter(h => h.checked);
    }
    
    // Search filter logic
    if (searchVal) {
        filtered = filtered.filter(h => {
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
        container.innerHTML = '<p style="text-align:center; padding: 20px 0; color:var(--text-muted)">История обслуживания пуста или нет записей с выбранным фильтром.</p>';
        return;
    }
    
    // Sort chronological descending
    const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const dayKeys = [];
    const dayGroups = {};
    
    sorted.forEach(h => {
        const dateObj = new Date(h.date);
        
        // Format Day string (Russian)
        const days = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
        const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
        const dayStr = `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
        
        if (!dayGroups[dayStr]) {
            dayGroups[dayStr] = [];
            dayKeys.push(dayStr);
        }
        dayGroups[dayStr].push(h);
    });
    
    // Save open state before re-rendering
    const openDays = Array.from(document.querySelectorAll('#historyList .history-day-collapsible[open]')).map(el => el.getAttribute('data-day-id') || '');
    const isHistoryFirstLoad = document.querySelectorAll('#historyList .history-day-collapsible').length === 0;

    let html = '';
    
    dayKeys.forEach(dayStr => {
        const isDayOpen = !isHistoryFirstLoad && openDays.includes(dayStr) || (searchVal !== '') ? 'open' : '';
        const items = dayGroups[dayStr];
        let itemsHtml = '';
        
        items.forEach(h => {
            const dateObj = new Date(h.date);
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
            
            itemsHtml += `
                <div class="timeline-item ${h.checked ? 'verified-item' : ''}">
                    <div class="timeline-header" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" class="history-check-input" ${h.checked ? 'checked' : ''} onchange="toggleHistoryChecked(${h.id}, this.checked)" onclick="event.stopPropagation();" ${localStorage.getItem('fsm_user_role') === 'Администратор' ? '' : 'disabled'}>
                            <div class="timeline-title">${model}</div>
                        </div>
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
                    
                    <div class="actions admin-only" style="margin-top: 12px; display:flex; justify-content:flex-end;">
                        <button class="btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="openEditHistory(${h.id})" title="Редактировать">✏️</button>
                        <button class="btn-danger" style="padding: 4px 8px; font-size: 11px;" onclick="deleteHistory(${h.id})" title="Удалить">🗑️</button>
                    </div>
                </div>
            `;
        });
        
        // Show double-check icon for mass verification of unverified items in this day
        const hasUnchecked = items.some(item => !item.checked);
        const isAdmin = localStorage.getItem('fsm_user_role') === 'Администратор';
        const verifyAllBtn = (hasUnchecked && isAdmin) ? `
            <button class="btn-outline square-btn tooltip" onclick="event.stopPropagation(); verifyAllForDay('${dayStr.replace(/'/g, "\\'")}')" title="Подтвердить все за этот день" style="padding: 2px 6px; font-size: 11px; margin: 0 4px; min-height: 22px; height: 22px; line-height: 1; border-radius: 4px; color: var(--success-color); border-color: var(--success-color);">✓✓</button>
        ` : '';
        
        html += `
            <details class="history-day-collapsible" ${isDayOpen} data-day-id="${dayStr}">
                <summary class="history-day-summary">
                    <span>📅 ${dayStr}</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="badge info" style="background-color: var(--primary-color); color: #fff; padding: 2px 8px; font-size:11px; border-radius:10px;">${items.length}</span>
                        ${verifyAllBtn}
                        <span class="details-indicator">▼</span>
                    </div>
                </summary>
                <div class="details-content history-day-content" style="padding: 8px 0; background: transparent;">
                    ${itemsHtml}
                </div>
            </details>
        `;
    });
    
    container.innerHTML = html;
}

// =========================================================================
// SEARCH & FILTER FUNCTIONALITY FOR DASHBOARD (CHECK-LIST)
// =========================================================================
function filterDashboard(inputEl) {
    const val = inputEl.value.toLowerCase().trim();
    const routes = document.querySelectorAll('#dashboardList .dash-route');
    
    routes.forEach(routeEl => {
        const routeSummarySpan = routeEl.querySelector('summary span');
        const routeTitle = routeSummarySpan ? routeSummarySpan.innerText.toLowerCase() : '';
        const routeMatchesSelf = routeTitle.includes(val);
        let routeHasVisibleContent = false;
        
        const cities = routeEl.querySelectorAll('.dash-city');
        cities.forEach(cityEl => {
            const citySummarySpan = cityEl.querySelector('summary span');
            const cityTitle = citySummarySpan ? citySummarySpan.innerText.toLowerCase() : '';
            const cityMatchesSelf = routeMatchesSelf || cityTitle.includes(val);
            let cityHasVisibleContent = false;
            
            const addresses = cityEl.querySelectorAll('.dash-address');
            addresses.forEach(addrEl => {
                const addrSummarySpan = addrEl.querySelector('summary span');
                const addrTitle = addrSummarySpan ? addrSummarySpan.innerText.toLowerCase() : '';
                const addrText = addrEl.getAttribute('data-address-text') || '';
                const addrMatchesSelf = routeMatchesSelf || cityMatchesSelf || addrTitle.includes(val) || addrText.includes(val);
                let addressHasVisibleContent = false;
                
                const machines = addrEl.querySelectorAll('.address-machines-list .list-item');
                machines.forEach(mach => {
                    const machText = mach.getAttribute('data-machine-text') || '';
                    if (val === '' || addrMatchesSelf || machText.includes(val)) {
                        mach.style.display = 'flex';
                        addressHasVisibleContent = true;
                    } else {
                        mach.style.display = 'none';
                    }
                });
                
                if (val === '' || addressHasVisibleContent) {
                    addrEl.style.display = 'block';
                    cityHasVisibleContent = true;
                    if (val !== '') {
                        addrEl.setAttribute('open', '');
                    } else {
                        addrEl.removeAttribute('open');
                    }
                } else {
                    addrEl.style.display = 'none';
                    addrEl.removeAttribute('open');
                }
            });
            
            if (val === '' || cityHasVisibleContent) {
                cityEl.style.display = 'block';
                routeHasVisibleContent = true;
                if (val !== '') {
                    cityEl.setAttribute('open', '');
                } else {
                    cityEl.setAttribute('open', '');
                }
            } else {
                cityEl.style.display = 'none';
                cityEl.removeAttribute('open');
            }
        });
        
        if (val === '' || routeHasVisibleContent) {
            routeEl.style.display = 'block';
            if (val !== '') {
                routeEl.setAttribute('open', '');
            } else {
                routeEl.removeAttribute('open');
            }
        } else {
            routeEl.style.display = 'none';
            routeEl.removeAttribute('open');
        }
    });
}

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

// =========================================================================
// HAPTIC FEEDBACK (TACTILE VIBRATION)
// =========================================================================
function triggerHapticFeedback() {
    if (navigator.vibrate) {
        navigator.vibrate(50);
    } else if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
        window.Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' }).catch(() => {});
    }
}

// =========================================================================
// DARK THEME CONTROLLER
// =========================================================================
function toggleDarkTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark');
        localStorage.setItem('fsm_theme', 'dark');
    } else {
        document.body.classList.remove('dark');
        localStorage.setItem('fsm_theme', 'light');
    }
    const toggleSetting = document.getElementById('darkThemeToggle');
    if (toggleSetting) toggleSetting.checked = isDark;
}

// =========================================================================
// DATABASE EXPORT / IMPORT CONTROLLER
// =========================================================================
function exportDatabase() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `fsm_db_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('📤 База данных успешно экспортирована!');
}

function importDatabase(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (!parsed.models || !parsed.banks || !parsed.routes || !parsed.cities || !parsed.addresses || !parsed.machines || !parsed.history) {
                throw new Error("Неверная структура резервной копии");
            }
            
            doubleConfirm("ИМПОРТИРОВАТЬ базу данных (это полностью перезапишет текущую базу)", () => {
                db = parsed;
                saveData();
                triggerHapticFeedback();
                showToast('📥 База данных успешно восстановлена!');
                setTimeout(() => window.location.reload(), 1000);
            });
        } catch (err) {
            showToast('❌ Ошибка импорта: ' + err.message);
        }
    };
    reader.readAsText(file);
    input.value = '';
}

// =========================================================================
// EMERGENCY REPAIR INCIDENT LOG
// =========================================================================
function openProblemModal(machineId) {
    openServiceModal(machineId);
    document.getElementById('modalTitle').innerText = `⚠️ Запись ремонта / Поломки: ${db.machines.find(m => m.id == machineId).model}`;
    document.getElementById('modalNotes').placeholder = "Опишите неисправность или выполненный ремонт...";
    document.getElementById('modalNotes').focus();
}

// =========================================================================
// HISTORY FILTERING & MASS VERIFICATION STATE
// =========================================================================
let historyFilterStatus = 'all';

function setHistoryFilter(status) {
    historyFilterStatus = status;
    document.querySelectorAll('.segment-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.getElementById('histFilter-' + status);
    if (activeBtn) activeBtn.classList.add('active');
    renderHistory();
}

function verifyAllForDay(dayStr) {
    const records = db.history.filter(h => {
        const dateObj = new Date(h.date);
        const days = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
        const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
        const curDayStr = `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
        return curDayStr === dayStr;
    });
    
    const unchecked = records.filter(r => !r.checked);
    if (unchecked.length > 0) {
        doubleConfirm(`ПОДТВЕРДИТЬ все выполненные ТО за ${dayStr}`, () => {
            unchecked.forEach(r => r.checked = true);
            saveData();
            triggerHapticFeedback();
            showToast('✅ Все ТО за день подтверждены!');
        });
    }
}

// Expose scanner and custom functions globally
window.exportDatabase = exportDatabase;
window.importDatabase = importDatabase;
window.openProblemModal = openProblemModal;
window.setHistoryFilter = setHistoryFilter;
window.verifyAllForDay = verifyAllForDay;
window.triggerHapticFeedback = triggerHapticFeedback;

// =========================================================================
// ROLE AUTHENTICATION & ACCESS CONTROL LOGIC
// =========================================================================
function checkUserRole() {
    const role = localStorage.getItem('fsm_user_role');
    const authModal = document.getElementById('roleAuthModal');
    
    if (!role) {
        if (authModal) authModal.style.display = 'flex';
        populateDropdown('userRoleSelect', ['Работник', 'Администратор'], 'Работник');
        document.body.classList.remove('role-worker', 'role-admin');
    } else {
        if (authModal) authModal.style.display = 'none';
        
        if (role === 'Работник') {
            document.body.classList.add('role-worker');
            document.body.classList.remove('role-admin');
        } else {
            document.body.classList.add('role-admin');
            document.body.classList.remove('role-worker');
        }
        
        const profileRoleText = document.getElementById('profileRoleText');
        if (profileRoleText) profileRoleText.innerText = role;
    }
}

function confirmRole() {
    const selectVal = document.getElementById('userRoleSelect').value || 'Работник';
    localStorage.setItem('fsm_user_role', selectVal);
    showToast(`👤 Роль [${selectVal}] успешно подтверждена`);
    checkUserRole();
    renderAll();
}

function logoutRole() {
    localStorage.removeItem('fsm_user_role');
    showToast('👤 Сброс роли');
    checkUserRole();
    renderAll();
}

// =========================================================================
// CHECKLIST STATUS AGGREGATION & PROPAGATION
// =========================================================================
function calculateAggregateStatus(machinesList) {
    if (!machinesList || machinesList.length === 0) {
        return { h1: 'grey', h2: 'grey' };
    }
    
    let hasH1Target = false;
    let hasH2Target = false;
    let anyH1Overdue = false;
    let anyH1Pending = false;
    let anyH2Pending = false;
    
    const now = new Date();
    const isAfter15 = now.getDate() > 15;
    
    machinesList.forEach(mach => {
        const thisMonthServices = db.history.filter(h => h.machineId == mach.id && isCurrentMonth(h.date));
        const completedH1 = thisMonthServices.filter(h => new Date(h.date).getDate() <= 15).length;
        const completedH2 = thisMonthServices.filter(h => new Date(h.date).getDate() > 15).length;
        
        const F = mach.freq;
        let targetH1 = 0;
        let targetH2 = 0;
        
        if (F > 0) {
            const baseTarget = Math.floor(F / 2);
            const rem = F % 2;
            if (rem === 0) {
                targetH1 = baseTarget;
                targetH2 = baseTarget;
            } else {
                const excessH1 = Math.max(0, completedH1 - baseTarget);
                const excessH2 = Math.max(0, completedH2 - baseTarget);
                if (excessH1 >= 1) {
                    targetH1 = baseTarget + 1;
                    targetH2 = baseTarget;
                } else if (excessH2 >= 1) {
                    targetH1 = baseTarget;
                    targetH2 = baseTarget + 1;
                } else {
                    if (now.getDate() <= 15) {
                        targetH1 = baseTarget + 1;
                        targetH2 = baseTarget;
                    } else {
                        targetH1 = baseTarget;
                        targetH2 = baseTarget + 1;
                    }
                }
            }
        }
        
        if (targetH1 > 0) {
            hasH1Target = true;
            if (completedH1 < targetH1) {
                if (isAfter15) {
                    anyH1Overdue = true;
                } else {
                    anyH1Pending = true;
                }
            }
        }
        
        if (targetH2 > 0) {
            hasH2Target = true;
            if (completedH2 < targetH2) {
                anyH2Pending = true;
            }
        }
        
        if (targetH1 === 0 && targetH2 === 0) {
            const totalCount = completedH1 + completedH2;
            if (totalCount === 0) {
                anyH1Pending = true;
            }
        }
    });
    
    let h1 = 'grey';
    if (hasH1Target) {
        if (anyH1Overdue) h1 = 'red';
        else if (anyH1Pending) h1 = 'blue';
        else h1 = 'green';
    }
    
    let h2 = 'grey';
    if (hasH2Target) {
        if (anyH2Pending) h2 = 'blue';
        else h2 = 'green';
    }
    
    return { h1, h2 };
}

function getStatusDotsHtmlForAggregated(statusObj) {
    let html = '<div class="status-dots" style="margin-right: 4px;">';
    
    const h1Tooltip = statusObj.h1 === 'green' ? 'I половина: Все выполнено' : (statusObj.h1 === 'red' ? 'I половина: Есть просроченные' : (statusObj.h1 === 'blue' ? 'I половина: Есть ожидающие' : 'I половина: ТО не требуется'));
    const h2Tooltip = statusObj.h2 === 'green' ? 'II половина: Все выполнено' : (statusObj.h2 === 'blue' ? 'II половина: Есть ожидающие' : 'II половина: ТО не требуется');
    
    html += `<span class="status-dot ${statusObj.h1}" data-tooltip="${h1Tooltip}"></span>`;
    html += `<span class="status-dot ${statusObj.h2}" data-tooltip="${h2Tooltip}"></span>`;
    
    html += '</div>';
    return html;
}

// =========================================================================
// MACHINE REPAIR SERVICE HISTORY
// =========================================================================
function renderMachineHistory(machineId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const records = db.history.filter(h => h.machineId == machineId).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (records.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 10px 0; color:var(--text-muted); font-size: 12px; margin: 0;">История ремонта пуста.</p>';
        return;
    }
    
    container.innerHTML = records.map(h => {
        const dObj = new Date(h.date);
        const dateStr = dObj.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) + 
                        ' ' + dObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        
        let tasksHtml = '';
        if (h.tasks && h.tasks.length > 0) {
            tasksHtml = `
                <div class="mach-history-tasks">
                    ${h.tasks.map(t => `<span class="mach-history-task-tag">${t}</span>`).join('')}
                </div>
            `;
        }
        
        return `
            <div class="mach-history-item">
                <div class="mach-history-date">${dateStr}</div>
                <div class="mach-history-meta">👤 ${h.employee || 'Неизвестно'} ${h.counter ? ` | 🔢 ${h.counter}` : ''}</div>
                ${tasksHtml}
                ${h.notes ? `<div class="mach-history-notes">${h.notes.replace(/\n/g, '<br>')}</div>` : ''}
                ${h.parts ? `<div class="mach-history-parts">🛠️ Детали: ${h.parts}</div>` : ''}
            </div>
        `;
    }).join('');
}

function togglePrevServiceHistory() {
    const container = document.getElementById('prevServiceHistoryContainer');
    const btn = document.getElementById('btnTogglePrevService');
    if (!container || !btn) return;
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        btn.innerText = '📖 Скрыть прошлые ремонты';
    } else {
        container.style.display = 'none';
        btn.innerText = '📜 Прошлые ремонты оборудования';
    }
}

window.confirmRole = confirmRole;
window.logoutRole = logoutRole;
window.togglePrevServiceHistory = togglePrevServiceHistory;



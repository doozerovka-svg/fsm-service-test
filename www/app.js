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

let dashboardActiveDate = new Date();
let historySelectedEmployee = 'Все инженеры';

function formatSeparated(val) {
    if (val === undefined || val === null) return '';
    const str = String(val).trim();
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");
}
window.formatSeparated = formatSeparated;

function formatInputWithSpaces(inputEl) {
    let cursorPosition = inputEl.selectionStart;
    let originalValue = inputEl.value;
    let stripped = originalValue.replace(/\s/g, '');
    let formatted = stripped.replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009");
    
    if (formatted !== originalValue) {
        inputEl.value = formatted;
        let strippedCharIndex = 0;
        let formattedCharIndex = 0;
        let strippedTarget = originalValue.slice(0, cursorPosition).replace(/\s/g, '').length;
        
        while (strippedCharIndex < strippedTarget && formattedCharIndex < formatted.length) {
            if (formatted[formattedCharIndex] !== "\u2009" && formatted[formattedCharIndex] !== " ") {
                strippedCharIndex++;
            }
            formattedCharIndex++;
        }
        while (formattedCharIndex < formatted.length && (formatted[formattedCharIndex] === "\u2009" || formatted[formattedCharIndex] === " ")) {
            formattedCharIndex++;
        }
        inputEl.setSelectionRange(formattedCharIndex, formattedCharIndex);
    }
}
window.formatInputWithSpaces = formatInputWithSpaces;

document.addEventListener('input', (e) => {
    const formatIds = [
        'addMachSerial', 'addMachInv', 
        'detMachSerial', 'detMachInv', 
        'modalCounter', 'editHistCounter', 
        'modalReplacementSerial', 'editHistReplacementSerial'
    ];
    if (formatIds.includes(e.target.id)) {
        formatInputWithSpaces(e.target);
    }
});

document.addEventListener('change', (e) => {
    if (e.target.id === 'historyEmployeeFilter') {
        historySelectedEmployee = e.target.value;
        renderHistory();
    }
});

// Fallback initializations for older localStorage schemas
db.models = db.models || ["Magner 150", "Kisan Newton", "SBM SB-2000"];
db.banks = db.banks || ["MAIB", "Moldindconbank", "Victoriabank"];
db.routes = db.routes || ["Маршрут 1 (Центр)", "Маршрут 2 (Ботаника)"];
db.employees = db.employees || ["Инженер 1", "Инженер 2"];
db.cities = db.cities || ["Кишинев", "Бельцы"];
const defaultBpsParts = [
    { id: 1001, name: "РУЧКА", bank: "Все банки", model: "BPS C1 / C2", price: 11.2, currency: "EUR" },
    { id: 1002, name: "ПЕЧАТНАЯ ПЛАТА C1-F-IO", bank: "Все банки", model: "BPS C1 / C2", price: 177.31, currency: "EUR" },
    { id: 1003, name: "ПЕЧАТНАЯ ПЛАТА C1-F-TUV", bank: "Все банки", model: "BPS C1 / C2", price: 75.48, currency: "EUR" },
    { id: 1004, name: "МАГНИТНАЯ ГОЛОВКА HF-901-2", bank: "Все банки", model: "BPS C1 / C2", price: 65.55, currency: "EUR" },
    { id: 1005, name: "ДАТЧИК ИЗОБРАЖЕНИЯ MC06H", bank: "Все банки", model: "BPS C1 / C2", price: 384.71, currency: "EUR" },
    { id: 1006, name: "ШЛЕЙФ P1-A к CIS", bank: "Все банки", model: "BPS C1 / C2", price: 7.69, currency: "EUR" },
    { id: 1007, name: "ШЛЕЙФ P3-S к MRS", bank: "Все банки", model: "BPS C1 / C2", price: 9.21, currency: "EUR" },
    { id: 1008, name: "ШЛЕЙФ P4-MT0 к MT1", bank: "Все банки", model: "BPS C1 / C2", price: 9.87, currency: "EUR" },
    { id: 1009, name: "ЖК-ДИСПЛЕЙ ST035QVTN03", bank: "Все банки", model: "BPS C1 / C2", price: 109.82, currency: "EUR" },
    { id: 1010, name: "ОПТОВОЛОКНО LD02-01", bank: "Все банки", model: "BPS C1 / C2", price: 174.42, currency: "EUR" },
    { id: 1011, name: "ЗУБЧАТЫЙ РЕМЕНЬ 168-3Mх5", bank: "Все банки", model: "BPS C1 / C2", price: 11.53, currency: "EUR" },
    { id: 1012, name: "ЗУБЧАТЫЙ ШКИВ S3Mх18T", bank: "Все банки", model: "BPS C1 / C2", price: 5.92, currency: "EUR" },
    { id: 1013, name: "ЗУБЧАТЫЙ ШКИВ D S3Mх18Tх8", bank: "Все банки", model: "BPS C1 / C2", price: 5.92, currency: "EUR" },
    { id: 1014, name: "ПЕЧАТНАЯ ПЛАТА C1-F-BLD", bank: "Все банки", model: "BPS C1 / C2", price: 199.58, currency: "EUR" },
    { id: 1015, name: "ПЕЧАТНАЯ ПЛАТА PW-SW", bank: "Все банки", model: "BPS C1 / C2", price: 52.5, currency: "EUR" },
    { id: 1016, name: "МОТОР NC6000", bank: "Все банки", model: "BPS C1 / C2", price: 68.97, currency: "EUR" }
];

db.addresses = db.addresses || [];
db.machines = db.machines || [];
db.history = db.history || [];
db.prices = db.prices || {};
db.prices.maintenance = db.prices.maintenance || {};
db.prices.cities = db.prices.cities || {};
db.prices.parts = ensureArray(db.prices.parts);

if (db.prices.parts.length === 0) {
    db.prices.parts = [...defaultBpsParts];
}

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
    // Initialize geo radius slider to saved value
    const slider = document.getElementById('geoRadiusSlider');
    const label  = document.getElementById('geoRadiusLabel');
    if (slider && label) {
        slider.value = geoProximityRadius;
        label.innerText = geoProximityRadius >= 1000 ? (geoProximityRadius/1000).toFixed(1) + ' км' : geoProximityRadius + ' м';
    }
});

// Event listeners to handle app resume / visibility change and sync time
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        const now = new Date();
        if (dashboardActiveDate.getMonth() === now.getMonth() && dashboardActiveDate.getFullYear() === now.getFullYear()) {
            dashboardActiveDate = now;
        }
        renderAll();
    }
});
window.addEventListener('focus', () => {
    const now = new Date();
    if (dashboardActiveDate.getMonth() === now.getMonth() && dashboardActiveDate.getFullYear() === now.getFullYear()) {
        dashboardActiveDate = now;
    }
    renderAll();
});
if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    window.Capacitor.Plugins.App.addListener('appStateChange', (state) => {
        if (state.isActive) {
            const now = new Date();
            if (dashboardActiveDate.getMonth() === now.getMonth() && dashboardActiveDate.getFullYear() === now.getFullYear()) {
                dashboardActiveDate = now;
            }
            renderAll();
        }
    });
}

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
                db.prices = db.prices || {};
                db.prices.maintenance = db.prices.maintenance || {};
                db.prices.cities = db.prices.cities || {};
                db.prices.parts = ensureArray(db.prices.parts);
                
                // Migrate legacy/duplicate/incorrect BPS parts to unified BPS C1 / C2 parts
                const hasOldBpsParts = db.prices.parts.some(p => p.model === "BPS C1" || p.model === "BPS C2" || p.model === "В1" || p.model === "B1" || (p.id >= 1017 && p.id <= 1032));
                const needsBpsMigration = hasOldBpsParts || db.prices.parts.length === 0;
                
                if (needsBpsMigration) {
                    console.log("Migrating BPS parts to shared C1/C2 model.");
                    db.prices.parts = db.prices.parts.filter(p => !(p.id >= 1001 && p.id <= 1032) && p.model !== "BPS C1" && p.model !== "BPS C2" && p.model !== "В1" && p.model !== "B1");
                    db.prices.parts.push(...defaultBpsParts);
                    setTimeout(() => {
                        saveData();
                    }, 500);
                }
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

// =========================================================================
// PASSIVE GEO PROXIMITY TRACKING
// =========================================================================
let currentUserLat = null;
let currentUserLon = null;
let geoWatchId = null;
let geoProximityEnabled = (localStorage.getItem('fsm_geo_proximity') === 'true');
let geoProximityRadius = parseInt(localStorage.getItem('fsm_geo_radius') || '1000', 10); // metres

// Geocoding cache: address text -> {lat, lon} / {failed: true} / {pending: true}
const geocodeCache = JSON.parse(localStorage.getItem('fsm_geocode_cache')) || {};
// Clean up any stale pending entries on startup
for (const key in geocodeCache) {
    if (geocodeCache[key] && geocodeCache[key].pending) {
        delete geocodeCache[key];
    }
}

let renderDashboardTimeout = null;
function throttleRenderDashboard() {
    if (renderDashboardTimeout) return;
    renderDashboardTimeout = setTimeout(() => {
        renderDashboardTimeout = null;
        renderDashboard();
    }, 1500); // Max once every 1.5 seconds
}

const geocodeQueue = [];
let isGeocodingQueueRunning = false;

async function processGeocodeQueue() {
    if (isGeocodingQueueRunning || geocodeQueue.length === 0) return;
    isGeocodingQueueRunning = true;

    while (geocodeQueue.length > 0) {
        const { address, resolve } = geocodeQueue.shift();
        
        // Double check if already cached in the meantime
        if (geocodeCache[address] && !geocodeCache[address].pending) {
            resolve(geocodeCache[address]);
            continue;
        }
        
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=ru`);
            const data = await res.json();
            if (data && data[0]) {
                const result = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
                geocodeCache[address] = result;
                localStorage.setItem('fsm_geocode_cache', JSON.stringify(geocodeCache));
                resolve(result);
            } else {
                geocodeCache[address] = { failed: true };
                localStorage.setItem('fsm_geocode_cache', JSON.stringify(geocodeCache));
                resolve(null);
            }
        } catch (e) {
            console.warn("Geocoding failed for:", address, e);
            geocodeCache[address] = { failed: true };
            localStorage.setItem('fsm_geocode_cache', JSON.stringify(geocodeCache));
            resolve(null);
        }

        // Wait 1 second before the next request to respect Nominatim usage policy
        await new Promise(r => setTimeout(r, 1000));
    }

    isGeocodingQueueRunning = false;
}

function enqueueGeocode(address) {
    if (!address) return Promise.resolve(null);
    const cached = geocodeCache[address];
    if (cached) {
        return Promise.resolve(cached);
    }

    // Mark as pending immediately to avoid duplicate enqueuing
    geocodeCache[address] = { pending: true };

    return new Promise(resolve => {
        geocodeQueue.push({ address, resolve });
        processGeocodeQueue();
    });
}

/**
 * Haversine distance in metres between two lat/lon points.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in metres
    const toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/**
 * Start passive watchPosition that continuously updates user location.
 */
function startGeoWatch() {
    if (geoWatchId !== null) return; // already watching
    if (!navigator.geolocation) {
        showToast('⚠️ Геолокация не поддерживается браузером');
        return;
    }
    geoWatchId = navigator.geolocation.watchPosition(
        (pos) => {
            currentUserLat = pos.coords.latitude;
            currentUserLon = pos.coords.longitude;
            throttleRenderDashboard();
        },
        (err) => {
            console.warn('Geo watch error:', err.message);
            // Don't spam toasts; watchPosition errors are often temporary
        },
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 }
    );
}

function stopGeoWatch() {
    if (geoWatchId !== null) {
        navigator.geolocation.clearWatch(geoWatchId);

        geoWatchId = null;
    }
}

/**
 * Toggle geo-proximity filter on/off and update the button state.
 */
function toggleGeoProximity() {
    geoProximityEnabled = !geoProximityEnabled;
    localStorage.setItem('fsm_geo_proximity', geoProximityEnabled);
    if (geoProximityEnabled) {
        startGeoWatch();
        showToast('📡 Фильтр по близости включён');
    } else {
        stopGeoWatch();
        showToast('📡 Фильтр по близости выключен');
    }
    renderDashboard();
}
window.toggleGeoProximity = toggleGeoProximity;

function setGeoRadius(r) {
    geoProximityRadius = parseInt(r, 10);
    localStorage.setItem('fsm_geo_radius', geoProximityRadius);
    renderDashboard();
}
window.setGeoRadius = setGeoRadius;

// Auto-start watch if feature was left enabled
if (geoProximityEnabled) startGeoWatch();

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
    const serial = document.getElementById('addMachSerial').value.replace(/\s/g, '');
    const inv = document.getElementById('addMachInv').value.replace(/\s/g, '');
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
    
    document.getElementById('detMachSerial').value = formatSeparated(m.serial);
    document.getElementById('detMachInv').value = formatSeparated(m.inv || '');
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
        
        const newSerial = document.getElementById('detMachSerial').value.replace(/\s/g, '');
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
        }

        m.addressId = newAddressId;
        m.model = document.getElementById('detMachModel').value;
        m.serial = newSerial;
        m.inv = document.getElementById('detMachInv').value.replace(/\s/g, '');
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
    return d.getMonth() === dashboardActiveDate.getMonth() && d.getFullYear() === dashboardActiveDate.getFullYear();
}

function isActualService(h) {
    if (!h.tasks || h.tasks.length === 0) {
        return true;
    }
    return h.tasks.some(task => task !== "Перемещение оборудования" && task !== "Замена системной платы / Смена S/N");
}

function prevMonth() {
    dashboardActiveDate.setMonth(dashboardActiveDate.getMonth() - 1);
    renderDashboard();
}

function nextMonth() {
    dashboardActiveDate.setMonth(dashboardActiveDate.getMonth() + 1);
    renderDashboard();
}

window.prevMonth = prevMonth;
window.nextMonth = nextMonth;

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
    setupPartsSelector('modal', m.model, a.bank, '');
    
    // Reset service type checkboxes and conditional containers
    document.getElementById('workCheckMaintenance').checked = true;
    document.getElementById('workCheckRepair').checked = false;
    document.getElementById('workCheckReplace').checked = false;
    document.getElementById('modalPartsContainer').style.display = 'none';
    document.getElementById('modalReplacementContainer').style.display = 'none';
    document.getElementById('modalReplacementSerial').value = '';
    
    // Populate performer dropdown and preselect current logged-in employee or machine's responsible employee
    const currentEmp = localStorage.getItem('fsm_user_employee_name') || m.employee || '';
    populateDropdown('modalEmployee', db.employees, currentEmp);
    
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
    let counter = document.getElementById('modalCounter').value.replace(/\s/g, '');
    const employee = document.getElementById('modalEmployee').value;
    let parts = document.getElementById('modalParts').value.trim();
    let notes = document.getElementById('modalNotes').value.trim();
    let tasks = [];
    document.querySelectorAll('.work-check:checked').forEach(cb => tasks.push(cb.value));

    const m = db.machines.find(x => x.id == machineId);
    if (!m) return;

    const isReplace = tasks.includes('Замена машинки');
    const isRepair = tasks.includes('Ремонт машинки');
    let replacementSerial = '';
    
    if (isReplace) {
        replacementSerial = document.getElementById('modalReplacementSerial').value.replace(/\s/g, '');
        if (!replacementSerial) {
            showToast('⚠️ Введите новый серийный номер для замены машинки!');
            return;
        }
    }
    
    if (!isRepair) {
        parts = ''; // Clear parts if repair is not checked
    }

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

    const oldSerial = m.serial;
    if (isReplace) {
        m.serial = replacementSerial;
        
        const replaceLog = `Замена машинки. S/N изменен с [${oldSerial}] на [${replacementSerial}]`;
        notes = notes ? notes + '\n' + replaceLog : replaceLog;
    }

    const newRecord = { 
        id: Date.now(), 
        machineId, 
        machineSerial: isReplace ? replacementSerial : oldSerial, 
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
    document.getElementById('editHistCounter').value = formatSeparated(h.counter || '');
    document.getElementById('editHistNotes').value = h.notes || '';
    document.getElementById('editHistParts').value = h.parts || '';
    
    // Check checkboxes based on task array contents
    const hasMaintenance = h.tasks ? h.tasks.includes('Обслуживание машинки') : false;
    const hasRepair = h.tasks ? h.tasks.includes('Ремонт машинки') : false;
    const hasReplace = h.tasks ? h.tasks.includes('Замена машинки') : false;

    document.getElementById('editWorkCheckMaintenance').checked = hasMaintenance;
    document.getElementById('editWorkCheckRepair').checked = hasRepair;
    document.getElementById('editWorkCheckReplace').checked = hasReplace;

    // Toggle container display based on selections
    document.getElementById('editHistPartsContainer').style.display = hasRepair ? 'block' : 'none';
    document.getElementById('editHistReplacementContainer').style.display = hasReplace ? 'block' : 'none';
    
    // Set replacement serial number input
    document.getElementById('editHistReplacementSerial').value = hasReplace ? formatSeparated(h.machineSerial || '') : '';
    
    // Populate performing employee dropdown
    populateDropdown('editHistEmployee', db.employees, h.employee || '');
    
    // Initialize parts selector widget
    const m = db.machines.find(x => x.id == h.machineId);
    const a = m ? db.addresses.find(x => x.id == m.addressId) : null;
    const model = m ? m.model : 'Все модели';
    const bank = a ? a.bank : 'Все банки';
    setupPartsSelector('editHist', model, bank, h.parts || '');
    
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
            
            let tasks = [];
            document.querySelectorAll('.edit-work-check:checked').forEach(cb => tasks.push(cb.value));
            
            const isReplace = tasks.includes('Замена машинки');
            const isRepair = tasks.includes('Ремонт машинки');
            let replacementSerial = '';
            
            if (isReplace) {
                replacementSerial = document.getElementById('editHistReplacementSerial').value.replace(/\s/g, '');
                if (!replacementSerial) {
                    showToast('⚠️ Введите новый серийный номер для замены машинки!');
                    return;
                }
            }
            
            let parts = document.getElementById('editHistParts').value.trim();
            if (!isRepair) {
                parts = '';
            }

            // Sync serial changes with the machines registry if replacement serial has changed
            const m = db.machines.find(x => x.id == h.machineId);
            if (isReplace && replacementSerial && h.machineSerial !== replacementSerial) {
                h.machineSerial = replacementSerial;
                if (m) {
                    m.serial = replacementSerial;
                }
            } else if (!isReplace && m && h.machineSerial !== m.serial) {
                h.machineSerial = m.serial;
            }
            
            h.date = isoDate;
            h.counter = document.getElementById('editHistCounter').value.replace(/\s/g, '');
            h.employee = document.getElementById('editHistEmployee').value;
            h.parts = parts;
            h.notes = document.getElementById('editHistNotes').value.trim();
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

function toggleHistoryAdminChecked(id, isChecked) {
    const h = db.history.find(x => x.id == id);
    if (h) {
        h.adminChecked = isChecked;
        saveData();
        showToast(isChecked ? '🛡️ Подтверждено администратором' : 'ℹ️ Подтверждение админа снято');
        triggerHapticFeedback();
    }
}
window.toggleHistoryAdminChecked = toggleHistoryAdminChecked;

// =========================================================================
// DATA POPULATION HELPERS
// =========================================================================
function populateDropdown(inputId, itemsArray, selectedValue = null) {
    const wrapper = document.getElementById('wrapper-' + inputId);
    const hiddenInput = document.getElementById(inputId);
    if (!wrapper || !hiddenInput) return;

    // Sort itemsArray alphabetically, keeping "✍️ Ввести имя вручную..." at the end
    let sortedItems = [...itemsArray];
    const manualIndex = sortedItems.findIndex(item => typeof item === 'string' && item.includes('Ввести имя вручную'));
    let manualItem = null;
    if (manualIndex !== -1) {
        manualItem = sortedItems.splice(manualIndex, 1)[0];
    }
    sortedItems.sort((a, b) => {
        if (typeof a === 'string' && typeof b === 'string') {
            return a.localeCompare(b, 'ru');
        }
        return 0;
    });
    if (manualItem) {
        sortedItems.push(manualItem);
    }

    // Use currently selected value from DOM if selectedValue is not specified (is null)
    const currentValue = (selectedValue !== null) ? selectedValue : hiddenInput.value;
    let displayValue = 'Выберите...';
    
    if (currentValue && sortedItems.includes(currentValue)) {
        displayValue = currentValue;
    } else if (sortedItems.length > 0) {
        displayValue = sortedItems[0];
    }

    const resolvedValue = displayValue === 'Выберите...' ? '' : displayValue;

    wrapper.innerHTML = `
        <input type="hidden" id="${inputId}" value="${resolvedValue.replace(/"/g, '&quot;')}">
        <div class="custom-select-trigger" onclick="toggleCustomDropdown(event, '${inputId}')">
            <span id="trigger-text-${inputId}">${displayValue}</span>
            <span class="custom-select-arrow">▼</span>
        </div>
        <div class="custom-select-options" id="options-${inputId}">
            ${sortedItems.map(item => `
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

    const sortedAddresses = [...db.addresses].sort((a, b) => {
        const strA = `${a.bank} - ${a.address}`;
        const strB = `${b.bank} - ${b.address}`;
        return strA.localeCompare(strB, 'ru');
    });

    // If selectedId is 0 or not passed, look at current hidden input value
    const currentId = parseInt(selectedId) || parseInt(hiddenInput.value) || 0;
    let selectedAddr = sortedAddresses.find(a => a.id == currentId);
    let displayValue = 'Выберите адрес...';
    let resolvedValue = '';
    
    if (selectedAddr) {
        resolvedValue = selectedAddr.id;
        displayValue = `${selectedAddr.bank} - ${selectedAddr.address}`;
    } else if (sortedAddresses.length > 0) {
        resolvedValue = sortedAddresses[0].id;
        displayValue = `${sortedAddresses[0].bank} - ${sortedAddresses[0].address}`;
    }

    wrapper.innerHTML = `
        <input type="hidden" id="${inputId}" value="${resolvedValue}">
        <div class="custom-select-trigger" onclick="toggleCustomDropdown(event, '${inputId}')">
            <span id="trigger-text-${inputId}">${displayValue}</span>
            <span class="custom-select-arrow">▼</span>
        </div>
        <div class="custom-select-options" id="options-${inputId}">
            ${sortedAddresses.map(a => `
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
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
        
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
    
    const list = [...(db[type] || [])].sort((a, b) => a.localeCompare(b, 'ru'));
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
// Render Dashboard Check-list
let dashboardActiveTab = localStorage.getItem('fsm_dash_active_tab') || 'all';
let dashboardActivePeriod = localStorage.getItem('fsm_dash_period') || 'month';
let dashboardActiveSort = localStorage.getItem('fsm_dash_sort') || 'address';
let dashboardSelectedRoute = null;

function setDashboardSort(sortVal) {
    dashboardActiveSort = sortVal;
    localStorage.setItem('fsm_dash_sort', sortVal);
    renderDashboard();
}
window.setDashboardSort = setDashboardSort;

function setDashboardTab(tab) {
    dashboardActiveTab = tab;
    localStorage.setItem('fsm_dash_active_tab', tab);
    renderDashboard();
}
window.setDashboardTab = setDashboardTab;

function setDashboardPeriod(period) {
    dashboardActivePeriod = period;
    localStorage.setItem('fsm_dash_period', period);
    renderDashboard();
}
window.setDashboardPeriod = setDashboardPeriod;

function handleDashboardSearchInput() {
    const searchVal = document.getElementById('dashboardSearch').value;
    const clearBtn = document.getElementById('clearDashboardSearch');
    if (clearBtn) {
        clearBtn.style.display = searchVal ? 'flex' : 'none';
    }
    renderDashboard();
}
window.handleDashboardSearchInput = handleDashboardSearchInput;

function clearDashboardSearch() {
    const input = document.getElementById('dashboardSearch');
    if (input) {
        input.value = '';
    }
    const clearBtn = document.getElementById('clearDashboardSearch');
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    renderDashboard();
}
window.clearDashboardSearch = clearDashboardSearch;

function toggleRouteFilter(routeName) {
    if (dashboardSelectedRoute === routeName) {
        dashboardSelectedRoute = null;
    } else {
        dashboardSelectedRoute = routeName;
    }
    renderDashboard();
}
window.toggleRouteFilter = toggleRouteFilter;

function getMachineCardHtml(mach, a, completedH1, targetH1, completedH2, targetH2, isCompleted, isOverdue, isPending) {
    const F = mach.freq;
    
    // Overdue calculations based on selected dashboard active month
    const now = new Date();
    const activeYear = dashboardActiveDate.getFullYear();
    const activeMonth = dashboardActiveDate.getMonth();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    let isAfter15 = false;
    if (activeYear < currentYear || (activeYear === currentYear && activeMonth < currentMonth)) {
        isAfter15 = true;
    } else if (activeYear === currentYear && activeMonth === currentMonth) {
        isAfter15 = now.getDate() > 15;
    }

    // Status dots logic
    let dotsHtml = '<div class="status-dots">';
    if (F > 0) {
        // H1 Dot
        if (targetH1 > 0) {
            let dotClass = 'blue';
            let tooltip = 'I половина: Ожидает';
            if (completedH1 >= targetH1) {
                dotClass = 'green';
                tooltip = 'I половина: Выполнено';
            } else if (completedH1 > 0) {
                dotClass = 'blue';
                tooltip = `I половина: Выполнено ${completedH1}/${targetH1}`;
            } else if (isAfter15) {
                dotClass = 'red';
                tooltip = 'I половина: Просрочено';
            }
            dotsHtml += `<span class="status-dot ${dotClass}" data-tooltip="${tooltip}"></span>`;
        } else {
            const dotClass = completedH1 > 0 ? 'green' : 'grey';
            const tooltip = completedH1 > 0 ? `I половина: Выполнено по запросу (${completedH1})` : 'I половина: ТО не требуется';
            dotsHtml += `<span class="status-dot ${dotClass}" data-tooltip="${tooltip}"></span>`;
        }
        
        // H2 Dot
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
            const dotClass = completedH2 > 0 ? 'green' : 'grey';
            const tooltip = completedH2 > 0 ? `II половина: Выполнено по запросу (${completedH2})` : 'II половина: ТО не требуется';
            dotsHtml += `<span class="status-dot ${dotClass}" data-tooltip="${tooltip}"></span>`;
        }
    } else {
        const totalCount = completedH1 + completedH2;
        const dotClass = totalCount > 0 ? 'green' : 'grey';
        const tooltip = totalCount > 0 ? `По запросу (Выполнено: ${totalCount})` : 'По запросу (Ожидает)';
        dotsHtml += `<span class="status-dot ${dotClass}" data-tooltip="${tooltip}"></span>`;
    }
    dotsHtml += '</div>';

    // Address text
    const addrText = a ? `${a.bank}, ${a.address}` : 'Адрес удален';
    const cityText = a ? a.city || 'Кишинев' : 'Неизвестно';
    const routeText = a ? a.route || 'Без маршрута' : 'Без маршрута';
    
    // Progress description
    let progressDesc = '';
    if (F > 0) {
        progressDesc = `План: I (${completedH1}/${targetH1}) · II (${completedH2}/${targetH2})`;
    } else {
        progressDesc = `По запросу (Выполнено: ${completedH1 + completedH2})`;
    }

    let borderLeftColor = 'var(--primary-color)';
    if (isOverdue) {
        borderLeftColor = 'var(--danger-color)';
    } else if (isCompleted) {
        borderLeftColor = 'var(--success-color)';
    } else if (F === 0) {
        borderLeftColor = '#a0aec0'; // neutral grey for F=0 on-demand machines
    }

    return `
        <div class="card glass-card machine-check-card" style="margin-bottom: 12px; padding: 15px; position:relative; border-left: 5px solid ${borderLeftColor};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap: 8px;">
                <div style="flex:1;">
                    <div style="font-size: 15px; font-weight:bold; color:var(--text-primary); margin-bottom: 4px;">📠 ${mach.model}</div>
                    <div style="font-size:12px; color:var(--text-secondary); margin-bottom: 6px;">S/N: <strong>${formatSeparated(mach.serial)}</strong>${mach.inv ? ` | Inv: <strong>${formatSeparated(mach.inv)}</strong>` : ''}</div>
                    <div style="font-size:13px; color:var(--text-secondary); margin-bottom: 2px; display:flex; align-items:center; gap:4px;">📍 ${addrText}</div>
                    <div style="font-size:11px; color:var(--text-muted); display:flex; gap:10px; flex-wrap:wrap; margin-top:6px;">
                        <span>🏙️ ${cityText}</span>
                        <span>🚗 ${routeText}</span>
                        ${mach.employee ? `<span>👤 Отв: ${mach.employee}</span>` : ''}
                    </div>
                </div>
                <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                    ${dotsHtml}
                    <span class="badge info" style="font-size:10px; padding: 2px 6px; border-radius:10px;">${progressDesc}</span>
                </div>
            </div>
            
            <div style="display:flex; gap:8px; margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 12px;">
                <button class="btn-success" onclick="openServiceModal(${mach.id})" style="flex:2; font-size:12px; padding:6px 10px; min-height: 34px; font-weight: 600; margin: 0;">🛠️ Обслужить / Замена</button>
                <button class="btn-danger tooltip" onclick="openProblemModal(${mach.id})" title="Зафиксировать поломку" style="flex:1; font-size:12px; padding:6px 10px; min-height: 34px; max-width: 44px; margin: 0; display:flex; align-items:center; justify-content:center;">⚠️</button>
                <button class="btn-outline tooltip" onclick="openMapInKodular('${(a ? a.address : '').replace(/'/g, "\\'")}')" title="Проложить маршрут" style="flex:1; font-size:12px; padding:6px 10px; min-height: 34px; max-width: 44px; margin: 0; display:flex; align-items:center; justify-content:center;">🗺️</button>
            </div>
        </div>
    `;
}

function renderDashboard() {
    const container = document.getElementById('dashboardList');
    if (!container) return;
    
    // Set Month Header text (Russian Months)
    const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    document.getElementById('currentMonthTitle').innerText = `Чек-лист: ${months[dashboardActiveDate.getMonth()]} ${dashboardActiveDate.getFullYear()}`;
    
    // Maintain active segment button class for tabs
    document.querySelectorAll('#tab-dashboard .segment-btn').forEach(btn => {
        if (btn.id && btn.id.startsWith('dashTab-')) {
            btn.classList.remove('active');
        }
    });
    const activeBtn = document.getElementById('dashTab-' + dashboardActiveTab);
    if (activeBtn) activeBtn.classList.add('active');

    // Maintain active segment button class for periods
    document.querySelectorAll('#tab-dashboard .period-control .segment-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activePeriodBtn = document.getElementById('periodTab-' + dashboardActivePeriod);
    if (activePeriodBtn) activePeriodBtn.classList.add('active');

    // Maintain active segment button class for sorting
    document.querySelectorAll('#dashboardSortControl .segment-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeSortBtn = document.getElementById('sortTab-' + dashboardActiveSort);
    if (activeSortBtn) activeSortBtn.classList.add('active');
    
    if (db.machines.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                <p style="font-size: 15px; margin-bottom: 12px;">Оборудование в базе отсутствует.</p>
                <p style="font-size: 13px; color: var(--text-muted)">Перейдите во вкладку <strong>📍 Адреса</strong>, чтобы добавить машины.</p>
            </div>
        `;
        return;
    }
    
    const searchInput = document.getElementById('dashboardSearch');
    if (searchInput) {
        const clearBtn = document.getElementById('clearDashboardSearch');
        if (clearBtn) {
            clearBtn.style.display = searchInput.value ? 'flex' : 'none';
        }
    }
    const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    const allList = [];
    const overdueList = [];
    const pendingList = [];
    const completedList = [];
    
    const now = new Date();
    const activeYear = dashboardActiveDate.getFullYear();
    const activeMonth = dashboardActiveDate.getMonth();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    let isAfter15 = false;
    if (activeYear < currentYear || (activeYear === currentYear && activeMonth < currentMonth)) {
        isAfter15 = true;
    } else if (activeYear === currentYear && activeMonth === currentMonth) {
        isAfter15 = now.getDate() > 15;
    }
    
    // Group progress stats by route
    const routeStats = {
        'Без маршрута': { total: 0, completed: 0, hasMachines: false, hasScheduled: false, hasOverdue: false, hasWarning: false }
    };
    db.routes.forEach(r => {
        routeStats[r] = { total: 0, completed: 0, hasMachines: false, hasScheduled: false, hasOverdue: false, hasWarning: false };
    });
    
    db.machines.forEach(mach => {
        const a = db.addresses.find(addr => addr.id == mach.addressId);
        
        const thisMonthServices = db.history.filter(h => h.machineId == mach.id && isCurrentMonth(h.date) && isActualService(h));
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
                    if (!isAfter15) {
                        targetH1 = baseTarget + 1;
                        targetH2 = baseTarget;
                    } else {
                        targetH1 = baseTarget;
                        targetH2 = baseTarget + 1;
                    }
                }
            }
        }
        
        let isCompleted = false;
        let isOverdue = false;
        let isPending = false;
        
        if (dashboardActivePeriod === 'h1') {
            if (F > 0) {
                isCompleted = completedH1 >= targetH1;
                isOverdue = !isCompleted && isAfter15;
                isPending = !isCompleted && !isOverdue;
            } else {
                isCompleted = completedH1 > 0;
                isOverdue = false;
                isPending = completedH1 === 0;
            }
        } else if (dashboardActivePeriod === 'h2') {
            if (F > 0) {
                isCompleted = completedH2 >= targetH2;
                isOverdue = false;
                isPending = !isCompleted;
            } else {
                isCompleted = completedH2 > 0;
                isOverdue = false;
                isPending = completedH2 === 0;
            }
        } else {
            // 'month' (default)
            if (F > 0) {
                isCompleted = completedH1 >= targetH1 && completedH2 >= targetH2;
                isOverdue = !isCompleted && isAfter15 && (completedH1 < targetH1);
                isPending = !isCompleted && !isOverdue;
            } else {
                isCompleted = (completedH1 + completedH2) > 0;
                isOverdue = false;
                isPending = (completedH1 + completedH2) === 0;
            }
        }
        
        let hasWarning = false;
        if (mach.freq > 0) {
            const machineHistory = db.history.filter(h => h.machineId == mach.id && isActualService(h));
            let lastServiceDate = null;
            machineHistory.forEach(h => {
                const d = new Date(h.date);
                if (!isNaN(d.getTime())) {
                    if (!lastServiceDate || d > lastServiceDate) {
                        lastServiceDate = d;
                    }
                }
            });
            const timeSinceLast = lastServiceDate ? (now.getTime() - lastServiceDate.getTime()) : Infinity;
            const oneAndHalfWeeksMs = 1.5 * 7 * 24 * 60 * 60 * 1000;
            if (timeSinceLast >= oneAndHalfWeeksMs && !isCompleted) {
                hasWarning = true;
            }
        }
        
        // Track stats for progress bars (planned tasks vs completed tasks)
        const routeName = a ? a.route || 'Без маршрута' : 'Без маршрута';
        if (!routeStats[routeName]) {
            routeStats[routeName] = { total: 0, completed: 0, hasMachines: false, hasScheduled: false, hasOverdue: false, hasWarning: false };
        }
        routeStats[routeName].hasMachines = true;
        if (mach.freq > 0) {
            routeStats[routeName].hasScheduled = true;
        }
        if (isOverdue) {
            routeStats[routeName].hasOverdue = true;
        }
        if (hasWarning) {
            routeStats[routeName].hasWarning = true;
        }
        
        if (F > 0) {
            if (dashboardActivePeriod === 'h1') {
                routeStats[routeName].total += targetH1;
                routeStats[routeName].completed += Math.min(completedH1, targetH1);
            } else if (dashboardActivePeriod === 'h2') {
                routeStats[routeName].total += targetH2;
                routeStats[routeName].completed += Math.min(completedH2, targetH2);
            } else {
                // 'month'
                routeStats[routeName].total += (targetH1 + targetH2);
                routeStats[routeName].completed += (Math.min(completedH1, targetH1) + Math.min(completedH2, targetH2));
            }
        } else {
            // F === 0 (on request)
            if (dashboardActivePeriod === 'h1') {
                if (completedH1 > 0) {
                    routeStats[routeName].total += 1;
                    routeStats[routeName].completed += 1;
                }
            } else if (dashboardActivePeriod === 'h2') {
                if (completedH2 > 0) {
                    routeStats[routeName].total += 1;
                    routeStats[routeName].completed += 1;
                }
            } else {
                // 'month'
                const totalCompleted = completedH1 + completedH2;
                if (totalCompleted > 0) {
                    routeStats[routeName].total += 1;
                    routeStats[routeName].completed += 1;
                }
            }
        }
        
        const machItem = { mach, a, completedH1, targetH1, completedH2, targetH2, isCompleted, isOverdue, isPending };
        
        // Push to status lists only if matching the selected route filter (or if filter is empty)
        if (!dashboardSelectedRoute || routeName === dashboardSelectedRoute) {
            allList.push(machItem);
            if (isOverdue) overdueList.push(machItem);
            else if (isCompleted) completedList.push(machItem);
            else pendingList.push(machItem);
        }
    });
    
    // Render Route Progress Bars
    const routeProgressListEl = document.getElementById('routeProgressList');
    if (routeProgressListEl) {
        const activeRoutes = Object.keys(routeStats).filter(r => routeStats[r].total > 0 || routeStats[r].hasMachines).sort();
        if (activeRoutes.length === 0) {
            routeProgressListEl.innerHTML = '<p style="font-size:12px; color:var(--text-muted); padding: 4px 0; margin: 0; grid-column: 1 / -1; text-align: center;">Нет данных по маршрутам</p>';
        } else {
            const routesCardsHtml = activeRoutes.map(routeName => {
                const stats = routeStats[routeName];
                const isOnRequest = stats.hasMachines && !stats.hasScheduled;
                const percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                
                let fillBarColor = 'var(--primary-color)';
                if (percent === 100) {
                    fillBarColor = 'linear-gradient(90deg, #10b981, #059669)';
                } else if (percent > 0) {
                    fillBarColor = 'linear-gradient(90deg, #3b82f6, #2563eb)';
                } else {
                    fillBarColor = '#d1d5db';
                }
                
                const statusText = isOnRequest 
                    ? `По запросу` 
                    : `${percent}% (${stats.completed}/${stats.total})`;
                
                let statusColor = 'var(--primary-color)';
                if (isOnRequest) {
                    statusColor = 'var(--text-secondary)';
                } else if (percent === 100) {
                    statusColor = 'var(--success-color)';
                }
                
                let statusClass = '';
                if (stats.hasOverdue) {
                    statusClass = 'status-overdue';
                } else if (stats.total > 0 && stats.completed >= stats.total) {
                    statusClass = 'status-completed';
                } else if (stats.hasWarning) {
                    statusClass = 'status-warning';
                }
                
                const isActiveFilter = dashboardSelectedRoute === routeName;
                return `
                    <div class="route-progress-card ${statusClass} ${isActiveFilter ? 'active-filter' : ''}" 
                         onclick="toggleRouteFilter('${routeName.replace(/'/g, "\\'")}')"
                         style="padding: 8px 10px; border-radius: var(--radius-sm); display: flex; flex-direction: column; justify-content: center; min-height: 48px; cursor: pointer; transition: var(--transition-quick);">
                        <div style="display:flex; justify-content:space-between; margin-bottom: ${isOnRequest ? '0' : '6px'}; font-size:11px; font-weight:600; gap: 4px;">
                            <span class="route-name" style="text-overflow:ellipsis; overflow:hidden; white-space:nowrap; flex: 1;" title="${routeName}">${routeName}</span>
                            <span class="route-status-text" style="color:${statusColor}; white-space: nowrap;">${statusText}</span>
                        </div>
                        ${isOnRequest ? '' : `
                        <div style="background: rgba(0,0,0,0.06); height: 5px; border-radius: 3px; overflow: hidden; position: relative;">
                            <div style="background: ${fillBarColor}; width: ${percent}%; height: 100%; transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 3px;"></div>
                        </div>
                        `}
                    </div>
                `;
            }).join('');
            
            routeProgressListEl.innerHTML = routesCardsHtml;
        }
    }
    
    // Update count labels on tabs
    const countAllEl = document.getElementById('countAll');
    const countOverdueEl = document.getElementById('countOverdue');
    const countPendingEl = document.getElementById('countPending');
    const countCompletedEl = document.getElementById('countCompleted');
    
    if (countAllEl) countAllEl.innerText = allList.length;
    if (countOverdueEl) countOverdueEl.innerText = overdueList.length;
    if (countPendingEl) countPendingEl.innerText = pendingList.length;
    if (countCompletedEl) countCompletedEl.innerText = completedList.length;
    
    // Determine active list
    let activeList = [];
    if (dashboardActiveTab === 'all') activeList = allList;
    else if (dashboardActiveTab === 'overdue') activeList = overdueList;
    else if (dashboardActiveTab === 'completed') activeList = completedList;
    else activeList = pendingList;
    
    // Apply route filter
    let routeFilteredList = activeList;
    if (dashboardSelectedRoute) {
        routeFilteredList = activeList.filter(item => {
            const a = item.a;
            const routeName = a ? a.route || 'Без маршрута' : 'Без маршрута';
            return routeName === dashboardSelectedRoute;
        });
    }
    
    // Apply search filter
    const filteredList = routeFilteredList.filter(item => {
        const mach = item.mach;
        const a = item.a;
        const searchString = `${mach.model} ${mach.serial} ${mach.inv || ''} ${mach.employee || ''} ${a ? a.bank : ''} ${a ? a.address : ''} ${a ? a.city || 'Кишинев' : ''} ${a ? a.route || '' : ''}`.toLowerCase();
        return searchVal === '' || searchString.includes(searchVal);
    });
    
    // Apply sorting
    filteredList.sort((itemA, itemB) => {
        if (dashboardActiveSort === 'status') {
            const wA = itemA.isOverdue ? 1 : (itemA.isPending ? (itemA.mach.freq > 0 ? 2 : 3) : 4);
            const wB = itemB.isOverdue ? 1 : (itemB.isPending ? (itemB.mach.freq > 0 ? 2 : 3) : 4);
            if (wA !== wB) return wA - wB;
        }

        const routeA = (itemA.a ? itemA.a.route || '' : '').toLowerCase();
        const routeB = (itemB.a ? itemB.a.route || '' : '').toLowerCase();
        if (routeA !== routeB) return routeA.localeCompare(routeB);

        const cityA = (itemA.a ? itemA.a.city || '' : '').toLowerCase();
        const cityB = (itemB.a ? itemB.a.city || '' : '').toLowerCase();
        if (cityA !== cityB) return cityA.localeCompare(cityB);

        const bankA = (itemA.a ? itemA.a.bank || '' : '').toLowerCase();
        const bankB = (itemB.a ? itemB.a.bank || '' : '').toLowerCase();
        if (bankA !== bankB) return bankA.localeCompare(bankB);

        const addressA = (itemA.a ? itemA.a.address || '' : '').toLowerCase();
        const addressB = (itemB.a ? itemB.a.address || '' : '').toLowerCase();
        if (addressA !== addressB) return addressA.localeCompare(addressB);

        const modelA = (itemA.mach.model || '').toLowerCase();
        const modelB = (itemB.mach.model || '').toLowerCase();
        if (modelA !== modelB) return modelA.localeCompare(modelB);

        const serialA = (itemA.mach.serial || '').toLowerCase();
        const serialB = (itemB.mach.serial || '').toLowerCase();
        return serialA.localeCompare(serialB);
    });

    // ---- Geo-proximity split ----
    let nearbyList = filteredList;
    let farList = [];

    // Update geo-proximity button appearance
    const geoBtn = document.getElementById('geoProximityBtn');
    const geoRadiusRow = document.getElementById('geoRadiusRow');
    if (geoBtn) {
        if (geoProximityEnabled) {
            geoBtn.classList.add('active');
            geoBtn.title = `GPS фильтр вкл. (${geoProximityRadius >= 1000 ? (geoProximityRadius/1000).toFixed(1) + ' км' : geoProximityRadius + ' м'})`;
        } else {
            geoBtn.classList.remove('active');
            geoBtn.title = 'Включить фильтр по близости GPS';
        }
    }
    if (geoRadiusRow) geoRadiusRow.style.display = geoProximityEnabled ? 'flex' : 'none';

    if (geoProximityEnabled && currentUserLat !== null && currentUserLon !== null) {
        nearbyList = [];
        farList = [];
        filteredList.forEach(item => {
            const addr = item.a ? (item.a.address || '') : '';
            const cached = geocodeCache[addr];
            if (cached && !cached.pending && !cached.failed) {
                const dist = haversineDistance(currentUserLat, currentUserLon, cached.lat, cached.lon);
                if (dist <= geoProximityRadius) {
                    nearbyList.push({ ...item, _dist: dist });
                } else {
                    farList.push({ ...item, _dist: dist });
                }
            } else {
                // Unknown distance or pending/failed - put in far list
                farList.push(item);
                if (addr && !cached) {
                    enqueueGeocode(addr).then((res) => {
                        if (res && !res.failed) {
                            throttleRenderDashboard();
                        }
                    });
                }
            }
        });
        // Sort nearby by distance
        nearbyList.sort((a, b) => (a._dist || 0) - (b._dist || 0));
    } else if (geoProximityEnabled && currentUserLat === null) {
        // Waiting for GPS fix
        container.innerHTML = `
            <div style="text-align: center; padding: 45px 20px; color: var(--text-secondary);">
                <div style="font-size: 36px; margin-bottom: 12px; animation: pulse 1.5s infinite;">📡</div>
                <p style="font-size: 15px; font-weight: 600; margin-bottom: 6px;">Ожидание GPS...</p>
                <p style="font-size: 13px; color: var(--text-muted);">Разрешите доступ к геолокации</p>
                <button class="btn-outline" onclick="toggleGeoProximity()" style="margin-top:16px; font-size:13px;">Отключить фильтр</button>
            </div>
        `;
        return;
    }

    // Render flat list
    if (nearbyList.length === 0 && farList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 45px 20px; color: var(--text-secondary);">
                <p style="font-size: 14px; margin-bottom: 8px;">Нет машин в данном списке.</p>
                ${searchVal !== '' || dashboardSelectedRoute ? '<p style="font-size: 12px; color: var(--text-muted)">Попробуйте сбросить фильтры или изменить поиск</p>' : ''}
            </div>
        `;
    } else if (!geoProximityEnabled || farList.length === 0) {
        // Normal flat render
        container.innerHTML = nearbyList.map(item => getMachineCardHtml(item.mach, item.a, item.completedH1, item.targetH1, item.completedH2, item.targetH2, item.isCompleted, item.isOverdue, item.isPending)).join('');
    } else {
        // Split render: nearby + collapsible far section
        const nearbyHtml = nearbyList.length > 0
            ? nearbyList.map(item => getMachineCardHtml(item.mach, item.a, item.completedH1, item.targetH1, item.completedH2, item.targetH2, item.isCompleted, item.isOverdue, item.isPending)).join('')
            : `<div style="text-align:center; padding: 24px; color: var(--text-muted); font-size: 13px;">📍 Нет машин поблизости (в радиусе ${geoProximityRadius >= 1000 ? (geoProximityRadius/1000).toFixed(1) + ' км' : geoProximityRadius + ' м'})</div>`;

        const farHtml = farList.map(item => getMachineCardHtml(item.mach, item.a, item.completedH1, item.targetH1, item.completedH2, item.targetH2, item.isCompleted, item.isOverdue, item.isPending)).join('');

        container.innerHTML = `
            ${nearbyHtml}
            <details class="far-machines-details" style="margin-top: 16px;">
                <summary style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 10px 14px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 13px; font-weight: 600; color: var(--text-secondary); list-style: none; outline: none;">
                    <span style="font-size: 16px;">📍</span>
                    <span>Другие машинки вне зоны (${farList.length})</span>
                    <span style="margin-left: auto; font-size: 18px; transition: transform 0.2s;" class="far-chevron">▼</span>
                </summary>
                <div style="padding-top: 10px;">${farHtml}</div>
            </details>
        `;

        // Chevron rotation for the far machines details
        const det = container.querySelector('.far-machines-details');
        if (det) {
            det.addEventListener('toggle', () => {
                const ch = det.querySelector('.far-chevron');
                if (ch) ch.style.transform = det.open ? 'rotate(180deg)' : 'rotate(0deg)';
            });
        }
    }
}

// Render Database of addresses and machines
function renderAddresses() {
    const container = document.getElementById('addressList');
    if (!container) return;
    
    // Capture open states before re-rendering
    const openCities = Array.from(container.querySelectorAll('.addr-city-collapsible[open]')).map(el => el.getAttribute('data-city') || '');
    const openBanks = Array.from(container.querySelectorAll('.addr-bank-collapsible[open]')).map(el => el.getAttribute('data-bank-id') || '');
    const openAddresses = Array.from(container.querySelectorAll('.address-card-details[open]')).map(el => el.getAttribute('data-address-id') || '');
    
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
                                <span class="machine-sn">S/N: ${formatSeparated(m.serial)} ${m.inv ? ' | Inv: ' + formatSeparated(m.inv) : ''}${m.employee ? ' | Отв: ' + m.employee : ''}</span>
                            </div>
                            <span class="badge info" style="padding: 2px 8px; font-size:10px;">${m.freq} ТО/мес</span>
                        </div>
                    `).join('');
                }

                const isAddrOpen = openAddresses.includes(String(a.id)) ? 'open' : '';
                addressesHtml += `
                    <div class="card address-card" data-address-text="${a.bank.toLowerCase()} ${a.address.toLowerCase()} ${a.route.toLowerCase()} ${(a.city || '').toLowerCase()}" style="margin-bottom: 8px;">
                        <details class="address-card-details" data-address-id="${a.id}" ${isAddrOpen}>
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

            const bankId = `${city}_${bank}`;
            const isBankOpen = openBanks.includes(bankId) ? 'open' : '';
            banksHtml += `
                <details class="addr-bank-collapsible" data-bank-id="${bankId.replace(/"/g, '&quot;')}" ${isBankOpen}>
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

        const isCityOpen = openCities.includes(city) ? 'open' : '';
        html += `
            <details class="addr-city-collapsible" data-city="${city.replace(/"/g, '&quot;')}" ${isCityOpen}>
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
    
    const userRole = localStorage.getItem('fsm_user_role');
    const isAdmin = userRole === 'Администратор';
    
    // Populate engineer filter dropdown
    populateDropdown('historyEmployeeFilter', ['Все инженеры', ...db.employees], historySelectedEmployee);
    
    // Update weekly statistics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyRecords = db.history.filter(h => new Date(h.date) >= oneWeekAgo);
    const weeklyCount = weeklyRecords.length;
    const weeklyVerified = weeklyRecords.filter(h => isAdmin ? h.adminChecked : h.checked).length;
    
    const statsCountEl = document.getElementById('statsWeeklyCount');
    const statsVerifiedEl = document.getElementById('statsWeeklyVerified');
    if (statsCountEl) statsCountEl.innerText = `${weeklyCount} ТО`;
    if (statsVerifiedEl) statsVerifiedEl.innerText = `${weeklyVerified} подтверждено`;
    
    let filtered = db.history;
    
    // Apply engineer filter
    if (historySelectedEmployee && historySelectedEmployee !== 'Все инженеры') {
        filtered = filtered.filter(h => h.employee === historySelectedEmployee);
    }
    
    // Apply segmented control verification filters (role-dependent)
    if (historyFilterStatus === 'unverified') {
        filtered = db.history.filter(h => isAdmin ? !h.adminChecked : !h.checked);
    } else if (historyFilterStatus === 'verified') {
        filtered = db.history.filter(h => isAdmin ? h.adminChecked : h.checked);
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
        
        const userRole = localStorage.getItem('fsm_user_role');
        const isAdmin = userRole === 'Администратор';
        
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
            
            // Background color indicator based on role and confirmation status
            let itemClass = '';
            if (isAdmin && h.adminChecked) {
                itemClass = 'admin-verified-item';
            } else if (h.checked) {
                itemClass = 'verified-item';
            }
            
            // Checkbox rendering logic
            let checkboxesHtml = '';
            if (isAdmin) {
                checkboxesHtml = `
                    <input type="checkbox" class="history-check-input tooltip" title="Подтверждение мастера" ${h.checked ? 'checked' : ''} onchange="toggleHistoryChecked(${h.id}, this.checked)" onclick="event.stopPropagation();">
                    <input type="checkbox" class="history-check-input admin-check-input tooltip" title="Подтверждение администратора" ${h.adminChecked ? 'checked' : ''} onchange="toggleHistoryAdminChecked(${h.id}, this.checked)" onclick="event.stopPropagation();" style="margin-left: 6px;">
                `;
            } else {
                checkboxesHtml = `
                    <input type="checkbox" class="history-check-input tooltip" title="Подтверждено" ${h.checked ? 'checked' : ''} onchange="toggleHistoryChecked(${h.id}, this.checked)" onclick="event.stopPropagation();">
                `;
            }
            
            itemsHtml += `
                <div class="timeline-item ${itemClass}">
                    <div class="timeline-header" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${checkboxesHtml}
                            <div class="timeline-title">${model}</div>
                        </div>
                        <div class="timeline-time">${timeStr}</div>
                    </div>
                    
                    <div class="timeline-body">
                        <div class="timeline-meta-row">
                            <div class="timeline-meta-item">S/N: <strong>${formatSeparated(serial)}</strong>${inv ? ` | Inv: <strong>${formatSeparated(inv)}</strong>` : ''}</div>
                            ${h.counter ? `<div class="timeline-meta-item">Счетчик: <strong>${formatSeparated(h.counter)}</strong></div>` : ''}
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
        const hasUnchecked = items.some(item => !item.checked || (isAdmin && !item.adminChecked));
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
                db.prices = db.prices || {};
                db.prices.maintenance = db.prices.maintenance || {};
                db.prices.cities = db.prices.cities || {};
                db.prices.parts = ensureArray(db.prices.parts);
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
    
    const isAdmin = localStorage.getItem('fsm_user_role') === 'Администратор';
    const unchecked = records.filter(r => !r.checked || (isAdmin && !r.adminChecked));
    if (unchecked.length > 0) {
        doubleConfirm(`ПОДТВЕРДИТЬ все выполненные ТО за ${dayStr}`, () => {
            unchecked.forEach(r => {
                r.checked = true;
                if (isAdmin) {
                    r.adminChecked = true;
                }
            });
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
    const employeeName = localStorage.getItem('fsm_user_employee_name');
    const authModal = document.getElementById('roleAuthModal');
    
    if (!role) {
        if (authModal) authModal.style.display = 'flex';
        
        populateDropdown('userRoleSelect', ['Работник', 'Администратор'], 'Работник');
        
        // Populate employees dropdown
        const employeeOptions = [...db.employees, '✍️ Ввести имя вручную...'];
        populateDropdown('userEmployeeSelect', employeeOptions, employeeOptions[0]);
        
        // Listeners for changes in the dropdown inputs
        const roleInput = document.getElementById('userRoleSelect');
        const empInput = document.getElementById('userEmployeeSelect');
        
        // Setup toggles
        const updateAuthModalFields = () => {
            const selectedRole = roleInput.value;
            const selectedEmp = empInput.value;
            
            const empSelectGroup = document.getElementById('employeeSelectGroup');
            const empManualGroup = document.getElementById('employeeManualGroup');
            
            if (selectedRole === 'Работник') {
                if (empSelectGroup) empSelectGroup.style.display = 'block';
                if (selectedEmp === '✍️ Ввести имя вручную...') {
                    if (empManualGroup) empManualGroup.style.display = 'block';
                } else {
                    if (empManualGroup) empManualGroup.style.display = 'none';
                }
            } else {
                if (empSelectGroup) empSelectGroup.style.display = 'none';
                if (empManualGroup) empManualGroup.style.display = 'none';
            }
        };
        
        if (roleInput && empInput) {
            roleInput.onchange = updateAuthModalFields;
            empInput.onchange = updateAuthModalFields;
            updateAuthModalFields();
        }
        
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
        if (profileRoleText) {
            profileRoleText.innerText = role === 'Работник' ? `Работник: ${employeeName || 'Неизвестно'}` : 'Администратор';
        }
    }
}

function confirmRole() {
    const roleVal = document.getElementById('userRoleSelect').value || 'Работник';
    let employeeName = '';
    
    if (roleVal === 'Работник') {
        const empVal = document.getElementById('userEmployeeSelect').value;
        if (empVal === '✍️ Ввести имя вручную...') {
            employeeName = document.getElementById('userEmployeeManualInput').value.trim();
            if (!employeeName) {
                showToast('⚠️ Введите ваше имя!');
                return;
            }
            // Auto-add to dictionary if not present
            if (!db.employees.includes(employeeName)) {
                db.employees.push(employeeName);
                saveData('employees', db.employees);
            }
        } else {
            employeeName = empVal;
            if (!employeeName) {
                showToast('⚠️ Выберите сотрудника из списка!');
                return;
            }
        }
    } else {
        employeeName = 'Администратор';
    }
    
    localStorage.setItem('fsm_user_role', roleVal);
    localStorage.setItem('fsm_user_employee_name', employeeName);
    showToast(`👤 Вошли как [${roleVal}: ${employeeName}]`);
    checkUserRole();
    renderAll();
}

function logoutRole() {
    localStorage.removeItem('fsm_user_role');
    localStorage.removeItem('fsm_user_employee_name');
    showToast('👤 Выход из профиля');
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
    const activeYear = dashboardActiveDate.getFullYear();
    const activeMonth = dashboardActiveDate.getMonth();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    let isAfter15 = false;
    if (activeYear < currentYear || (activeYear === currentYear && activeMonth < currentMonth)) {
        isAfter15 = true;
    } else if (activeYear === currentYear && activeMonth === currentMonth) {
        isAfter15 = now.getDate() > 15;
    }
    
    machinesList.forEach(mach => {
        const thisMonthServices = db.history.filter(h => h.machineId == mach.id && isCurrentMonth(h.date) && isActualService(h));
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
                    if (!isAfter15) {
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
                <div class="mach-history-meta">👤 ${h.employee || 'Неизвестно'} ${h.counter ? ` | 🔢 ${formatSeparated(h.counter)}` : ''}</div>
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

function togglePartsVisibility(visible) {
    const el = document.getElementById('modalPartsContainer');
    if (el) el.style.display = visible ? 'block' : 'none';
}

function toggleReplacementVisibility(visible) {
    const el = document.getElementById('modalReplacementContainer');
    if (el) el.style.display = visible ? 'block' : 'none';
}

function toggleEditPartsVisibility(visible) {
    const el = document.getElementById('editHistPartsContainer');
    if (el) el.style.display = visible ? 'block' : 'none';
}

function toggleEditReplacementVisibility(visible) {
    const el = document.getElementById('editHistReplacementContainer');
    if (el) el.style.display = visible ? 'block' : 'none';
}

// =========================================================================
// FINANCE & PRICING AND ACTS GENERATION (ADMIN ONLY)
// =========================================================================

let activePriceTab = 'maintenance';

function openPricesModal() {
    activePriceTab = 'maintenance';
    
    // Reset add part inputs
    document.getElementById('newPartPriceName').value = '';
    document.getElementById('newPartPriceVal').value = '';
    populateDropdown('newPartPriceBank', ['Все банки', ...db.banks], 'Все банки');
    populateDropdown('newPartPriceModel', ['Все модели', ...db.models], 'Все модели');
    
    // Reset search filter and edit state
    const searchInput = document.getElementById('searchPartPrice');
    if (searchInput) searchInput.value = '';
    cancelPartPriceEdit();
    
    // Activate first tab button
    document.querySelectorAll('#pricesModal .segmented-control .segment-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById('btnPriceTab-maintenance').classList.add('active');
    
    // Switch tabs views
    document.querySelectorAll('.price-tab-content').forEach(el => el.style.display = 'none');
    document.getElementById('priceTab-maintenance').style.display = 'block';
    
    renderMaintenancePrices();
    
    document.getElementById('pricesModal').style.display = 'flex';
}

function switchPriceTab(tabId) {
    activePriceTab = tabId;
    
    document.querySelectorAll('#pricesModal .segmented-control .segment-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById('btnPriceTab-' + tabId).classList.add('active');
    
    document.querySelectorAll('.price-tab-content').forEach(el => el.style.display = 'none');
    document.getElementById('priceTab-' + tabId).style.display = 'block';
    
    if (tabId === 'maintenance') {
        renderMaintenancePrices();
    } else if (tabId === 'cities') {
        renderCityClassifications();
    } else if (tabId === 'parts') {
        renderPartsPrices();
    }
}

function renderMaintenancePrices() {
    const tbody = document.getElementById('maintenancePricesTableBody');
    if (!tbody) return;
    
    let html = '';
    const banksList = ['default', ...db.banks];
    
    banksList.forEach(bank => {
        const displayName = bank === 'default' ? '<strong>Тариф по умолчанию</strong>' : bank;
        const prices = db.prices.maintenance[bank] || { capital: 0, region: 0 };
        
        html += `
            <tr>
                <td style="padding: 8px;">${displayName}</td>
                <td style="padding: 6px; text-align: right;">
                    <input type="number" class="maint-price-input" data-bank="${bank}" data-type="capital" value="${prices.capital || ''}" style="text-align: right; width:100px;">
                </td>
                <td style="padding: 6px; text-align: right;">
                    <input type="number" class="maint-price-input" data-bank="${bank}" data-type="region" value="${prices.region || ''}" style="text-align: right; width:100px;">
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function renderCityClassifications() {
    const tbody = document.getElementById('cityClassTableBody');
    if (!tbody) return;
    
    let html = '';
    db.cities.forEach(city => {
        const currentType = db.prices.cities[city] || (city === 'Кишинев' ? 'capital' : 'region');
        
        html += `
            <tr>
                <td style="padding: 8px;">🏙️ ${city}</td>
                <td style="padding: 6px; text-align: right;">
                    <select class="city-type-select" data-city="${city}" style="width: 140px; padding: 4px; font-size: 13px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary);">
                        <option value="capital" ${currentType === 'capital' ? 'selected' : ''}>Столица</option>
                        <option value="region" ${currentType === 'region' ? 'selected' : ''}>Окраина</option>
                    </select>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function renderPartsPrices() {
    const tbody = document.getElementById('partsPricesTableBody');
    if (!tbody) return;
    
    let html = '';
    let parts = db.prices.parts || [];
    const searchQuery = (document.getElementById('searchPartPrice')?.value || '').toLowerCase().trim();
    
    if (searchQuery) {
        parts = parts.filter(p => 
            p.name.toLowerCase().includes(searchQuery) ||
            (p.model || 'Все модели').toLowerCase().includes(searchQuery) ||
            p.bank.toLowerCase().includes(searchQuery)
        );
    }
    
    if (parts.length === 0) {
        html = `<tr><td colspan="6" style="text-align: center; padding: 12px; color: var(--text-muted);">${searchQuery ? 'Ничего не найдено' : 'Прайс-лист запчастей пуст'}</td></tr>`;
    } else {
        // Sort parts by model, then bank, then name
        const sorted = [...parts].sort((a, b) => {
            const modelA = a.model || 'Все модели';
            const modelB = b.model || 'Все модели';
            if (modelA !== modelB) return modelA.localeCompare(modelB);
            if (a.bank !== b.bank) return a.bank.localeCompare(b.bank);
            return a.name.localeCompare(b.name);
        });
        
        sorted.forEach(p => {
            const model = p.model || 'Все модели';
            const currency = p.currency || 'MDL';
            html += `
                <tr>
                    <td style="padding: 8px;">${p.name}</td>
                    <td style="padding: 8px; color: var(--text-secondary);">${model}</td>
                    <td style="padding: 8px; color: var(--text-secondary);">${p.bank}</td>
                    <td style="padding: 8px; text-align: right; font-weight: 500;">${formatSeparated(p.price)} ${currency}</td>
                    <td style="padding: 6px; text-align: center;">
                        <button class="btn-outline" onclick="editPartPrice(${p.id})" style="padding: 2px 6px; font-size: 11px; min-height: 24px; margin:0; border: 1px solid var(--border-color); color: var(--text-primary);">✏️</button>
                    </td>
                    <td style="padding: 6px; text-align: center;">
                        <button class="btn-danger" onclick="deletePartPrice(${p.id})" style="padding: 2px 6px; font-size: 11px; min-height: 24px; margin:0;">🗑️</button>
                    </td>
                </tr>
            `;
        });
    }
    tbody.innerHTML = html;
}

function addPartPrice() {
    const editingIdInput = document.getElementById('editingPartPriceId');
    const editingIdVal = editingIdInput ? editingIdInput.value : '';
    const name = document.getElementById('newPartPriceName').value.trim();
    const bank = document.getElementById('newPartPriceBank').value || 'Все банки';
    const model = document.getElementById('newPartPriceModel').value || 'Все модели';
    const currency = document.getElementById('newPartPriceCurrency').value || 'EUR';
    const priceVal = document.getElementById('newPartPriceVal').value.replace(/\s/g, '');
    const price = parseFloat(priceVal);
    
    if (!name) {
        showToast('⚠️ Введите название запчасти!');
        return;
    }
    if (isNaN(price) || price < 0) {
        showToast('⚠️ Введите корректную цену!');
        return;
    }
    
    db.prices.parts = db.prices.parts || [];
    
    if (editingIdVal) {
        // Editing mode
        const id = parseInt(editingIdVal);
        const pIdx = db.prices.parts.findIndex(p => p.id == id);
        if (pIdx !== -1) {
            db.prices.parts[pIdx] = {
                id,
                name,
                bank,
                model,
                price,
                currency
            };
            showToast('💾 Изменения в детали сохранены!');
        }
        cancelPartPriceEdit();
    } else {
        // Adding mode
        db.prices.parts.push({
            id: Date.now(),
            name,
            bank,
            model,
            price,
            currency
        });
        showToast('✅ Деталь добавлена в прайс-лист!');
        // Clear name and price values
        document.getElementById('newPartPriceName').value = '';
        document.getElementById('newPartPriceVal').value = '';
    }
    
    renderPartsPrices();
}

function deletePartPrice(id) {
    db.prices.parts = (db.prices.parts || []).filter(p => p.id != id);
    renderPartsPrices();
    showToast('🗑️ Деталь удалена из прайс-листа');
}

function editPartPrice(id) {
    const p = (db.prices.parts || []).find(x => x.id == id);
    if (!p) return;
    
    document.getElementById('editingPartPriceId').value = p.id;
    document.getElementById('newPartPriceName').value = p.name;
    document.getElementById('newPartPriceVal').value = p.price;
    document.getElementById('newPartPriceCurrency').value = p.currency || 'EUR';
    
    populateDropdown('newPartPriceBank', ['Все банки', ...db.banks], p.bank);
    populateDropdown('newPartPriceModel', ['Все модели', ...db.models], p.model || 'Все модели');
    
    const addBtn = document.getElementById('btnAddPartPrice');
    if (addBtn) {
        addBtn.className = 'btn-success';
        addBtn.innerHTML = '💾 Сохранить';
    }
    
    const cancelBtn = document.getElementById('btnCancelPartPriceEdit');
    if (cancelBtn) {
        cancelBtn.style.display = 'inline-flex';
    }
}

function cancelPartPriceEdit() {
    document.getElementById('editingPartPriceId').value = '';
    document.getElementById('newPartPriceName').value = '';
    document.getElementById('newPartPriceVal').value = '';
    document.getElementById('newPartPriceCurrency').value = 'EUR';
    
    populateDropdown('newPartPriceBank', ['Все банки', ...db.banks], 'Все банки');
    populateDropdown('newPartPriceModel', ['Все модели', ...db.models], 'Все модели');
    
    const addBtn = document.getElementById('btnAddPartPrice');
    if (addBtn) {
        addBtn.className = 'btn-success';
        addBtn.innerHTML = '➕ Добавить';
    }
    
    const cancelBtn = document.getElementById('btnCancelPartPriceEdit');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
}

function savePricesSettings() {
    // 1. Save maintenance prices
    const maintenanceInputs = document.querySelectorAll('.maint-price-input');
    maintenanceInputs.forEach(input => {
        const bank = input.getAttribute('data-bank');
        const type = input.getAttribute('data-type');
        const val = parseFloat(input.value);
        
        db.prices.maintenance[bank] = db.prices.maintenance[bank] || { capital: 0, region: 0 };
        db.prices.maintenance[bank][type] = isNaN(val) ? 0 : val;
    });
    
    // 2. Save city classifications
    const citySelects = document.querySelectorAll('.city-type-select');
    citySelects.forEach(sel => {
        const city = sel.getAttribute('data-city');
        const val = sel.value;
        db.prices.cities[city] = val;
    });
    
    // 3. Save to LocalStorage & Firebase
    saveData('prices', db.prices);
    closeAllModals();
    showToast('✅ Прайс-листы успешно сохранены!');
}

// =========================================================================
// ACTS GENERATION & VIEW
// =========================================================================

function openActsModal() {
    // Populate Banks dropdown
    populateDropdown('actBankSelect', db.banks);
    
    // Generate and populate Month selector with last 12 months
    const monthsRu = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    const monthsOptions = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthsOptions.push(`${monthsRu[d.getMonth()]} ${d.getFullYear()}`);
    }
    populateDropdown('actMonthSelect', monthsOptions);
    
    // Clear preview
    document.getElementById('actReportPreviewContainer').innerHTML = `
        <p style="text-align: center; color: var(--text-muted); font-size: 14px; margin-top: 50px;">Заполните параметры выше и нажмите «Сформировать»</p>
    `;
    document.getElementById('btnPrintActBtn').style.display = 'none';
    
    document.getElementById('actsModal').style.display = 'flex';
}

function calculateMaintenanceCost(bank, city) {
    const cityType = db.prices.cities[city] || (city === 'Кишинев' ? 'capital' : 'region');
    const bankPrices = db.prices.maintenance[bank];
    if (bankPrices && bankPrices[cityType] !== undefined && bankPrices[cityType] !== 0) {
        return bankPrices[cityType];
    }
    // Fallback to default price
    const defaultPrices = db.prices.maintenance['default'];
    if (defaultPrices && defaultPrices[cityType] !== undefined) {
        return defaultPrices[cityType];
    }
    return 0;
}

function calculatePartsCost(bank, partsString, machineModel = 'Все модели') {
    if (!partsString || partsString.trim() === '') {
        return { detail: [], total: {}, totalString: '0.00 EUR' };
    }
    
    const partsArray = partsString.split(',').map(p => p.trim()).filter(p => p.length > 0);
    const detail = [];
    const totals = {};
    
    partsArray.forEach(partItem => {
        let name = partItem;
        let qty = 1;
        
        const qtyMatch = partItem.match(/(.+?)\s*[-x*]\s*(\d+)\s*(?:шт)?/i) || partItem.match(/(.+?)\s*(\d+)\s*шт/i);
        if (qtyMatch) {
            name = qtyMatch[1].trim();
            qty = parseInt(qtyMatch[2], 10);
        } else {
            const trailingQtyMatch = partItem.match(/(.+?)\s+(\d+)$/);
            if (trailingQtyMatch) {
                const candidateName = trailingQtyMatch[1].trim();
                const matchedInDb = (db.prices.parts || []).some(p => p.name.toLowerCase() === candidateName.toLowerCase());
                if (matchedInDb) {
                    name = candidateName;
                    qty = parseInt(trailingQtyMatch[2], 10);
                }
            }
        }
        
        const partInfo = getMatchedPartInfo(name, bank, machineModel);
        if (partInfo) {
            const price = partInfo.price;
            const currency = partInfo.currency || 'MDL';
            const itemTotal = price * qty;
            
            totals[currency] = (totals[currency] || 0) + itemTotal;
            
            detail.push({
                name: partInfo.name,
                price: price,
                qty: qty,
                total: itemTotal,
                currency: currency,
                found: true
            });
        } else {
            detail.push({
                name: name,
                price: 0,
                qty: qty,
                total: 0,
                currency: 'MDL',
                found: false
            });
        }
    });
    
    const sumParts = Object.keys(totals).map(curr => `${formatSeparated(totals[curr].toFixed(2))} ${curr}`);
    const totalString = sumParts.length > 0 ? sumParts.join(' + ') : '0.00 EUR';
    
    return { detail, total: totals, totalString };
}

function renderActReport() {
    const bank = document.getElementById('actBankSelect').value;
    const period = document.getElementById('actMonthSelect').value;
    
    if (!bank || !period) {
        showToast('⚠️ Выберите банк и отчетный период!');
        return;
    }
    
    // Parse Period
    const [monthName, yearStr] = period.split(' ');
    const monthsRu = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    const monthIndex = monthsRu.indexOf(monthName);
    const year = parseInt(yearStr);
    
    // Filter history records for this bank and month
    const bankMachinesIds = db.machines.filter(m => {
        const a = db.addresses.find(addr => addr.id == m.addressId);
        return a && a.bank === bank;
    }).map(m => m.id);
    
    const monthlyHistory = db.history.filter(h => {
        if (!bankMachinesIds.includes(h.machineId)) return false;
        
        const d = new Date(h.date);
        return d.getMonth() === monthIndex && d.getFullYear() === year;
    });
    
    const previewContainer = document.getElementById('actReportPreviewContainer');
    
    if (monthlyHistory.length === 0) {
        previewContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                <p style="font-size: 15px; margin-bottom: 8px;">Нет записей обслуживания за выбранный период.</p>
                <p style="font-size: 12px; color: var(--text-muted)">Убедитесь, что выполненные ТО подтверждены мастером или присутствуют в истории.</p>
            </div>
        `;
        document.getElementById('btnPrintActBtn').style.display = 'none';
        return;
    }
    
    let tableRowsHtml = '';
    let totalMaintSum = 0;
    const totalPartsSums = {};
    let itemIndex = 1;
    
    monthlyHistory.forEach(h => {
        const m = db.machines.find(mach => mach.id == h.machineId);
        const a = db.addresses.find(addr => addr.id == (m ? m.addressId : null));
        
        const dateStr = new Date(h.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const addressText = a ? `${a.city || 'Кишинев'}, ${a.address}` : 'Удаленный адрес';
        const modelSnText = m ? `📠 ${m.model}<br><span style="font-size: 11px; color: var(--text-secondary);">S/N: ${formatSeparated(h.machineSerial || m.serial)}</span>` : 'Неизвестно';
        
        // Calculate maintenance cost
        let isMaintenance = h.tasks && (h.tasks.includes('Обслуживание машинки') || h.tasks.includes('Замена машинки'));
        const city = a ? a.city || 'Кишинев' : 'Кишинев';
        const maintCost = isMaintenance ? calculateMaintenanceCost(bank, city) : 0;
        totalMaintSum += maintCost;
        
        // Calculate parts cost
        const partsInfo = calculatePartsCost(bank, h.parts, m ? m.model : 'Все модели');
        Object.keys(partsInfo.total).forEach(curr => {
            totalPartsSums[curr] = (totalPartsSums[curr] || 0) + partsInfo.total[curr];
        });
        
        // Done works string
        const worksText = h.tasks ? h.tasks.join(', ') : 'Работы';
        
        // Replaced parts HTML
        let partsHtml = '';
        if (partsInfo.detail.length > 0) {
            partsHtml = partsInfo.detail.map(p => {
                if (p.found) {
                    return `• ${p.name} x${p.qty} (${formatSeparated(p.price)} ${p.currency})`;
                } else {
                    return `<span style="background: #fff8db; color: #856404; padding: 1px 4px; border-radius: 2px; font-size:11px;" title="Деталь не найдена в прайс-листе. Цена: 0">⚠️ ${p.name} (0 MDL)</span>`;
                }
            }).join('<br>');
        } else {
            partsHtml = '<span style="color:var(--text-muted); font-size:11px;">Нет</span>';
        }
        
        // Row totals by currency
        const rowTotals = { MDL: maintCost };
        Object.keys(partsInfo.total).forEach(curr => {
            rowTotals[curr] = (rowTotals[curr] || 0) + partsInfo.total[curr];
        });
        const rowTotalStr = Object.keys(rowTotals).filter(curr => rowTotals[curr] > 0).map(curr => `${formatSeparated(rowTotals[curr].toFixed(2))} ${curr}`).join(' + ') || '0.00 MDL';
        const rowPartsTotalStr = Object.keys(partsInfo.total).map(curr => `${formatSeparated(partsInfo.total[curr].toFixed(2))} ${curr}`).join(' + ') || '0.00 MDL';
        
        tableRowsHtml += `
            <tr style="border-bottom: 1px solid #ddd; font-size: 12px;">
                <td style="padding: 6px; text-align: center; border: 1px solid #ddd;">${itemIndex++}</td>
                <td style="padding: 6px; text-align: center; border: 1px solid #ddd; white-space: nowrap;">${dateStr}</td>
                <td style="padding: 6px; border: 1px solid #ddd;">${addressText}</td>
                <td style="padding: 6px; border: 1px solid #ddd;">${modelSnText}</td>
                <td style="padding: 6px; border: 1px solid #ddd; color: var(--text-secondary);">${worksText}</td>
                <td style="padding: 6px; text-align: right; border: 1px solid #ddd; white-space: nowrap;">${formatSeparated(maintCost)} Lei</td>
                <td style="padding: 6px; border: 1px solid #ddd;">${partsHtml}</td>
                <td style="padding: 6px; text-align: right; border: 1px solid #ddd; white-space: nowrap;">${rowPartsTotalStr}</td>
                <td style="padding: 6px; text-align: right; border: 1px solid #ddd; font-weight: bold; white-space: nowrap;">${rowTotalStr}</td>
            </tr>
        `;
    });
    
    const totalPartsSumStr = Object.keys(totalPartsSums).map(curr => `${formatSeparated(totalPartsSums[curr].toFixed(2))} ${curr}`).join(' + ') || '0.00 MDL';
    
    // Grand Total string
    const grandTotals = { MDL: totalMaintSum };
    Object.keys(totalPartsSums).forEach(curr => {
        grandTotals[curr] = (grandTotals[curr] || 0) + totalPartsSums[curr];
    });
    const grandTotalStr = Object.keys(grandTotals).filter(curr => grandTotals[curr] > 0).map(curr => `${formatSeparated(grandTotals[curr].toFixed(2))} ${curr}`).join(' + ') || `${formatSeparated(totalMaintSum)} MDL`;
    
    // Act markup
    const reportHtml = `
        <div id="actReportPrintArea" style="font-family: inherit; color: #000; padding: 10px 0;">
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
                <h2 style="margin: 0 0 5px 0; font-size: 18px; text-transform: uppercase; font-weight: bold;">Акт выполненных работ</h2>
                <div style="font-size: 13px; font-weight: 500;">за отчетный период: <strong>${period}</strong></div>
            </div>
            
            <div style="margin-bottom: 15px; font-size: 13px; line-height: 1.4;">
                <div><strong>Исполнитель:</strong> Сервисная служба FSM (🛠️ Мастера обслуживания машин)</div>
                <div><strong>Заказчик:</strong> КБ "${bank}" А.О.</div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #ddd;">
                <thead>
                    <tr style="background: #f2f2f2; font-size: 11px; text-transform: uppercase;">
                        <th style="border: 1px solid #ddd; padding: 6px; text-align: center; width: 30px;">№</th>
                        <th style="border: 1px solid #ddd; padding: 6px; text-align: center; width: 70px;">Дата</th>
                        <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Адрес точки</th>
                        <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 140px;">Оборудование</th>
                        <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 120px;">Выполненные работы</th>
                        <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 85px;">Цена ТО</th>
                        <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 130px;">Запчасти</th>
                        <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 85px;">Цена запч.</th>
                        <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 90px;">Всего</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHtml}
                </tbody>
            </table>
            
            <div style="display: flex; justify-content: flex-end; margin-bottom: 30px; font-size: 14px; line-height: 1.6;">
                <div style="width: 320px; border: 1px solid #000; padding: 12px; border-radius: var(--radius-sm); background: #fdfdfd;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <span>Итого за обслуживание:</span>
                        <strong>${formatSeparated(totalMaintSum)} Lei</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px; border-bottom: 1px dashed #ccc; padding-bottom:4px;">
                        <span>Итого за запчасти:</span>
                        <strong>${totalPartsSumStr}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size: 16px; font-weight: bold; margin-top:4px;">
                        <span>Всего к оплате:</span>
                        <span style="color: var(--success-color);">${grandTotalStr}</span>
                    </div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; font-size: 13px; border-top: 1px solid #ddd; padding-top: 20px;">
                <div>
                    <div>От Исполнителя:</div>
                    <div style="margin-top: 30px; border-bottom: 1px solid #000; width: 200px; height: 20px;"></div>
                    <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">(подпись, фамилия, М.П.)</div>
                </div>
                <div>
                    <div>От Заказчика:</div>
                    <div style="margin-top: 30px; border-bottom: 1px solid #000; width: 200px; height: 20px;"></div>
                    <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">(подпись, фамилия, М.П.)</div>
                </div>
            </div>
        </div>
    `;
    
    previewContainer.innerHTML = reportHtml;
    document.getElementById('btnPrintActBtn').style.display = 'block';
}

function printGeneratedAct() {
    window.print();
}

let currentSelectedParts = {
    modal: [],
    editHist: []
};

function normalizeModelName(str) {
    if (!str) return '';
    const val = str.toLowerCase().trim();
    const cyrToLat = {
        'а': 'a',
        'в': 'b',
        'с': 'c',
        'е': 'e',
        'н': 'h',
        'к': 'k',
        'м': 'm',
        'о': 'o',
        'р': 'p',
        'т': 't',
        'х': 'x',
        'у': 'y',
        'і': 'i',
        'ѕ': 's'
    };
    return val.split('').map(char => cyrToLat[char] || char).join('');
}

function isPartModelMatch(pModelStr, mModelStr) {
    const rawPModel = (pModelStr || 'Все модели').toLowerCase().trim();
    if (rawPModel === 'все модели' || rawPModel === 'vse modeli' || rawPModel === 'all' || rawPModel === 'all models') return true;
    
    const pModel = normalizeModelName(pModelStr || '');
    const mModel = normalizeModelName(mModelStr || '');
    
    return mModel.includes(pModel) || 
           pModel.includes(mModel) || 
           (pModel.includes('c1') && mModel.includes('c1')) || 
           (pModel.includes('c2') && mModel.includes('c2'));
}

function setupPartsSelector(prefix, machineModel, bankName, initialText) {
    const select = document.getElementById(prefix + 'PartsSelect');
    if (!select) return;
    
    // Parse current parts string
    currentSelectedParts[prefix] = parsePartsString(initialText, bankName, machineModel);
    renderSelectedPartsList(prefix, bankName, machineModel);
    
    // Filter compatible parts
    const compatibleParts = (db.prices.parts || []).filter(p => {
        return isPartModelMatch(p.model, machineModel);
    });
    
    // Deduplicate by name
    const uniquePartNames = [];
    compatibleParts.forEach(p => {
        if (!uniquePartNames.includes(p.name)) {
            uniquePartNames.push(p.name);
        }
    });
    uniquePartNames.sort((a, b) => a.localeCompare(b, 'ru'));
    
    // Populate dropdown options
    select.innerHTML = '<option value="">-- Выберите деталь --</option>';
    uniquePartNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.innerText = name;
        select.appendChild(option);
    });
    
    // Reset inputs
    document.getElementById(prefix + 'PartsQty').value = 1;
}

function parsePartsString(partsString, bankName, machineModel) {
    if (!partsString || partsString.trim() === '') return [];
    
    const partsArray = partsString.split(',').map(p => p.trim()).filter(p => p.length > 0);
    const result = [];
    
    partsArray.forEach(partItem => {
        let name = partItem;
        let qty = 1;
        
        const qtyMatch = partItem.match(/(.+?)\s*[-x*]\s*(\d+)\s*(?:шт)?/i) || partItem.match(/(.+?)\s*(\d+)\s*шт/i);
        if (qtyMatch) {
            name = qtyMatch[1].trim();
            qty = parseInt(qtyMatch[2], 10);
        } else {
            const trailingQtyMatch = partItem.match(/(.+?)\s+(\d+)$/);
            if (trailingQtyMatch) {
                const candidateName = trailingQtyMatch[1].trim();
                const matchedInDb = (db.prices.parts || []).some(p => p.name.toLowerCase() === candidateName.toLowerCase());
                if (matchedInDb) {
                    name = candidateName;
                    qty = parseInt(trailingQtyMatch[2], 10);
                }
            }
        }
        
        result.push({ name, qty });
    });
    
    return result;
}

function renderSelectedPartsList(prefix, bankName, machineModel) {
    const listEl = document.getElementById(prefix + 'PartsSelectedList');
    if (!listEl) return;
    
    const parts = currentSelectedParts[prefix];
    if (parts.length === 0) {
        listEl.innerHTML = '<div style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 4px;">Нет добавленных деталей</div>';
        updatePartsTextareaAndPreview(prefix, bankName, machineModel);
        return;
    }
    
    let html = '';
    parts.forEach((item, index) => {
        // Find price to display
        const partInfo = getMatchedPartInfo(item.name, bankName, machineModel);
        const priceText = partInfo ? `${formatSeparated(partInfo.price)} ${partInfo.currency}` : 'Цена не найдена';
        
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); padding: 4px 8px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 12px; margin-bottom: 4px;">
                <span><strong>${item.name}</strong> x ${item.qty} <span style="color: var(--text-muted); margin-left: 4px;">(${priceText} за шт.)</span></span>
                <button type="button" class="btn-danger" onclick="removeSelectedPartFromReport('${prefix}', ${index}, '${bankName}', '${machineModel.replace(/'/g, "\\'")}')" style="padding: 2px 6px; font-size: 10px; min-height: auto; margin: 0; width: auto; height: auto; display: inline-flex;">🗑️</button>
            </div>
        `;
    });
    listEl.innerHTML = html;
    
    updatePartsTextareaAndPreview(prefix, bankName, machineModel);
}

function getMatchedPartInfo(partName, bankName, machineModel) {
    const cleanName = partName.toLowerCase().trim();
    // Try bank match and model match
    let matched = (db.prices.parts || []).find(p => {
        return p.name.toLowerCase().trim() === cleanName && 
               p.bank === bankName && 
               isPartModelMatch(p.model, machineModel);
    });
    
    if (!matched) {
        // Try "Все банки" match
        matched = (db.prices.parts || []).find(p => {
            return p.name.toLowerCase().trim() === cleanName && 
                   p.bank === 'Все банки' && 
                   isPartModelMatch(p.model, machineModel);
        });
    }
    
    return matched || null;
}

function addSelectedPartToReport(prefix) {
    const select = document.getElementById(prefix + 'PartsSelect');
    const qtyInput = document.getElementById(prefix + 'PartsQty');
    if (!select || !qtyInput) return;
    
    const name = select.value;
    const qty = parseInt(qtyInput.value, 10);
    
    if (!name) {
        showToast('⚠️ Выберите деталь из списка!');
        return;
    }
    if (isNaN(qty) || qty < 1) {
        showToast('⚠️ Введите корректное количество!');
        return;
    }
    
    // Get machine and bank to pass to renderer
    let bankName = 'Все банки';
    let machineModel = 'Все модели';
    
    if (prefix === 'modal') {
        const machineId = document.getElementById('modalMachineId').value;
        const m = db.machines.find(x => x.id == machineId);
        const a = m ? db.addresses.find(x => x.id == m.addressId) : null;
        if (m) machineModel = m.model;
        if (a) bankName = a.bank;
    } else {
        const editHistId = document.getElementById('editHistId').value;
        const h = db.history.find(x => x.id == editHistId);
        const m = h ? db.machines.find(x => x.id == h.machineId) : null;
        const a = m ? db.addresses.find(x => x.id == m.addressId) : null;
        if (m) machineModel = m.model;
        if (a) bankName = a.bank;
    }
    
    const parts = currentSelectedParts[prefix];
    const existing = parts.find(p => p.name === name);
    if (existing) {
        existing.qty += qty;
    } else {
        parts.push({ name, qty });
    }
    
    renderSelectedPartsList(prefix, bankName, machineModel);
    
    // Reset selection
    select.value = '';
    qtyInput.value = 1;
}

function removeSelectedPartFromReport(prefix, index, bankName, machineModel) {
    currentSelectedParts[prefix].splice(index, 1);
    renderSelectedPartsList(prefix, bankName, machineModel);
}

function updatePartsTextareaAndPreview(prefix, bankName, machineModel) {
    const textarea = document.getElementById(prefix === 'modal' ? 'modalParts' : 'editHistParts');
    const preview = document.getElementById(prefix + 'PartsCostPreview');
    if (!textarea) return;
    
    const parts = currentSelectedParts[prefix];
    const textValue = parts.map(p => `${p.name} - ${p.qty} шт`).join(', ');
    
    // Avoid circular event update if they are editing textarea manually
    if (textarea.value !== textValue) {
        textarea.value = textValue;
    }
    
    // Update live preview sum
    if (preview) {
        const costSums = {};
        parts.forEach(item => {
            const partInfo = getMatchedPartInfo(item.name, bankName, machineModel);
            if (partInfo) {
                const currency = partInfo.currency || 'MDL';
                costSums[currency] = (costSums[currency] || 0) + (partInfo.price * item.qty);
            }
        });
        
        const sumParts = Object.keys(costSums).map(curr => `${formatSeparated(costSums[curr].toFixed(2))} ${curr}`);
        preview.innerText = sumParts.length > 0 ? sumParts.join(' + ') : '0.00 EUR';
    }
}

// Bind global window events
window.addSelectedPartToReport = addSelectedPartToReport;
window.removeSelectedPartFromReport = removeSelectedPartFromReport;

window.confirmRole = confirmRole;
window.logoutRole = logoutRole;
window.togglePrevServiceHistory = togglePrevServiceHistory;
window.togglePartsVisibility = togglePartsVisibility;
window.toggleReplacementVisibility = toggleReplacementVisibility;
window.toggleEditPartsVisibility = toggleEditPartsVisibility;
window.toggleEditReplacementVisibility = toggleEditReplacementVisibility;
window.openPricesModal = openPricesModal;
window.switchPriceTab = switchPriceTab;
window.addPartPrice = addPartPrice;
window.deletePartPrice = deletePartPrice;
window.editPartPrice = editPartPrice;
window.cancelPartPriceEdit = cancelPartPriceEdit;
window.savePricesSettings = savePricesSettings;
window.openActsModal = openActsModal;
window.renderActReport = renderActReport;
window.printGeneratedAct = printGeneratedAct;



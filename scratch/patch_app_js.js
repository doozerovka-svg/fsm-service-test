const fs = require('fs');

const filePath = "C:/Users/user/.gemini/antigravity/scratch/fsm-service-test/www/app.js";
let content = fs.readFileSync(filePath, "utf-8");

// 1. Add openStandardServiceModal and update openServiceModal
const newOpenService = `function openStandardServiceModal(machineId) {
    const m = db.machines.find(x => x.id == machineId);
    if (!m) return;
    const a = db.addresses.find(x => x.id == m.addressId);
    if (!a) return;
    
    document.getElementById('stdMachineId').value = machineId;
    document.getElementById('stdTitle').innerText = \`ТО: \${m.model}\`;
    document.getElementById('stdSubtitle').innerText = \`\${a.bank}, \${a.address}\\nS/N: \${m.serial}\`;
    
    document.getElementById('stdDate').value = getLocalDatetimeString(new Date());
    document.getElementById('stdCounter').value = '';
    document.getElementById('stdNotes').value = '';
    document.getElementById('stdParts').value = '';
    setupPartsSelector('std', m.model, a.bank, '');
    
    document.getElementById('stdWorkCheckMaintenance').checked = true;
    document.getElementById('stdWorkCheckRepair').checked = false;
    document.getElementById('stdWorkCheckReplace').checked = false;
    document.getElementById('stdPartsContainer').style.display = 'none';
    document.getElementById('stdReplacementContainer').style.display = 'none';
    document.getElementById('stdReplacementSerial').value = '';
    
    const currentEmp = localStorage.getItem('fsm_user_employee_name') || m.employee || '';
    populateDropdown('stdEmployee', db.employees, currentEmp);
    
    renderMachineHistory(m.id, 'stdPrevServiceHistoryList');
    const prevHistoryContainer = document.getElementById('stdPrevServiceHistoryContainer');
    if (prevHistoryContainer) prevHistoryContainer.style.display = 'none';
    const btnToggle = document.getElementById('stdTogglePrevService');
    if (btnToggle) btnToggle.innerText = '📜 Прошлые ремонты оборудования';
    
    document.getElementById('standardServiceModal').style.display = 'flex';
}

function openServiceModal(machineId) {
    if (!isSimpleMode) {
        return openStandardServiceModal(machineId);
    }`;
content = content.replace(/function openServiceModal\(machineId\) \{/g, newOpenService);

// 2. Update saveService signature and body
const oldSaveService = `function saveService() {
    const machineId = parseInt(document.getElementById('modalMachineId').value);
    const dateVal = document.getElementById('modalDate').value;
    let counter = document.getElementById('modalCounter').value.replace(/\\s/g, '');
    const employee = document.getElementById('modalEmployee').value;
    let parts = document.getElementById('modalParts').value.trim();
    let notes = document.getElementById('modalNotes').value.trim();
    let tasks = [];
    document.querySelectorAll('.work-check:checked').forEach(cb => tasks.push(cb.value));`;
    
const newSaveService = `function saveService(isStandard = false) {
    const pfx = isStandard ? 'std' : 'modal';
    const modalId = isStandard ? 'standardServiceModal' : 'serviceModal';
    const machineId = parseInt(document.getElementById(pfx + 'MachineId').value);
    const dateVal = document.getElementById(pfx + 'Date').value;
    let counter = document.getElementById(pfx + 'Counter').value.replace(/\\s/g, '');
    const employee = document.getElementById(pfx + 'Employee').value;
    let parts = document.getElementById(pfx + 'Parts').value.trim();
    let notes = document.getElementById(pfx + 'Notes').value.trim();
    let tasks = [];
    document.querySelectorAll(\`#\${modalId} .work-check:checked\`).forEach(cb => tasks.push(cb.value));`;
content = content.replace(oldSaveService, newSaveService);

// Also in saveService: replace modalReplacementSerial with pfx + 'ReplacementSerial'
content = content.replace(/document.getElementById\('modalReplacementSerial'\).value/g, "document.getElementById(pfx + 'ReplacementSerial').value");


// 3. Update togglePrevServiceHistory
const oldTogglePrev = `function togglePrevServiceHistory() {
    const container = document.getElementById('prevServiceHistoryContainer');
    const btn = document.getElementById('btnTogglePrevService');`;
const newTogglePrev = `function togglePrevServiceHistory(isStd = false) {
    const container = document.getElementById(isStd ? 'stdPrevServiceHistoryContainer' : 'prevServiceHistoryContainer');
    const btn = document.getElementById(isStd ? 'stdTogglePrevService' : 'btnTogglePrevService');`;
content = content.replace(oldTogglePrev, newTogglePrev);

// 4. Update togglePartsVisibility
const oldToggleParts = `function togglePartsVisibility(visible) {
    const partsGroup = document.getElementById('modalPartsContainer');`;
const newToggleParts = `function togglePartsVisibility(visible, isStd = false) {
    const partsGroup = document.getElementById(isStd ? 'stdPartsContainer' : 'modalPartsContainer');`;
content = content.replace(oldToggleParts, newToggleParts);

// 5. Update toggleReplacementVisibility
const oldToggleRep = `function toggleReplacementVisibility(visible) {
    const el = document.getElementById('modalReplacementContainer');`;
const newToggleRep = `function toggleReplacementVisibility(visible, isStd = false) {
    const el = document.getElementById(isStd ? 'stdReplacementContainer' : 'modalReplacementContainer');`;
content = content.replace(oldToggleRep, newToggleRep);

fs.writeFileSync(filePath, content);
console.log("Done");

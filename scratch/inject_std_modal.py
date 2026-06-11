import os

file_path = "C:/Users/user/.gemini/antigravity/scratch/fsm-service-test/www/index.html"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_modal = """
    <!-- Модальное окно: Выполнение ТО (Стандартный режим) -->
    <div id="standardServiceModal" class="modal">
        <div class="modal-backdrop" onclick="closeAllModals()"></div>
        <div class="modal-content">
            <span class="close-btn" onclick="closeAllModals()">&times;</span>
            <h3 id="stdTitle">Выполнение ТО</h3>
            <p id="stdSubtitle" class="modal-subtitle"></p>
            <input type="hidden" id="stdMachineId">
            
            <div class="form-group">
                <label for="stdDate">Дата и время ТО</label>
                <input type="datetime-local" id="stdDate" class="custom-input">
            </div>

            <div class="form-group">
                <label for="stdCounter">Счетчик банкнот (оставьте пустым для автозаполнения)</label>
                <input type="text" inputmode="numeric" id="stdCounter" placeholder="Введите значение со счетчика" class="custom-input">
            </div>

            <div class="form-group">
                <label for="stdEmployee">Выполнил работу</label>
                <div class="custom-select-wrapper" id="wrapper-stdEmployee">
                    <input type="hidden" id="stdEmployee">
                </div>
            </div>
            
            <div class="form-group">
                <label>Вид работы</label>
                <div class="checkbox-group">
                    <label class="custom-checkbox">
                        <input type="checkbox" class="work-check" id="stdWorkCheckMaintenance" value="Обслуживание машинки" checked>
                        <span class="checkmark"></span>
                        <span class="checkbox-label">Обслуживание машинки</span>
                    </label>
                    <label class="custom-checkbox">
                        <input type="checkbox" class="work-check" id="stdWorkCheckRepair" value="Ремонт машинки" onchange="togglePartsVisibility(this.checked, true)">
                        <span class="checkmark"></span>
                        <span class="checkbox-label">Ремонт машинки</span>
                    </label>
                    <label class="custom-checkbox">
                        <input type="checkbox" class="work-check" id="stdWorkCheckReplace" value="Замена машинки" onchange="toggleReplacementVisibility(this.checked, true)">
                        <span class="checkmark"></span>
                        <span class="checkbox-label">Замена машинки</span>
                    </label>
                </div>
            </div>
            
            <div class="form-group" id="stdPartsContainer" style="display: none;">
                <label>Использованные запчасти</label>
                <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-end;">
                    <div style="flex: 2;">
                        <label style="font-size: 11px; margin-bottom: 2px; font-weight: normal; color: var(--text-secondary);">Выберите деталь</label>
                        <select id="stdPartsSelect" class="custom-input" style="height: 36px; padding: 4px; font-size: 13px; margin: 0; width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-input); color: var(--text-primary);"></select>
                    </div>
                    <div style="width: 70px;">
                        <label style="font-size: 11px; margin-bottom: 2px; font-weight: normal; color: var(--text-secondary);">Кол-во</label>
                        <input type="number" id="stdPartsQty" value="1" min="1" max="100" class="custom-input" style="height: 36px; text-align: center; padding: 4px; margin: 0; width: 100%;">
                    </div>
                    <button type="button" class="btn-outline" onclick="addSelectedPartToReport('std')" style="height: 36px; padding: 0 12px; margin: 0; min-height: auto; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">➕</button>
                </div>
                <div id="stdPartsSelectedList" style="margin-bottom: 8px; display: flex; flex-direction: column; gap: 4px; max-height: 120px; overflow-y: auto; padding: 6px; border: 1px dashed var(--border-color); border-radius: var(--radius-sm); background: rgba(0,0,0,0.01);"></div>
                <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px; color: var(--success-color);">
                    Стоимость запчастей: <span id="stdPartsCostPreview">0.00 EUR</span>
                </div>
                <textarea id="stdParts" rows="2" placeholder="Нажмите кнопку + выше для добавления деталей, либо перечислите через запятую..." class="custom-textarea"></textarea>
            </div>

            <div class="form-group" id="stdReplacementContainer" style="display: none;">
                <label for="stdReplacementSerial">Новый серийный № (S/N)</label>
                <input type="text" id="stdReplacementSerial" placeholder="Новый S/N" class="custom-input" style="width: 100%; box-sizing: border-box;">
            </div>

            <div class="form-group">
                <label for="stdNotes">Заметки / Требуется ремонт</label>
                <textarea id="stdNotes" rows="2" placeholder="Что нужно заменить?" class="custom-textarea"></textarea>
            </div>
            
            <button class="btn-success btn-full" onclick="saveService(true)">✅ Сохранить ТО</button>
            
            <div style="margin-top: 15px; border-top: 1px solid var(--border-color); padding-top: 15px;">
                <button class="btn-outline btn-full" id="stdTogglePrevService" onclick="togglePrevServiceHistory(true)" style="font-size:12px; padding:6px; min-height: 32px; margin-top:0;">📜 Прошлые ремонты оборудования</button>
                <div id="stdPrevServiceHistoryContainer" style="display: none; margin-top: 10px; max-height: 160px; overflow-y: auto; padding: 8px; border: 1px dashed var(--border-color); border-radius: var(--radius-sm); background: rgba(0,0,0,0.01);">
                    <div id="stdPrevServiceHistoryList" style="display: flex; flex-direction: column; gap: 6px;"></div>
                </div>
            </div>
        </div>
    </div>
"""

out_lines = []
for i, line in enumerate(lines):
    if "<!-- Модальное окно: Выполнение ТО -->" in line:
        out_lines.append(new_modal + "\n")
    out_lines.append(line)

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(out_lines)

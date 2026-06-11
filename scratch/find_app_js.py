with open(r"C:\Users\user\.gemini\antigravity\scratch\fsm-service-test\www\app.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "modalPartsSelect" in line or "editHistPartsSelect" in line or "populatePartsSelect" in line or "partsSelect" in line or "defaultBpsParts" in line:
        print(f"{i+1}: {line.strip()}")

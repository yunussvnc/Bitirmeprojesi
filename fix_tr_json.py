import json

file_path = "apps/mobile/src/locales/tr.json"

with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

for key in ["terms_body", "privacy_body"]:
    text = data["legal_documents"][key]
    text = text.replace("Son Güncelleme Tarihi: [Tarih]\n\n", "")
    data["legal_documents"][key] = text

with open(file_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Fixed tr.json successfully")

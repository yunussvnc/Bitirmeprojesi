@echo off
REM Fine-tuning Hızlı Başlangıç Scripti (Windows)

echo 🚀 Fine-tuning Hızlı Başlangıç
echo ================================
echo.

REM 1. Veri hazırla
echo 1️⃣ Veri hazırlanıyor...
python scripts\prepare_training_data.py

if errorlevel 1 (
    echo ❌ Veri hazırlama başarısız!
    exit /b 1
)

echo.
echo 2️⃣ Fine-tuning başlatılıyor...
echo    (Bu işlem GPU varsa 15-30 dakika, CPU'da 2-4 saat sürebilir)
echo.

REM 2. Fine-tuning başlat
python scripts\fine_tune_model.py --model Qwen/Qwen2-1.5B-Instruct --output models/fine_tuned --epochs 3 --batch-size 4

if errorlevel 1 (
    echo ❌ Fine-tuning başarısız!
    exit /b 1
)

echo.
echo 3️⃣ Fine-tuned model test ediliyor...
python scripts\test_fine_tuned.py --model models/fine_tuned

echo.
echo ✅ Fine-tuning tamamlandı!
echo.
echo Fine-tuned modeli kullanmak için .env dosyasında:
echo   LLM_PROVIDER=huggingface
echo   HUGGINGFACE_MODEL=./models/fine_tuned
echo.

pause


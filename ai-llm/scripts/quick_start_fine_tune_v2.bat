@echo off
REM ============================================================
REM FAZ 3.1: GEMMA FINE-TUNING QUICK START (Windows)
REM ============================================================

echo.
echo ============================================================
echo   FAZ 3.1: GEMMA 2-2B FINE-TUNING
echo   LoRA/QLoRA ile Parameter-Efficient Fine-Tuning
echo ============================================================
echo.

REM Check if virtual environment exists
if not exist ".venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment bulunamadi: .venv
    echo [INFO] Lutfen once virtual environment olusturun:
    echo        python -m venv .venv
    echo        .venv\Scripts\activate
    echo        pip install -r requirements.txt
    pause
    exit /b 1
)

REM Activate virtual environment
echo [1/5] Virtual environment aktif ediliyor...
call .venv\Scripts\activate.bat
echo      OK: Virtual environment aktif
echo.

REM Check if backend is running
echo [2/5] Backend baglantisi kontrol ediliyor...
curl -s http://localhost:8080/api/info >nul 2>&1
if errorlevel 1 (
    echo      WARNING: Backend'e baglanilamiyor!
    echo.
    echo      Backend'i baslatmak icin yeni terminal'de:
    echo        cd ai-llm
    echo        .venv\Scripts\activate
    echo        python demo_backend_v2.py
    echo.
    choice /C YN /M "Backend'i simdi baslatmak ister misiniz"
    if errorlevel 2 goto skip_backend
    
    echo      Backend baslat iliyor (yeni pencere)...
    start "Mekan Backend" cmd /k "cd /d %CD% && .venv\Scripts\activate && python demo_backend_v2.py"
    echo      Backend baslatildi! 10 saniye bekleniyor...
    timeout /t 10 /nobreak >nul
    echo.
)
:skip_backend
echo      OK: Backend haziir
echo.

REM Step 1: Prepare training data
echo [3/5] Training data hazirlaniyor...
echo      Script: scripts\prepare_training_data_v2.py
echo.

python scripts\prepare_training_data_v2.py
if errorlevel 1 (
    echo.
    echo [ERROR] Training data hazirlama basarisiz!
    pause
    exit /b 1
)

echo.
echo      OK: Training data hazir
echo      Dosya: data\processed\training_data_v2.json
echo.
pause

REM Step 2: Fine-tune model
echo [4/5] Fine-tuning baslatiliyor...
echo      Script: scripts\fine_tune_gemma_lora.py
echo.
echo ============================================================
echo   UYARI: Bu islem uzun surebilir!
echo   - GPU (8GB): ~30-45 dakika
echo   - CPU: ~4-6 saat
echo.
echo   Training sirasinda:
echo   - Loss degerlerini izleyin (dusmeli)
echo   - VRAM kulanimini kontrol edin (nvidia-smi)
echo   - Herhangi bir hata olursa Ctrl+C ile durdurun
echo ============================================================
echo.
pause

python scripts\fine_tune_gemma_lora.py
if errorlevel 1 (
    echo.
    echo [ERROR] Fine-tuning basarisiz!
    echo [INFO] Olasi sorunlar:
    echo        - CUDA out of memory: BATCH_SIZE dusur
    echo        - Import error: pip install -r requirements.txt
    echo        - Training data yok: Adim 3'u tekrar calistir
    pause
    exit /b 1
)

echo.
echo      OK: Fine-tuning tamamlandi!
echo      Model: models\gemma-2-2b-mekan-lora\
echo.
pause

REM Step 3: Test fine-tuned model
echo [5/5] Fine-tuned model test ediliyor...
echo      Script: scripts\test_fine_tuned_lora.py
echo.

python scripts\test_fine_tuned_lora.py
if errorlevel 1 (
    echo.
    echo [WARNING] Test basarisiz!
    echo [INFO] Model yine de kaydedilmis olabilir.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   TAMAMLANDI!
echo ============================================================
echo.
echo   Fine-tuned model kayit edildi:
echo     models\gemma-2-2b-mekan-lora\
echo.
echo   Sonraki adimlar:
echo     1. Test sonuclarini inceleyin
echo     2. Model'i backend'e entegre edin
echo     3. Production'da test edin
echo.
echo   Dokumantasyon:
echo     docs\FINE_TUNING_GUIDE_V2.md
echo.
echo ============================================================
pause

#!/usr/bin/env python3
"""
Önce mevcut mekanları temizle, sonra gerçek zincir mekanları ekle
"""

import sys
import os
import requests

# Backend dizinine ekle
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

try:
    from database import SessionLocal
    import models
    
    # Backend API URL
    BACKEND_URL = "http://localhost:8000"
    
    def clear_all_places():
        """Veritabanındaki tüm mekanları sil"""
        db = SessionLocal()
        try:
            count = db.query(models.Place).delete()
            db.commit()
            print(f"🗑️  {count} mekan silindi")
            return True
        except Exception as e:
            print(f"❌ Mekanlar silinirken hata: {e}")
            db.rollback()
            return False
        finally:
            db.close()
    
    def main():
        print("🧹 Mevcut mekanlar temizleniyor...")
        if clear_all_places():
            print("✅ Temizleme tamamlandı\n")
            print("📝 Şimdi gerçek zincir mekanları eklemek için:")
            print("   cd backend/scripts")
            print("   python3 add_istanbul_places.py")
        else:
            print("❌ Temizleme başarısız")
    
    if __name__ == "__main__":
        main()
except ImportError as e:
    print(f"❌ Import hatası: {e}")
    print("Backend dizininde olduğunuzdan emin olun ve venv'i aktif edin.")

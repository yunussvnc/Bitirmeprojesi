"""
Veritabanına photo_url ve video_url kolonlarını ekleyen migration scripti
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import sqlite3

def add_media_columns():
    """places tablosuna photo_url ve video_url kolonlarını ekle"""
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'sqlite.db')
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # photo_url kolonunu ekle
        try:
            cursor.execute("ALTER TABLE places ADD COLUMN photo_url TEXT")
            print("✅ photo_url kolonu eklendi")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("ℹ️  photo_url kolonu zaten mevcut")
            else:
                raise
        
        # video_url kolonunu ekle
        try:
            cursor.execute("ALTER TABLE places ADD COLUMN video_url TEXT")
            print("✅ video_url kolonu eklendi")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("ℹ️  video_url kolonu zaten mevcut")
            else:
                raise
        
        conn.commit()
        print("\n✅ Migration başarılı!")
        
    except Exception as e:
        print(f"❌ Hata: {str(e)}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Veritabanı migration başlatılıyor...\n")
    add_media_columns()

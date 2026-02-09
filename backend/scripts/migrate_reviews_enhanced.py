"""
Review tablosunu Google Yorumlar tarzına genişleten migration
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import sqlite3

def migrate_reviews_table():
    """Review tablosuna yeni kolonlar ekle ve ReviewMedia tablosu oluştur"""
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'sqlite.db')
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🚀 Review tablosu migration başlatılıyor...\n")
        
        # Review tablosuna yeni kolonlar ekle
        new_columns = [
            ("updated_at", "TIMESTAMP"),
            ("visit_date", "TIMESTAMP"),
            ("visit_type", "TEXT"),
            ("spent_amount", "REAL"),
            ("spent_currency", "TEXT DEFAULT 'TRY'"),
            ("wait_time_minutes", "INTEGER"),
            ("ordered_items", "TEXT"),
            ("food_rating", "INTEGER"),
            ("service_rating", "INTEGER"),
            ("atmosphere_rating", "INTEGER"),
            ("value_rating", "INTEGER"),
            ("cleanliness_rating", "INTEGER"),
            ("helpful_count", "INTEGER DEFAULT 0"),
            ("report_count", "INTEGER DEFAULT 0"),
            ("owner_response", "TEXT"),
            ("owner_response_at", "TIMESTAMP"),
        ]
        
        for col_name, col_type in new_columns:
            try:
                cursor.execute(f"ALTER TABLE reviews ADD COLUMN {col_name} {col_type}")
                print(f"✅ {col_name} kolonu eklendi")
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e).lower():
                    print(f"ℹ️  {col_name} kolonu zaten mevcut")
                else:
                    raise
        
        # ReviewMedia tablosunu oluştur
        print("\n📸 ReviewMedia tablosu oluşturuluyor...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS review_media (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                review_id INTEGER NOT NULL,
                media_type TEXT NOT NULL,
                media_url TEXT NOT NULL,
                thumbnail_url TEXT,
                width INTEGER,
                height INTEGER,
                file_size INTEGER,
                duration_seconds INTEGER,
                order_index INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (review_id) REFERENCES reviews (id) ON DELETE CASCADE
            )
        """)
        print("✅ ReviewMedia tablosu oluşturuldu")
        
        # Index oluştur
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_review_media_review_id 
            ON review_media(review_id)
        """)
        print("✅ ReviewMedia index'i oluşturuldu")
        
        conn.commit()
        print("\n✅ Migration başarılı!")
        
    except Exception as e:
        print(f"❌ Hata: {str(e)}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_reviews_table()

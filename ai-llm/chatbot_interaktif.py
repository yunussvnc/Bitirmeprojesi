"""
İnteraktif Chatbot Arayüzü - Konum Bazlı Mekan Önerisi
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

os.environ['LLM_PROVIDER'] = 'huggingface'
os.environ['QDRANT_URL'] = 'http://localhost:6333'

from src.rag.retriever import RAGRetriever
from src.rag.generator import RAGGenerator
from review_analyzer import fast_extract_insights
import math
import time

class MekanChatbot:
    def __init__(self):
        """Chatbot'u başlat"""
        print("\n" + "="*80)
        print(" "*25 + "MEKAN ONERI CHATBOT")
        print("="*80 + "\n")
        print("[*] Sistem baslatiliyor...")
        
        self.retriever = RAGRetriever()
        
        # Generator'ı opsiyonel yap
        try:
            self.generator = RAGGenerator()
            self.has_llm = True
            print("[+] LLM analizi etkin (Gemma 2)")
        except Exception as e:
            self.generator = None
            self.has_llm = False
            print("[!] LLM analizi devre disi (Model yuklenemedi)")
        
        print("[+] Chatbot hazir!\n")
        
        # Varsayılan konum (İstanbul - Taksim)
        self.default_location = {"enlem": 41.0370, "boylam": 28.9850}
        self.current_location = self.default_location.copy()
        
    def hesapla_mesafe(self, lat1, lon1, lat2, lon2):
        """İki koordinat arasındaki mesafeyi hesapla (km)"""
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) * math.sin(dlon / 2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
    
    def print_banner(self):
        """Banner göster"""
        print("\n" + "="*80)
        print(" "*20 + "MEKAN ONERI SISTEMI - INTERAKTIF CHATBOT")
        print("="*80)
        print("\n[i] Mevcut konum: ({:.4f}, {:.4f})".format(
            self.current_location['enlem'], 
            self.current_location['boylam']
        ))
        print("\n[i] Kullanilabilir Komutlar:")
        print("  - Mekan aramak icin sorgunuzu yazin")
        print("  - 'konum' : Konumunuzu degistirin")
        print("  - 'ornek' : Ornek sorgular gosterin")
        print("  - 'cikis' : Chatbot'tan cikin")
        print("\n" + "-"*80 + "\n")
    
    def show_examples(self):
        """Örnek sorgular göster"""
        print("\n" + "="*80)
        print("  ORNEK SORGULAR")
        print("="*80 + "\n")
        
        examples = [
            ("Fiziksel Ozellikler", [
                "deniz manzarali wifi olan kafe",
                "bahce acik hava terasta oturmak",
                "park icinde yesil alan"
            ]),
            ("Duygular & Ruh Hali", [
                "yorgunum sessiz dinlenmek istiyorum",
                "mutlu kutlama yapmak istiyorum",
                "romantik ozel gun"
            ]),
            ("Sosyal Durum", [
                "ailecek gidebilecegimiz cocuk oyun alani olan",
                "sevgilimle romantik aksam",
                "kahve icmek istiyorum"
            ]),
            ("Karmasik Sorgular", [
                "deniz manzarali romantik aksam yemegi",
                "sessiz wifi olan calisma mekani kahve",
                "bahceli ailecek kahvalti"
            ])
        ]
        
        for kategori, sorgu_listesi in examples:
            print(f"[+] {kategori}:")
            for sorgu in sorgu_listesi:
                print(f"    - \"{sorgu}\"")
            print()
    
    def set_location(self):
        """Konum ayarla"""
        print("\n" + "-"*80)
        print("  KONUM AYARLAMA")
        print("-"*80 + "\n")
        
        print("[i] Populer Konumlar:")
        populer_konumlar = [
            ("1", "Taksim", 41.0370, 28.9850),
            ("2", "Kadikoy", 40.9903, 29.0250),
            ("3", "Besiktas", 41.0427, 29.0089),
            ("4", "Sultanahmet", 41.0082, 28.9784),
            ("5", "Nisantasi", 41.0477, 28.9955),
        ]
        
        for num, name, lat, lon in populer_konumlar:
            print(f"  {num}. {name} ({lat}, {lon})")
        
        print("\n  0. Manuel konum girin")
        
        secim = input("\n[?] Seciminiz (0-5): ").strip()
        
        if secim == "0":
            try:
                enlem = float(input("[?] Enlem: "))
                boylam = float(input("[?] Boylam: "))
                self.current_location = {"enlem": enlem, "boylam": boylam}
                print(f"\n[+] Konum ayarlandi: ({enlem}, {boylam})")
            except ValueError:
                print("\n[!] Gecersiz konum! Onceki konum korundu.")
        elif secim in ["1", "2", "3", "4", "5"]:
            konum = populer_konumlar[int(secim)-1]
            self.current_location = {"enlem": konum[2], "boylam": konum[3]}
            print(f"\n[+] Konum ayarlandi: {konum[1]} ({konum[2]}, {konum[3]})")
        else:
            print("\n[!] Gecersiz secim! Onceki konum korundu.")
    
    def search_mekan(self, query):
        """Mekan ara ve sonuçları göster"""
        print("\n" + "="*80)
        print(f"  ARAMA: '{query}'")
        print("="*80 + "\n")
        
        print("[*] SerpApi ile internetten canli mekanlar araniyor...")
        start_time = time.time()
        
        try:
            from serpapi_client import SerpApiClient
            serp_client = SerpApiClient()
            
            # SerpApi ile canli arama yap
            raw_places = serp_client.search_places(
                query=query,
                location=f"{self.current_location['enlem']},{self.current_location['boylam']}",
                limit=5
            )
            
            # Formati RAGGenerator'un bekledigi yapıya donustur
            results = []
            for place in raw_places:
                results.append({
                    "score": float(place.get("rating", 0.0)) / 5.0, # Rate'i normalize skor al (0-1 arasi)
                    "payload": {
                        "ad": place.get("name", ""),
                        "adres": place.get("address", ""),
                        "enlem": place.get("latitude", 0.0),
                        "boylam": place.get("longitude", 0.0),
                        "kategori": place.get("category", ""),
                        "aciklama": place.get("description", "")
                    }
                })
            
            if not results:
                raise ValueError("SerpApi sonuc bulamadi")
                
        except Exception as e:
            print(f"\n[!] Canli arama hatasi: {e}")
            print("[*] Qdrant (Yerel Vektor DB) uzerinden araniyor...")
            
            # Mekanları bul (Offline / Local)
            results = self.retriever.retrieve(
                query=query,
                location=self.current_location,
                top_k=5
            )
        
        elapsed = (time.time() - start_time) * 1000
        
        if not results or len(results) == 0:
            print("\n[!] Uygun mekan bulunamadi.")
            print("[i] Daha genel bir sorgu deneyin.\n")
            return
        
        print(f"\n[+] {len(results)} mekan bulundu ({elapsed:.0f}ms)\n")
        
        # Sonuçları göster
        print("-"*80)
        for i, result in enumerate(results, 1):
            payload = result.get('payload', {})
            score = result.get('score', 0)
            
            mekan_ad = payload.get('ad', 'Bilinmeyen')
            kategori = payload.get('kategori', 'N/A')
            aciklama = payload.get('aciklama', '')
            adres = payload.get('adres', '')
            
            # Mesafe hesapla
            mekan_lat = payload.get('enlem', 0)
            mekan_lon = payload.get('boylam', 0)
            mesafe = self.hesapla_mesafe(
                self.current_location['enlem'],
                self.current_location['boylam'],
                mekan_lat,
                mekan_lon
            )
            
            print(f"\n[{i}] {mekan_ad}")
            print(f"    Kategori       : {kategori}")
            print(f"    Benzerlik Skoru: {score:.4f}")
            print(f"    Mesafe         : {mesafe:.2f} km")
            
            if aciklama:
                # Uzun açıklamaları kes
                if len(aciklama) > 100:
                    aciklama = aciklama[:100] + "..."
                print(f"    Aciklama       : {aciklama}")
            
            if adres:
                print(f"    Adres          : {adres}")
            
            print(f"    Koordinat      : ({mekan_lat:.4f}, {mekan_lon:.4f})")
        
        print("\n" + "-"*80)
        
        # LLM ile analiz (opsiyonel)
        if self.has_llm and self.generator:
            try:
                print("\n[*] AI analizi hazirlaniyor...")
                recommendation = self.generator.generate_recommendation(
                    user_query=query,
                    retrieved_mekanlar=results
                )
                
                if recommendation.get('sorgu_analizi'):
                    print("\n[AI] Sorgu Analizi:")
                    analiz = recommendation['sorgu_analizi']
                    # İlk 200 karakteri göster
                    if len(analiz) > 200:
                        analiz = analiz[:200] + "..."
                    print(f"     {analiz}\n")
            except Exception as e:
                print(f"\n[!] AI analizi yapilamadi: {e}\n")
        
        # Yorum tabanlı insight analizi
        self._show_review_insights(results)
    
    def _show_review_insights(self, results: list) -> None:
        """
        SerpAPI'dan gelen yüzüncü yorumları çekip
        her mekanın neyle övüldüğünü gösterir.
        """
        try:
            from serpapi_client import SerpApiClient
            client = SerpApiClient()
        except Exception:
            return  # SerpAPI yoksa sessizce atla
        
        print("\n" + "-"*80)
        print("  YORUM ANALiZi - Mekanlar Ne ile Ovuluyor?")
        print("-"*80)
        
        has_any = False
        for result in results:
            payload = result.get('payload', {})
            data_id = payload.get('data_id', '')
            name = payload.get('ad', 'Bilinmeyen')
            
            if not data_id:
                continue
            
            try:
                print(f"\n  [{name}] yorumlar aliniyor...", end="", flush=True)
                reviews = client.get_place_reviews(data_id, max_reviews=15)
                
                if not reviews:
                    print(" yorum bulunamadi")
                    continue
                
                insights = fast_extract_insights(reviews, name)
                specialties = insights.get('specialties', [])
                
                if specialties:
                    has_any = True
                    print(f" ({len(reviews)} yorum analiz edildi)")
                    for spec in specialties[:3]:
                        print(f"    {spec['display']}")
                        if spec.get('example_review'):
                            review_short = spec['example_review'][:80]
                            print(f"    Ornek: \"{review_short}\"")
                else:
                    print(f" ({len(reviews)} yorum - ozellik tespiti yapılamdı)")
                    
            except Exception as e:
                print(f" hata: {e}")
        
        if not has_any:
            print("\n  [i] Yorum insight'i icin mekan data_id bilgisi gerekli (SerpAPI sonuclari)")
        
        print("\n" + "-"*80 + "\n")
    
    def run(self):
        """Chatbot'u çalıştır"""
        self.print_banner()
        
        while True:
            try:
                # Kullanıcı girdisi al
                query = input("[Siz] > ").strip()
                
                if not query:
                    continue
                
                # Komutları kontrol et
                if query.lower() in ['cikis', 'exit', 'quit', 'q']:
                    print("\n[+] Gorusmek uzere! Iyi gunler :)\n")
                    break
                
                elif query.lower() in ['ornek', 'ornekler', 'examples']:
                    self.show_examples()
                
                elif query.lower() in ['konum', 'location', 'loc']:
                    self.set_location()
                
                elif query.lower() in ['yardim', 'help', 'h']:
                    self.print_banner()
                
                else:
                    # Mekan ara
                    self.search_mekan(query)
                
            except KeyboardInterrupt:
                print("\n\n[!] Chatbot sonlandiriliyor...\n")
                break
            except Exception as e:
                print(f"\n[!] Hata: {e}\n")


def main():
    """Ana fonksiyon"""
    try:
        chatbot = MekanChatbot()
        chatbot.run()
    except Exception as e:
        print(f"\n[!] Chatbot baslatma hatasi: {e}\n")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()


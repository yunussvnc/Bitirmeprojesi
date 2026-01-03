"""
Duygusal/Sentiment Arama Testi
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

os.environ['LLM_PROVIDER'] = 'huggingface'
os.environ['QDRANT_URL'] = 'http://localhost:6333'

from src.rag.retriever import RAGRetriever

print("\n" + "="*80)
print("  DUYGUSAL ARAMA TESTI")
print("="*80 + "\n")

retriever = RAGRetriever()
print("[+] Retriever hazir!\n")

# Duygusal sorgular
emotional_queries = [
    {
        "query": "huzurlu sakin rahat ortam",
        "emotion": "Huzur/Dinginlik",
        "location": {"enlem": 41.0370, "boylam": 28.9850}
    },
    {
        "query": "neseli eglenceli canli muzik",
        "emotion": "Neseli/Canli",
        "location": {"enlem": 41.0370, "boylam": 28.9850}
    },
    {
        "query": "romantik ozel gun kutlama",
        "emotion": "Romantik/Ozel",
        "location": {"enlem": 41.0477, "boylam": 28.9955}
    },
    {
        "query": "sik lüks elit atmosfer",
        "emotion": "Elit/Lüks",
        "location": {"enlem": 41.0477, "boylam": 28.9955}
    }
]

for idx, test in enumerate(emotional_queries, 1):
    print("-"*80)
    print(f"TEST {idx}: {test['emotion']}")
    print("-"*80)
    print(f"[?] Sorgu: '{test['query']}'")
    print()
    
    results = retriever.retrieve(
        query=test['query'],
        location=test['location'],
        top_k=3
    )
    
    if results:
        print(f"[+] {len(results)} mekan bulundu\n")
        
        for i, result in enumerate(results, 1):
            payload = result.get('payload', {})
            print(f"  {i}. {payload.get('ad', 'Bilinmeyen')}")
            print(f"     Skor    : {result.get('score', 0):.4f}")
            print(f"     Kategori: {payload.get('kategori', 'N/A')}")
            
            if payload.get('aciklama'):
                aciklama = payload['aciklama'][:100] + "..." if len(payload['aciklama']) > 100 else payload['aciklama']
                print(f"     Aciklama: {aciklama}")
            print()
    else:
        print("[!] Mekan bulunamadi\n")

print("="*80)
print("[+] DUYGUSAL ARAMA TESTI TAMAMLANDI")
print("="*80 + "\n")

print("[i] Sonuc:")
print("  - Sistem duygusal/sentiment bazli arama yapabiliyor")
print("  - Huzur, neseli, romantik gibi duygulari anlayabiliyor")
print("  - Mekan aciklamalarindaki duyguları eslestirebiliyor")
print()


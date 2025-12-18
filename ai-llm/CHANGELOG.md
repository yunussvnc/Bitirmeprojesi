# Changelog

## [Unreleased] - 2024

### Eklenenler

- ✅ LangChain entegrasyonu güncellendi (güncel API desteği)
- ✅ OpenAI SDK desteği eklendi (LangChain olmadan da çalışabilir)
- ✅ **Local LLM desteği eklendi (HuggingFace Transformers)** 🎉
  - Qwen2-1.5B-Instruct desteği (Türkçe için önerilen)
  - TinyLlama ve Phi-3 modelleri desteği
  - GPU ve CPU desteği
  - Otomatik device detection
- ✅ Lazy loading optimizasyonları (Embedding model, RAG Pipeline)
- ✅ Gelişmiş hata yönetimi ve logging
- ✅ Qdrant bağlantı yönetimi iyileştirildi
- ✅ Test scriptleri eklendi (`scripts/test_rag.py`, `scripts/test_local_llm.py`)
- ✅ Vektör veritabanı hazırlama scripti (`scripts/prepare_vector_db.py`)
- ✅ Detaylı kullanım kılavuzları (USAGE.md, LOCAL_LLM_SETUP.md)
- ✅ Batch processing desteği (embedding oluşturma)
- ✅ Async/await desteği (LLM çağrıları için)

### İyileştirmeler

- Embedding model lazy loading ile optimize edildi
- Qdrant filtreleme desteği eklendi
- Daha iyi hata mesajları ve logging
- Kod yapısı iyileştirildi

### Yapılacaklar

- [ ] HuggingFace yerel model desteği
- [ ] Konum bazlı filtreleme geliştirme
- [ ] Önbellekleme mekanizması
- [ ] Daha gelişmiş prompt engineering
- [ ] Unit testler


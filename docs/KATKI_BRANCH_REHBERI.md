# Katkı Branch ve PR Rehberi (Arkadaş Reposu)

Bu doküman, [UlasCan-Demirtas/Bitirmeprojesi-V2](https://github.com/UlasCan-Demirtas/Bitirmeprojesi-V2) için **hangi branch’in ne amaçla** açılacağını netleştirir. Amaç: tek seferde devasa bir PR göndermeden, review edilebilir paketler.

## Önerilen sıra

| Sıra | Branch | PR hedefi | Kapsam |
|------|--------|-----------|--------|
| **1** | eature/social-login-and-setup-docs | → main | Google/Apple auth, .env.example, kurulum MD |
| **2 (opsiyonel)** | eature/rag-auth-social-env-docs veya yeni eature/rag-llm-service | → main | i-llm, vektör DB, RAG deploy — **ayrı PR** |

**Birleştirmeyin:** RAG paketi onlarca dosya ve büyük JSON verisi içerir; sosyal giriş PR’ına dahil etmeyin.

## Mevcut remote branch’ler (upstream-friend)

| Branch | Durum | Öneri |
|--------|-------|-------|
| eature/social-login-google-apple | Sadece sosyal giriş (11 dosya) | **Superseded** — yerine eature/social-login-and-setup-docs (aynı kod + profesyonel TR doküman) |
| eature/rag-auth-social-env-docs | RAG + sosyal + birleşik kurulum | PR **açmayın** (birleşik); RAG’i ayırıp sadeleştirin veya ikinci PR olarak planlayın |
| eature/social-login-and-setup-docs | Önerilen birinci PR | **Açın / review** |

Eski branch’leri silme yetkiniz yoksa bırakın; PR açarken yalnızca eature/social-login-and-setup-docs kullanın.

## Birinci PR açıklama taslağı

**Başlık:** eat(auth): Google ve Apple sosyal giriş + kurulum dokümantasyonu

**Özet maddeler:**

- Backend’de Google/Apple token doğrulama (/auth/google, /auth/apple)
- Mobil Login/Register ekranları ve socialAuth yapılandırması
- ackend/.env.example, pps/mobile/.env.example (placeholder)
- docs/KURULUM_SOSYAL_GIRIS.md kurulum rehberi
- Feed / mesajlaşma / RAG **değişmedi**

## İkinci PR (opsiyonel RAG)

Ayrı branch’te yalnızca i-llm/ ve backend LLM entegrasyonu; sosyal giriş zaten main’deyse tekrar göndermeyin.

## PR linki (push sonrası)

Push başarılı olduktan sonra:

https://github.com/UlasCan-Demirtas/Bitirmeprojesi-V2/compare/main...feature/social-login-and-setup-docs

GitHub’da **Compare & pull request** ile açın.

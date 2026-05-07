"""
LLM Wrapper - Katmanlı LLM mimarisi
=====================================

Katman sırası:
  1. GroqWrapper      → Groq Cloud API (hızlı, bedava, internet gerekli)
  2. HuggingFaceWrapper → Local model (~5GB RAM, yavaş ama her zaman çalışır)
  3. LayeredLLMWrapper  → Groq → HuggingFace zinciri (otomatik fallback)
"""

from abc import ABC, abstractmethod
from typing import List, Optional
import asyncio
import logging

logger = logging.getLogger(__name__)


# ==================== ABSTRACT BASE ====================

class LLMWrapper(ABC):
    """LLM wrapper abstract class"""

    name: str = "base"

    @abstractmethod
    def generate(self, prompt: str, context: Optional[List[str]] = None) -> str:
        """Öneri metni üret (sync)"""
        pass

    @abstractmethod
    async def generate_async(self, prompt: str, context: Optional[List[str]] = None) -> str:
        """Öneri metni üret (async)"""
        pass


# ==================== KATMAN 1: GROQ ====================

class GroqWrapper(LLMWrapper):
    """
    Groq Cloud API wrapper.
    llama-3.1-8b-instant ile saniyeler içinde cevap verir.
    Internet yoksa veya kota doluysa exception fırlatır → fallback tetiklenir.
    """

    name = "groq"

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout: float = 8.0,
    ) -> None:
        from src.config import settings as _s
        import os
        from dotenv import load_dotenv
        load_dotenv()  # .env'i kesinlikle yükle

        self.api_key = api_key or _s.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
        self.model   = model   or getattr(_s, "GROQ_MODEL", None) or os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        self.timeout = timeout

        if not self.api_key:
            raise ValueError("GROQ_API_KEY tanimli degil — .env dosyasini kontrol edin")

        logger.info(f"[GroqWrapper] Hazir: model={self.model}, key={self.api_key[:8]}...")


    # ---- iç yardımcı ----

    def _build_messages(self, prompt: str, context: Optional[List[str]]) -> list:
        system = (
            "Sen AsEmOs adlı mekan öneri uygulamasının yapay zeka asistanısın. "
            "Türkçe, sıcak, samimi ve kısa cevaplar veriyorsun. "
            "Mekanları tanıtırken en çarpıcı özelliklerini vurguluyorsun. "
            "Cevabın 3-4 cümle olsun."
        )
        if context:
            user_msg = "\n".join(context) + "\n\n" + prompt
        else:
            user_msg = prompt

        return [
            {"role": "system", "content": system},
            {"role": "user",   "content": user_msg},
        ]

    # ---- sync ----

    def generate(self, prompt: str, context: Optional[List[str]] = None) -> str:
        import httpx

        messages = self._build_messages(prompt, context)
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": 250,
                    "temperature": 0.7,
                },
            )
        if resp.status_code != 200:
            raise RuntimeError(f"Groq API hatası: {resp.status_code} — {resp.text[:200]}")

        content = resp.json()["choices"][0]["message"]["content"]
        logger.info(f"[GroqWrapper] Yanıt üretildi ({len(content)} karakter)")
        return content

    # ---- async ----

    async def generate_async(self, prompt: str, context: Optional[List[str]] = None) -> str:
        import httpx

        messages = self._build_messages(prompt, context)
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": 250,
                    "temperature": 0.7,
                },
            )
        if resp.status_code != 200:
            raise RuntimeError(f"Groq API hatası: {resp.status_code} — {resp.text[:200]}")

        content = resp.json()["choices"][0]["message"]["content"]
        logger.info(f"[GroqWrapper] Async yanıt üretildi ({len(content)} karakter)")
        return content


# ==================== KATMAN 2: LOCAL HuggingFace ====================

class HuggingFaceWrapper(LLMWrapper):
    """
    HuggingFace yerel model wrapper.
    Groq başarısız olursa devreye girer — model lazy load edilir.
    """

    name = "huggingface"

    def __init__(self, model_name: Optional[str] = None) -> None:
        from src.config import settings as _s
        self.model_name = model_name or _s.HUGGINGFACE_MODEL
        self._pipeline = None  # lazy
        logger.info(f"[HuggingFaceWrapper] Tanımlandı: {self.model_name} (lazy load)")

    def _load(self):
        if self._pipeline is not None:
            return

        try:
            from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline as hf_pipeline
            import torch

            device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"[HuggingFaceWrapper] Model yükleniyor — device={device}")

            tokenizer = AutoTokenizer.from_pretrained(
                self.model_name, trust_remote_code=True
            )
            if tokenizer.pad_token is None:
                tokenizer.pad_token = tokenizer.eos_token

            model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                trust_remote_code=True,
                torch_dtype=torch.float16 if device == "cuda" else torch.float32,
                device_map="auto" if device == "cuda" else None,
                low_cpu_mem_usage=True,
            )
            if device == "cpu":
                model = model.to(device)

            self._pipeline = hf_pipeline(
                "text-generation",
                model=model,
                tokenizer=tokenizer,
                device=0 if device == "cuda" else -1,
                max_new_tokens=256,
                temperature=0.7,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id,
            )
            self._tokenizer = tokenizer
            logger.info("[HuggingFaceWrapper] ✓ Model yüklendi")

        except ImportError:
            raise ImportError(
                "Transformers bulunamadı. "
                "'pip install transformers accelerate' çalıştırın."
            )

    def _format_prompt(self, prompt: str, context: Optional[List[str]]) -> str:
        system = (
            "Sen bir mekan öneri asistanısın. Türkçe yanıt veriyorsun. "
            "Kısa, öz ve samimi bir dil kullan.\n\n"
        )
        if context:
            ctx = "\n".join(context)
            return system + ctx + f"\n\nSoru: {prompt}\nCevap:"
        return system + f"Soru: {prompt}\nCevap:"

    def generate(self, prompt: str, context: Optional[List[str]] = None) -> str:
        self._load()
        full_prompt = self._format_prompt(prompt, context)
        outputs = self._pipeline(
            full_prompt,
            max_new_tokens=256,
            temperature=0.7,
            do_sample=True,
            num_return_sequences=1,
            truncation=True,
            pad_token_id=self._tokenizer.eos_token_id,
        )
        generated = outputs[0]["generated_text"]
        if "Cevap:" in generated:
            answer = generated.split("Cevap:")[-1].strip()
        else:
            answer = generated[len(full_prompt):].strip()
        eos = getattr(self._tokenizer, "eos_token", "")
        if eos:
            answer = answer.split(eos)[0].strip()
        return answer or "Özür dilerim, yanıt oluşturulamadı."

    async def generate_async(self, prompt: str, context: Optional[List[str]] = None) -> str:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.generate, prompt, context)


# ==================== KATMAN 3: LAYERED (Groq → Local) ====================

class LayeredLLMWrapper(LLMWrapper):
    """
    Katmanlı LLM — önce Groq, başarısız olursa local model.

    Fallback tetikleyicileri:
      - Groq API key yok
      - Ağ hatası / timeout
      - HTTP 4xx / 5xx yanıtı
      - Groq kotası doldu

    Kullanım:
        llm = LayeredLLMWrapper()
        cevap = await llm.generate_async(prompt)
    """

    name = "layered"

    def __init__(
        self,
        groq_timeout: float = 8.0,
        local_model: Optional[str] = None,
    ) -> None:
        # Katman 1: Groq
        try:
            self._groq = GroqWrapper(timeout=groq_timeout)
        except ValueError as e:
            logger.warning(f"[LayeredLLM] Groq devre dışı: {e}")
            self._groq = None

        # Katman 2: Local (lazy — sadece Groq çökünce yüklenir)
        self._local = HuggingFaceWrapper(model_name=local_model)

        active = "Groq → Local" if self._groq else "Local only"
        logger.info(f"[LayeredLLM] Hazır — mod: {active}")

    # ---- sync ----

    def generate(self, prompt: str, context: Optional[List[str]] = None) -> str:
        if self._groq:
            try:
                result = self._groq.generate(prompt, context)
                logger.info("[LayeredLLM] Yanıt: Groq ✓")
                return result
            except Exception as e:
                logger.warning(f"[LayeredLLM] Groq başarısız → Local fallback: {e}")

        logger.info("[LayeredLLM] Yanıt: Local HuggingFace")
        return self._local.generate(prompt, context)

    # ---- async ----

    async def generate_async(self, prompt: str, context: Optional[List[str]] = None) -> str:
        if self._groq:
            try:
                result = await self._groq.generate_async(prompt, context)
                logger.info("[LayeredLLM] Async yanıt: Groq ✓")
                return result
            except Exception as e:
                logger.warning(f"[LayeredLLM] Groq başarısız → Local fallback: {e}")

        logger.info("[LayeredLLM] Async yanıt: Local HuggingFace")
        return await self._local.generate_async(prompt, context)

    @property
    def active_provider(self) -> str:
        return "groq" if self._groq else "local"


# ==================== FACTORY ====================

class LLMFactory:
    """LLM factory — provider string'e göre doğru wrapper döner"""

    @staticmethod
    def create_llm(provider: Optional[str] = None) -> LLMWrapper:
        from src.config import settings as _s
        p = (provider or _s.LLM_PROVIDER).lower()

        if p == "layered":
            return LayeredLLMWrapper()
        if p == "groq":
            return GroqWrapper()
        if p in ("huggingface", "local", "gemma"):
            return HuggingFaceWrapper()

        raise ValueError(
            f"Desteklenmeyen LLM sağlayıcısı: '{p}'. "
            "Desteklenenler: 'layered', 'groq', 'huggingface', 'local'"
        )

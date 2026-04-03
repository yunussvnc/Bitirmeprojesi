"""
LLM Wrapper - Farklı LLM sağlayıcıları için abstract interface
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import asyncio
from src.config import settings


class LLMWrapper(ABC):
    """LLM wrapper abstract class"""
    
    @abstractmethod
    def generate(self, prompt: str, context: Optional[List[str]] = None) -> str:
        """Öneri metni üret"""
        pass
    
    @abstractmethod
    async def generate_async(self, prompt: str, context: Optional[List[str]] = None) -> str:
        """Async öneri metni üret"""
        pass


class HuggingFaceWrapper(LLMWrapper):
    """HuggingFace yerel model wrapper - Local LLM desteği"""
    
    def __init__(self, model_name: Optional[str] = None):
        """HuggingFace modelini başlat"""
        import logging
        logger = logging.getLogger(__name__)
        
        self.model_name = model_name or settings.HUGGINGFACE_MODEL
        
        logger.info(f"HuggingFace modeli yükleniyor: {self.model_name}")
        
        try:
            from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
            import torch
            
            # Device belirleme
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Device: {self.device}")
            
            # Tokenizer ve model yükleme
            logger.info("Model ve tokenizer yükleniyor...")
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                trust_remote_code=True
            )
            
            # Pad token yoksa eos token'ı kullan
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                trust_remote_code=True,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                device_map="auto" if self.device == "cuda" else None,
                low_cpu_mem_usage=True
            )
            
            if self.device == "cpu":
                self.model = self.model.to(self.device)
            
            # Pipeline oluştur (daha kolay kullanım için)
            self.pipeline = pipeline(
                "text-generation",
                model=self.model,
                tokenizer=self.tokenizer,
                device=0 if self.device == "cuda" else -1,
                max_new_tokens=256,
                temperature=0.7,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id
            )
            
            logger.info(f"✓ Model başarıyla yüklendi: {self.model_name}")
            
        except ImportError as e:
            raise ImportError(
                "Transformers kütüphanesi bulunamadı. "
                "Lütfen 'pip install transformers accelerate' çalıştırın."
            )
        except Exception as e:
            logger.error(f"Model yüklenirken hata: {e}")
            raise
    
    def generate(self, prompt: str, context: Optional[List[str]] = None) -> str:
        """Öneri metni üret (sync)"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Context varsa prompt'a ekle
            if context:
                context_text = "\n".join(context)
                full_prompt = f"{context_text}\n\nSoru: {prompt}\nCevap:"
            else:
                full_prompt = f"Soru: {prompt}\nCevap:"
            
            # System prompt ekle
            system_prompt = (
                "Sen bir mekan öneri asistanısın. Türkçe yanıt veriyorsun. "
                "Kısa, öz ve samimi bir dil kullan.\n\n"
            )
            full_prompt = system_prompt + full_prompt
            
            # Generation
            outputs = self.pipeline(
                full_prompt,
                max_new_tokens=256,
                temperature=0.7,
                do_sample=True,
                num_return_sequences=1,
                truncation=True,
                pad_token_id=self.tokenizer.eos_token_id
            )
            
            # Sonucu çıkar
            generated_text = outputs[0]['generated_text']
            
            # Sadece yeni üretilen kısmı al (prompt'u çıkar)
            if "Cevap:" in generated_text:
                answer = generated_text.split("Cevap:")[-1].strip()
            else:
                # Prompt olmadan sadece yeni text
                answer = generated_text[len(full_prompt):].strip()
            
            # EOS token varsa kaldır
            answer = answer.split(self.tokenizer.eos_token)[0].strip()
            
            return answer if answer else "Özür dilerim, bir yanıt oluşturamadım."
            
        except Exception as e:
            logger.error(f"Generation hatası: {e}")
            return f"Hata oluştu: {str(e)}"
    
    async def generate_async(self, prompt: str, context: Optional[List[str]] = None) -> str:
        """Async öneri metni üret (sync üzerinde chain olarak çalışır)"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.generate, prompt, context)


class LLMFactory:
    """LLM factory - HuggingFace/Gemma 2 modelleri için"""
    
    @staticmethod
    def create_llm(provider: Optional[str] = None) -> LLMWrapper:
        """LLM instance oluştur"""
        provider = provider or settings.LLM_PROVIDER
        
        if provider == "huggingface" or provider == "local" or provider == "gemma":
            try:
                return HuggingFaceWrapper()
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Model yüklenemedi: {e}")
                raise ValueError(
                    f"Model yüklenemedi: {e}. "
                    "Lütfen 'pip install transformers accelerate' çalıştırın."
                )
        else:
            raise ValueError(
                f"Desteklenmeyen LLM sağlayıcısı: {provider}. "
                "Desteklenen: 'huggingface', 'local', 'gemma'"
            )


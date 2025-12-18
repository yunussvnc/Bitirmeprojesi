"""
Fine-tuned Model Wrapper
Fine-tune edilmiş lokal modeli kullanır
"""

from typing import Optional
import logging
from src.models.llm.llm_wrapper import LLMWrapper

logger = logging.getLogger(__name__)


class FineTunedModelWrapper(LLMWrapper):
    """Fine-tune edilmiş model wrapper"""
    
    def __init__(self, model_path: str = "models/fine_tuned"):
        """Fine-tune edilmiş modeli yükle"""
        try:
            from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
            import torch
            
            self.model_path = model_path
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            
            logger.info(f"Fine-tuned model yükleniyor: {model_path}")
            
            # Tokenizer ve model yükle
            self.tokenizer = AutoTokenizer.from_pretrained(
                model_path,
                trust_remote_code=True
            )
            
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            self.model = AutoModelForCausalLM.from_pretrained(
                model_path,
                trust_remote_code=True,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                device_map="auto" if self.device == "cuda" else None
            )
            
            if self.device == "cpu":
                self.model = self.model.to(self.device)
            
            # Pipeline
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
            
            logger.info(f"✓ Fine-tuned model başarıyla yüklendi ({self.device})")
            
        except Exception as e:
            logger.error(f"Fine-tuned model yüklenirken hata: {e}")
            raise
    
    def generate(self, prompt: str, context: Optional[list] = None) -> str:
        """Öneri metni üret"""
        try:
            # Context varsa ekle
            if context:
                context_text = "\n".join(context)
                full_prompt = f"{context_text}\n\nSoru: {prompt}\nCevap:"
            else:
                full_prompt = f"Soru: {prompt}\nCevap:"
            
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
            
            generated_text = outputs[0]['generated_text']
            
            # Sadece yeni üretilen kısmı al
            if "Cevap:" in generated_text:
                answer = generated_text.split("Cevap:")[-1].strip()
            else:
                answer = generated_text[len(full_prompt):].strip()
            
            answer = answer.split(self.tokenizer.eos_token)[0].strip()
            
            return answer if answer else "Özür dilerim, bir yanıt oluşturamadım."
            
        except Exception as e:
            logger.error(f"Generation hatası: {e}")
            return f"Hata oluştu: {str(e)}"
    
    async def generate_async(self, prompt: str, context: Optional[list] = None) -> str:
        """Async öneri metni üret"""
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.generate, prompt, context)


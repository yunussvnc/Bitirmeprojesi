"""
LLM Wrapper - Farklı LLM sağlayıcıları için abstract interface
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any
from langchain.llms import OpenAI
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage, SystemMessage
from src.config import settings


class LLMWrapper(ABC):
    """LLM wrapper abstract class"""
    
    @abstractmethod
    def generate(self, prompt: str, context: List[str] = None) -> str:
        """Öneri metni üret"""
        pass


class OpenAIWrapper(LLMWrapper):
    """OpenAI LLM wrapper"""
    
    def __init__(self):
        """OpenAI modelini başlat"""
        self.llm = ChatOpenAI(
            model_name=settings.OPENAI_MODEL,
            temperature=0.7,
            openai_api_key=settings.OPENAI_API_KEY
        )
    
    def generate(self, prompt: str, context: List[str] = None) -> str:
        """Öneri metni üret"""
        messages = [
            SystemMessage(
                content="Sen bir mekan öneri asistanısın. Kullanıcıların isteklerine göre "
                "en uygun mekanları öneriyorsun. Türkçe yanıt veriyorsun."
            ),
            HumanMessage(content=prompt)
        ]
        
        response = self.llm(messages)
        return response.content


class LLMFactory:
    """LLM factory - Farklı sağlayıcılar için"""
    
    @staticmethod
    def create_llm(provider: str = None) -> LLMWrapper:
        """LLM instance oluştur"""
        provider = provider or settings.LLM_PROVIDER
        
        if provider == "openai":
            return OpenAIWrapper()
        else:
            raise ValueError(f"Desteklenmeyen LLM sağlayıcısı: {provider}")


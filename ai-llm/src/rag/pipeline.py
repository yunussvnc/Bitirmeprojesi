"""
RAG Pipeline - Retriever ve Generator'ı birleştirir
"""

from typing import Dict, Any, List
from src.rag.retriever import RAGRetriever
from src.rag.generator import RAGGenerator
from src.rag.llm_reranker import LLMReranker
from src.config import settings


class RAGPipeline:
    """RAG sisteminin ana pipeline'ı"""

    def __init__(self):
        """Pipeline'ı başlat"""
        self.retriever = RAGRetriever()
        self.generator = RAGGenerator()
        self.llm_reranker = LLMReranker()
    
    def process(
        self,
        user_query: str,
        location: Dict[str, float] = None,
        kullanici_id: int = None,
        language: str = "tr",
        parsed_query: Dict = None
    ) -> Dict[str, Any]:
        """
        Kullanıcı sorgusunu işle ve öneriler üret

        Args:
            user_query: Kullanıcının doğal dil sorgusu
            location: Kullanıcı konumu (enlem, boylam)
            kullanici_id: Kullanıcı ID (kişiselleştirme için)
            parsed_query: app.py::parse_natural_query() çıktısı (opsiyonel,
                query rewriting için retriever'a iletilir)

        Returns:
            Öneriler ve analiz
        """
        # 1. Retriever: İlgili mekanları bul
        retrieved_mekanlar = self.retriever.retrieve(
            query=user_query,
            location=location,
            parsed_query=parsed_query,
            user_id=kullanici_id
        )
        
        if not retrieved_mekanlar:
            return {
                "sorgu_analizi": "Aradığınız kriterlere uygun mekan bulunamadı.",
                "oneriler": []
            }

        # 1.5 LLM Reranker: final aday listesini kullanıcı sorgusuna göre yeniden sırala (opsiyonel)
        if settings.RAG_USE_LLM_RERANK:
            retrieved_mekanlar = self.llm_reranker.rerank(
                retrieved_mekanlar, user_query, llm=self.generator.llm
            )

        # 2. Generator: LLM ile öneri metni üret
        recommendation = self.generator.generate_recommendation(
            user_query=user_query,
            retrieved_mekanlar=retrieved_mekanlar,
            language=language
        )
        
        return recommendation


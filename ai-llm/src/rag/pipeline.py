"""
RAG Pipeline - Retriever ve Generator'ı birleştirir
"""

from typing import Dict, Any, List
from src.rag.retriever import RAGRetriever
from src.rag.generator import RAGGenerator


class RAGPipeline:
    """RAG sisteminin ana pipeline'ı"""
    
    def __init__(self):
        """Pipeline'ı başlat"""
        self.retriever = RAGRetriever()
        self.generator = RAGGenerator()
    
    def process(
        self,
        user_query: str,
        location: Dict[str, float] = None,
        kullanici_id: int = None,
        language: str = "tr"
    ) -> Dict[str, Any]:
        """
        Kullanıcı sorgusunu işle ve öneriler üret
        
        Args:
            user_query: Kullanıcının doğal dil sorgusu
            location: Kullanıcı konumu (enlem, boylam)
            kullanici_id: Kullanıcı ID (kişiselleştirme için)
        
        Returns:
            Öneriler ve analiz
        """
        # 1. Retriever: İlgili mekanları bul
        retrieved_mekanlar = self.retriever.retrieve(
            query=user_query,
            location=location
        )
        
        if not retrieved_mekanlar:
            return {
                "sorgu_analizi": "Aradığınız kriterlere uygun mekan bulunamadı.",
                "oneriler": []
            }
        
        # 2. Generator: LLM ile öneri metni üret
        recommendation = self.generator.generate_recommendation(
            user_query=user_query,
            retrieved_mekanlar=retrieved_mekanlar,
            language=language
        )
        
        return recommendation


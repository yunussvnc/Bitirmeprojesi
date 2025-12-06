"""
RAG Generator - LLM ile öneri metni üretir
"""

from typing import List, Dict, Any
from src.models.llm.llm_wrapper import LLMFactory
from src.config import settings


class RAGGenerator:
    """RAG sistemi için generator"""
    
    def __init__(self):
        """Generator'ı başlat"""
        self.llm = LLMFactory.create_llm()
    
    def generate_recommendation(
        self,
        user_query: str,
        retrieved_mekanlar: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        LLM kullanarak kişiselleştirilmiş öneri metni üret
        
        Args:
            user_query: Kullanıcı sorgusu
            retrieved_mekanlar: Vektör aramasından dönen mekanlar
        
        Returns:
            Öneri analizi ve gerekçeler
        """
        # Mekan bilgilerini formatla
        mekan_context = self._format_mekan_context(retrieved_mekanlar)
        
        # Prompt oluştur
        prompt = f"""
Kullanıcı şunu aramış: "{user_query}"

Aşağıda bulunan mekanlar, kullanıcının aradığı özelliklere göre sıralanmıştır:

{mekan_context}

Lütfen:
1. Kullanıcının ne aradığını analiz et
2. Her mekan için neden önerildiğini açıkla (kısa gerekçe)
3. En uygun 3-5 mekanı öner

Yanıtı Türkçe olarak, samimi ve kullanıcı dostu bir dille ver.
"""
        
        # LLM'den yanıt al
        response = self.llm.generate(prompt)
        
        return {
            "sorgu_analizi": self._extract_query_analysis(response),
            "oneriler": self._format_recommendations(retrieved_mekanlar, response)
        }
    
    def _format_mekan_context(self, mekanlar: List[Dict[str, Any]]) -> str:
        """Mekan bilgilerini formatla"""
        context_parts = []
        for idx, mekan in enumerate(mekanlar, 1):
            payload = mekan.get("payload", {})
            context_parts.append(
                f"{idx}. {payload.get('ad', 'Bilinmeyen')} - "
                f"{payload.get('aciklama', '')} "
                f"(Benzerlik: {mekan.get('score', 0):.2f})"
            )
        return "\n".join(context_parts)
    
    def _extract_query_analysis(self, response: str) -> str:
        """LLM yanıtından sorgu analizini çıkar"""
        # Basit bir implementasyon - daha gelişmiş parsing yapılabilir
        return response.split("\n")[0] if response else ""
    
    def _format_recommendations(
        self,
        mekanlar: List[Dict[str, Any]],
        llm_response: str
    ) -> List[Dict[str, Any]]:
        """Önerileri formatla"""
        recommendations = []
        for mekan in mekanlar:
            payload = mekan.get("payload", {})
            recommendations.append({
                "mekan_id": payload.get("id"),
                "ad": payload.get("ad"),
                "aciklama": payload.get("aciklama", ""),
                "kategori": payload.get("kategori", ""),
                "enlem": payload.get("enlem"),
                "boylam": payload.get("boylam"),
                "adres": payload.get("adres", ""),
                "benzerlik_skoru": mekan.get("score", 0),
                "gerekce": f"Benzerlik skoru: {mekan.get('score', 0):.2f}"
            })
        return recommendations


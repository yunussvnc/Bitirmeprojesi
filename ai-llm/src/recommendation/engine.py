"""
Öneri Motoru - Ana öneri sistemi
"""

from typing import Dict, Any, List
from src.rag.pipeline import RAGPipeline
import httpx
from src.config import settings


class RecommendationEngine:
    """Kişiselleştirilmiş öneri motoru"""
    
    def __init__(self):
        """Öneri motorunu başlat"""
        self.rag_pipeline = RAGPipeline()
    
    def get_recommendations(
        self,
        kullanici_metni: str,
        enlem: float,
        boylam: float,
        kategori: str = None,
        kullanici_id: int = None
    ) -> Dict[str, Any]:
        """
        Kişiselleştirilmiş mekan önerileri al
        
        Args:
            kullanici_metni: Kullanıcının doğal dil ifadesi
            enlem: Kullanıcı konumu (latitude)
            boylam: Kullanıcı konumu (longitude)
            kategori: Opsiyonel kategori filtresi
            kullanici_id: Kullanıcı ID
        
        Returns:
            Öneriler ve analiz
        """
        location = {"enlem": enlem, "boylam": boylam}
        
        # RAG pipeline ile önerileri al
        recommendations = self.rag_pipeline.process(
            user_query=kullanici_metni,
            location=location,
            kullanici_id=kullanici_id
        )
        
        # Backend'den detaylı mekan bilgilerini al (opsiyonel)
        if recommendations.get("oneriler"):
            recommendations["oneriler"] = self._enrich_mekan_details(
                recommendations["oneriler"]
            )
        
        return recommendations
    
    def _enrich_mekan_details(
        self,
        oneriler: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Backend'den detaylı mekan bilgilerini al"""
        # Backend API'den mekan detaylarını çekme
        # Şimdilik öneriler olduğu gibi dönüyor
        return oneriler


"""
Öneri Motoru - Ana öneri sistemi
"""

from typing import Dict, Any, List, Optional
from src.rag.pipeline import RAGPipeline
import httpx
import logging
from src.config import settings

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """Kişiselleştirilmiş öneri motoru - Lazy loading ile"""
    
    def __init__(self):
        """Öneri motorunu başlat - Lazy loading ile"""
        self._rag_pipeline = None
    
    @property
    def rag_pipeline(self) -> RAGPipeline:
        """RAG pipeline'ı lazy load et"""
        if self._rag_pipeline is None:
            logger.info("RAG Pipeline oluşturuluyor...")
            self._rag_pipeline = RAGPipeline()
            logger.info("RAG Pipeline hazır")
        return self._rag_pipeline
    
    def get_recommendations(
        self,
        kullanici_metni: str,
        enlem: float,
        boylam: float,
        kategori: str = None,
        kullanici_id: int = None,
        language: str = "tr"
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
            kullanici_id=kullanici_id,
            language=(language or "tr").split("-")[0].lower()
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
        """Backend'den detaylı mekan bilgilerini al; eksik kayıtları döndürme."""
        enriched: List[Dict[str, Any]] = []
        for oneri in oneriler:
            name = (oneri.get("ad") or oneri.get("name") or "").strip()
            if len(name) < 2:
                continue
            try:
                lat = float(oneri.get("enlem") or oneri.get("latitude") or 0)
                lng = float(oneri.get("boylam") or oneri.get("longitude") or 0)
            except (TypeError, ValueError):
                continue
            if abs(lat) < 0.0001 and abs(lng) < 0.0001:
                continue
            enriched.append(oneri)
        return enriched


# app/services/push_provider.py

import logging
import httpx
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

logger = logging.getLogger("asemos")

class BasePushProvider(ABC):
    """
    Novu tabanlı abstract Push Provider interface.
    Farklı sağlayıcılar (FCM, APNs, Expo) bu sınıftan türetilebilir.
    """
    @abstractmethod
    async def send_notification(
        self, 
        tokens: List[str], 
        title: str, 
        body: str, 
        data: Optional[Dict[str, Any]] = None
    ) -> bool:
        pass


class ExpoPushProvider(BasePushProvider):
    """
    Expo Push API kullanarak arka planda FCM ve APNs'e bildirim fırlatan adaptör.
    Expo'nun kendi sunucuları routing işlemini (iOS/Android) otomatik yapar.
    """
    def __init__(self):
        self.url = "https://exp.host/--/api/v2/push/send"
        self.headers = {
            "Accept": "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
        }

    async def send_notification(
        self, 
        tokens: List[str], 
        title: str, 
        body: str, 
        data: Optional[Dict[str, Any]] = None
    ) -> bool:
        if not tokens:
            return False

        # Sadece Expo formatındaki token'ları filtrele (güvenlik için)
        valid_tokens = [t for t in tokens if t.startswith("ExponentPushToken") or t.startswith("ExpoPushToken")]
        
        if not valid_tokens:
            logger.warning("Geçerli Expo Push Token bulunamadı.")
            return False

        payloads = []
        for token in valid_tokens:
            payload = {
                "to": token,
                "sound": "default",
                "title": title,
                "body": body,
                "data": data or {},
            }
            payloads.append(payload)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(self.url, headers=self.headers, json=payloads)
                response.raise_for_status()
                result = response.json()
                logger.info(f"✅ Push Notification gönderildi. Hedef: {len(valid_tokens)} cihaz. Yanıt: {result}")
                return True
        except httpx.HTTPStatusError as e:
            logger.error(f"❌ Expo Push API HTTP Hatası: {e.response.status_code} - {e.response.text}")
        except Exception as e:
            logger.error(f"❌ Expo Push gönderim hatası: {str(e)}")
            
        return False


# Global Instance
push_provider = ExpoPushProvider()

# Helper fonksiyon (Background Tasks ile çağırmak için)
async def trigger_push_notification(user_id: int, title: str, body: str, data: Optional[Dict[str, Any]] = None):
    """
    Belirtilen kullanıcının kayıtlı tüm cihazlarına bildirim gönderir.
    Eğer kullanıcı bildirim ayarlarını kapattıysa veya token'ı yoksa sessizce çıkar.
    """
    from database import SessionLocal
    from models import DeviceToken, UserPreferences
    
    db = SessionLocal()
    try:
        # Novu felsefesi: Önce kullanıcının bildirim tercihini (Preferences) kontrol et
        # Eğer bildirime özel bir 'type' gönderilirse (data içinde), o type için kapalı mı bakılabilir.
        # Basitlik adına genel bir engelleme yoksa gönderiyoruz.
        if data and "type" in data:
            notif_type = data["type"]
            prefs = db.query(UserPreferences).filter(UserPreferences.user_id == user_id).first()
            if prefs:
                if notif_type == "message" and not prefs.notify_messages:
                    return
                elif notif_type in ["like", "comment"] and not prefs.notify_likes: # Basit gruplama
                    return
                elif notif_type == "follow" and not prefs.notify_follows:
                    return

        # Cihaz token'larını al
        tokens = db.query(DeviceToken.token).filter(DeviceToken.user_id == user_id).all()
        token_list = [t[0] for t in tokens]
        
        if token_list:
            await push_provider.send_notification(token_list, title, body, data)
            
    except Exception as e:
        logger.error(f"Push tetikleme hatası: {str(e)}")
    finally:
        db.close()

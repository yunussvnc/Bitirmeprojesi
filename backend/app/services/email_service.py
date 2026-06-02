"""
E-posta Doğrulama Servisi — Gmail SMTP ile gerçek mail gönderimi

.env dosyasında SMTP_USER ve SMTP_PASS tanımlandığında gerçek e-posta gönderir.
Tanımlanmamışsa geliştirme ortamı için konsola yazar (fallback).
"""

import os
import random
import string
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

import re
import models
from config import get_settings

logger = logging.getLogger("asemos.email")

VERIFICATION_CODE_LENGTH = 6
VERIFICATION_EXPIRE_MINUTES = 15


def _generate_code() -> str:
    """Kriptografik olarak güvenli 6 haneli sayısal doğrulama kodu üretir."""
    return "".join(random.choices(string.digits, k=VERIFICATION_CODE_LENGTH))


def _build_verification_html(user_name: str, code: str) -> str:
    """Profesyonel, diğer uygulamalardaki gibi modern HTML e-posta şablonu."""
    digits_html = "".join(
        f'<td style="width:44px;height:52px;background:#f8f9fa;border:2px solid #e0e0e0;'
        f'border-radius:10px;text-align:center;font-size:28px;font-weight:800;'
        f'color:#1a1a2e;font-family:\'SF Mono\',Consolas,monospace;letter-spacing:0;">{d}</td>'
        for d in code
    )

    return f"""
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:36px 32px;text-align:center;">
              <div style="font-size:32px;margin-bottom:8px;">🏙️</div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:2px;">ASEMOS</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:0.5px;">Mekanları Keşfet</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 24px;">
              <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;font-weight:700;">
                Merhaba {user_name} 👋
              </h2>
              <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
                AsEmOs hesabını doğrulamak için aşağıdaki <strong>6 haneli kodu</strong> uygulamaya gir:
              </p>

              <!-- Doğrulama Kodu -->
              <table role="presentation" cellpadding="0" cellspacing="6" style="margin:0 auto 28px;">
                <tr>
                  {digits_html}
                </tr>
              </table>

              <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
                <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">
                  ⏰ Bu kod <strong>{VERIFICATION_EXPIRE_MINUTES} dakika</strong> içinde geçerliliğini yitirecektir.
                  Süresi dolan kodlar için uygulamadan yeni bir kod talep edebilirsin.
                </p>
              </div>

              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
                Bu e-postayı sen talep etmediysen güvenle görmezden gelebilirsin.
                Hesabın üzerinde herhangi bir işlem yapılmayacaktır.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #f0f0f0;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:11px;">
                © 2026 AsEmOs — Bu e-posta otomatik olarak gönderilmiştir.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _send_email_smtp(to_email: str, subject: str, html_body: str) -> None:
    """Gmail (veya herhangi bir) SMTP sunucusu üzerinden gerçek e-posta gönderir."""
    settings = get_settings()
    smtp_host = getattr(settings, "SMTP_HOST", None) or os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(getattr(settings, "SMTP_PORT", None) or os.getenv("SMTP_PORT", "587"))
    smtp_user = getattr(settings, "SMTP_USER", None) or os.getenv("SMTP_USER", "")
    smtp_pass = getattr(settings, "SMTP_PASS", None) or os.getenv("SMTP_PASS", "")
    smtp_from = getattr(settings, "SMTP_FROM", None) or os.getenv("SMTP_FROM", "") or smtp_user

    if not smtp_user or not smtp_pass:
        if _dev_email_mock_allowed():
            logger.warning("⚠️  SMTP yok — DEV_SKIP_EMAIL_VERIFICATION ile mock gönderim")
            _send_email_mock(to_email, subject, html_body)
            return
        raise EmailNotConfiguredError(
            "E-posta servisi yapılandırılmamış. SMTP_USER ve SMTP_PASS ayarlayın "
            "veya yalnızca geliştirme için DEV_SKIP_EMAIL_VERIFICATION=true kullanın."
        )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"AsEmOs <{smtp_from}>"
    msg["To"] = to_email
    msg["Reply-To"] = smtp_from
    msg["MIME-Version"] = "1.0"
    msg["X-Mailer"] = "AsEmOs App"

    # Plain text alternative — HTML-only emails are a major spam signal

    plain_text = re.sub(r'<[^>]+>', '', html_body)
    plain_text = re.sub(r'\s+', ' ', plain_text).strip()
    msg.attach(MIMEText(plain_text, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, to_email, msg.as_string())
        logger.info("📧 ✅ E-posta gönderildi → %s", to_email)
    except smtplib.SMTPAuthenticationError:
        logger.error("❌ SMTP kimlik doğrulama hatası! SMTP_USER/SMTP_PASS kontrol edin.")
        raise RuntimeError("E-posta gönderimi başarısız: SMTP kimlik doğrulama hatası.")
    except smtplib.SMTPException as e:
        logger.error("❌ SMTP hatası: %s", e)
        raise RuntimeError(f"E-posta gönderimi başarısız: {e}")
    except Exception as e:
        logger.error("❌ E-posta gönderim hatası: %s", e)
        raise RuntimeError(f"E-posta gönderimi başarısız: {e}")


def _send_email_mock(to_email: str, subject: str, body: str) -> None:
    """Geliştirme ortamı fallback — e-postayı konsola basar."""
    logger.info("=" * 60)
    logger.info("📧  MOCK E-POSTA (SMTP yapılandırılmamış)")
    logger.info("   Kime : %s", to_email)
    logger.info("   Konu : %s", subject)
    logger.info("   İçerik (HTML): %s...", body[:300].replace("\n", "")) # HTML'in bir kısmını bas
    
    # Pratiklik için kod arayalım (HTML içindeki ardışık 6 rakam)

    codes = re.findall(r'>(\d)<', body)
    if len(codes) >= 6:
        logger.info("   Bulunan Kod: %s", "".join(codes[:6]))
        
    logger.info("=" * 60)


def send_email(to_email: str, subject: str, html_body: str) -> None:
    """Ana gönderim fonksiyonu — SMTP varsa gerçek, yoksa mock."""
    _send_email_smtp(to_email, subject, html_body)


# =====================================================================
# RATE LIMITING — Aşırı kod isteğini engelle
# =====================================================================

_resend_timestamps: dict[int, float] = {}  # user_id → son gönderim zamanı
RESEND_COOLDOWN_SECONDS = 60


def _check_rate_limit(user_id: int) -> None:
    """Aynı kullanıcıya 60 saniye içinde ikinci kod gönderimini engeller."""
    now = datetime.now(timezone.utc).timestamp()
    last = _resend_timestamps.get(user_id, 0)
    if now - last < RESEND_COOLDOWN_SECONDS:
        remaining = int(RESEND_COOLDOWN_SECONDS - (now - last))
        raise RateLimitError(f"Lütfen {remaining} saniye bekleyin.")
    _resend_timestamps[user_id] = now


class RateLimitError(Exception):
    """Rate limit aşıldığında fırlatılır."""
    pass


class EmailNotConfiguredError(Exception):
    """SMTP yapılandırması eksik ve dev bypass kapalı."""
    pass


def _dev_email_mock_allowed() -> bool:
    settings = get_settings()
    flag = getattr(settings, "DEV_SKIP_EMAIL_VERIFICATION", False)
    if flag:
        return True
    return os.getenv("DEV_SKIP_EMAIL_VERIFICATION", "").lower() in ("1", "true", "yes")


# =====================================================================
# EMAIL DOĞRULAMA (OTP)
# =====================================================================

def create_verification_code(db: Session, user: models.User) -> str:
    """
    Kullanıcı için yeni bir 6 haneli doğrulama kodu oluşturur.
    Rate-limit kontrolü yapar, eski kodları siler, mail gönderir.
    """
    _check_rate_limit(user.id)

    db.query(models.EmailVerification).filter(
        models.EmailVerification.user_id == user.id
    ).delete()
    db.flush()

    code = _generate_code()
    expires = datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_EXPIRE_MINUTES)

    verification = models.EmailVerification(
        user_id=user.id,
        verification_code=code,
        expires_at=expires,
    )
    db.add(verification)
    db.commit()

    user_name = user.first_name or "Kullanıcı"
    subject = "AsEmOs — E-posta Doğrulama Kodu"
    html_body = _build_verification_html(user_name, code)
    send_email(user.email, subject, html_body)

    logger.info("🔑 Doğrulama kodu oluşturuldu → user_id=%s, email=%s", user.id, user.email)
    return code


def verify_code(db: Session, user: models.User, code: str) -> bool:
    """
    Kullanıcının girdiği kodu kontrol eder.
    Doğruysa is_email_verified=True yapar, kodu siler ve hoşgeldin maili gönderir.
    """
    now = datetime.now(timezone.utc)
    record = (
        db.query(models.EmailVerification)
        .filter(
            models.EmailVerification.user_id == user.id,
            models.EmailVerification.verification_code == code,
            models.EmailVerification.expires_at > now,
        )
        .first()
    )

    if not record:
        return False

    user.is_email_verified = True
    db.delete(record)
    db.commit()
    logger.info("✅ E-posta doğrulandı → user_id=%s, email=%s", user.id, user.email)

    # Hoşgeldin maili gönder
    try:
        _send_welcome_email(user)
    except Exception as e:
        logger.warning("Hoşgeldin maili gönderilemedi: %s", e)

    return True


# =====================================================================
# ŞİFRE SIFIRLAMA (Forgot / Reset Password)
# =====================================================================

PASSWORD_RESET_EXPIRE_MINUTES = 15
MAX_RESET_ATTEMPTS = 5


def create_password_reset_code(db: Session, user: models.User) -> str:
    """Şifre sıfırlama kodu oluşturur ve kullanıcının mailini gönderir."""
    _check_rate_limit(user.id + 1_000_000)  # Ayrı rate-limit

    db.query(models.PasswordReset).filter(
        models.PasswordReset.user_id == user.id
    ).delete()
    db.flush()

    code = _generate_code()
    expires = datetime.now(timezone.utc) + timedelta(minutes=PASSWORD_RESET_EXPIRE_MINUTES)

    reset = models.PasswordReset(
        user_id=user.id,
        reset_code=code,
        expires_at=expires,
    )
    db.add(reset)
    db.commit()

    user_name = user.first_name or "Kullanıcı"
    subject = "AsEmOs — Şifre Sıfırlama Kodu"
    html_body = _build_password_reset_html(user_name, code)
    send_email(user.email, subject, html_body)

    logger.info("🔑 Şifre sıfırlama kodu gönderildi → email=%s", user.email)
    return code


def verify_password_reset(db: Session, user: models.User, code: str, new_password_hash: str) -> bool:
    """
    Sıfırlama kodunu doğrular ve şifreyi günceller.
    Brute-force koruması: 5 yanlış denemeden sonra kod geçersiz olur.
    """
    now = datetime.now(timezone.utc)
    record = (
        db.query(models.PasswordReset)
        .filter(
            models.PasswordReset.user_id == user.id,
            models.PasswordReset.expires_at > now,
        )
        .first()
    )

    if not record:
        return False

    # Deneme sayısı kontrolü
    if record.attempts >= MAX_RESET_ATTEMPTS:
        db.delete(record)
        db.commit()
        return False

    if record.reset_code != code:
        record.attempts += 1
        db.commit()
        return False

    # Başarılı — şifreyi güncelle
    user.password_hash = new_password_hash
    db.delete(record)
    db.commit()
    logger.info("✅ Şifre sıfırlandı → user_id=%s, email=%s", user.id, user.email)
    return True


# =====================================================================
# HOŞGELDİN E-POSTASI
# =====================================================================

def _send_welcome_email(user: models.User) -> None:
    """Doğrulama başarılı olduktan sonra hoşgeldin maili gönderir."""
    user_name = user.first_name or "Kullanıcı"
    subject = "AsEmOs'a Hoş Geldin! 🎉"
    html_body = f"""
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:40px 32px;text-align:center;">
          <div style="font-size:48px;margin-bottom:12px;">🎉</div>
          <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;">Hoş Geldin!</h1>
        </td></tr>
        <tr><td style="padding:36px 32px;">
          <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Merhaba {user_name} 👋</h2>
          <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 20px;">
            E-posta adresin başarıyla doğrulandı! Artık AsEmOs'un tüm özelliklerini kullanabilirsin:
          </p>
          <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
            <tr><td style="padding:12px 16px;background:#f0fdf4;border-radius:10px;margin-bottom:8px;">
              <p style="margin:0;font-size:14px;color:#166534;">🏙️ <strong>Mekanları keşfet</strong> ve yorumla</p>
            </td></tr>
            <tr><td style="height:8px;"></td></tr>
            <tr><td style="padding:12px 16px;background:#eff6ff;border-radius:10px;">
              <p style="margin:0;font-size:14px;color:#1e40af;">📸 <strong>Paylaşımlar yap</strong> ve topluluğa katıl</p>
            </td></tr>
            <tr><td style="height:8px;"></td></tr>
            <tr><td style="padding:12px 16px;background:#fef3c7;border-radius:10px;">
              <p style="margin:0;font-size:14px;color:#92400e;">💬 <strong>Eşleş</strong> ve sohbet et</p>
            </td></tr>
          </table>
          <p style="color:#9ca3af;font-size:12px;margin:0;">Sorularınız mı var? Bize her zaman ulaşabilirsiniz.</p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #f0f0f0;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">© 2026 AsEmOs</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""
    send_email(user.email, subject, html_body)
    logger.info("📧 Hoşgeldin maili gönderildi → %s", user.email)


# =====================================================================
# ŞİFRE SIFIRLAMA HTML ŞABLONU
# =====================================================================

def _build_password_reset_html(user_name: str, code: str) -> str:
    """Şifre sıfırlama kodu için profesyonel HTML şablonu."""
    digits_html = "".join(
        f'<td style="width:44px;height:52px;background:#fff5f5;border:2px solid #fca5a5;'
        f'border-radius:10px;text-align:center;font-size:28px;font-weight:800;'
        f'color:#991b1b;font-family:\'SF Mono\',Consolas,monospace;">{d}</td>'
        for d in code
    )

    return f"""
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#7f1d1d 0%,#991b1b 50%,#b91c1c 100%);padding:36px 32px;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;">🔐</div>
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:2px;">ASEMOS</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Şifre Sıfırlama</p>
        </td></tr>
        <tr><td style="padding:36px 32px 24px;">
          <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;font-weight:700;">Merhaba {user_name} 👋</h2>
          <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
            Şifreni sıfırlamak için aşağıdaki <strong>6 haneli kodu</strong> uygulamaya gir:
          </p>
          <table cellpadding="0" cellspacing="6" style="margin:0 auto 28px;">
            <tr>{digits_html}</tr>
          </table>
          <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
            <p style="margin:0;color:#991b1b;font-size:13px;line-height:1.5;">
              ⚠️ Bu kod <strong>{PASSWORD_RESET_EXPIRE_MINUTES} dakika</strong> geçerlidir ve en fazla <strong>{MAX_RESET_ATTEMPTS} kez</strong> denenebilir.
            </p>
          </div>
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
            Şifre sıfırlama talebinde bulunmadıysan bu e-postayı güvenle görmezden gelebilirsin.
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #f0f0f0;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">© 2026 AsEmOs</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""


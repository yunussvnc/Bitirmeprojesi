# Google/Apple Sosyal Giriş Kurulum Checklist

Bu dosya provider console tarafında yapılacak işleri özetler. Secret veya gerçek client ID değerlerini commit etmeyin; değerleri backend `.env`, mobil `.env.local` veya EAS environment üzerinden verin.

## Google

- Google Cloud Console'da OAuth consent screen'i yapılandırın ve yayın durumunu test/production ihtiyacına göre ayarlayın.
- Web, iOS ve Android OAuth client'larını oluşturun.
- iOS client için bundle identifier: `com.asemos.mobile`.
- Android client için package name: `com.asemos.mobile`; release/debug SHA-1 değerlerini ekleyin.
- Mobile env değerlerini girin:
  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
  - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
  - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- Backend env değerlerini girin:
  - `GOOGLE_CLIENT_ID`: mobilin gönderdiği ID token audience değeri.
  - `GOOGLE_ALLOWED_CLIENT_IDS`: birden fazla audience kabul edilecekse virgülle ayrılmış client ID listesi.

## Apple

- Apple Developer hesabında uygulama identifier için Sign in with Apple capability'sini açın.
- Expo/EAS iOS build için `ios.usesAppleSignIn=true` ayarı repoda eklidir; yeni iOS build alın.
- Backend env değerlerini girin:
  - `APPLE_CLIENT_ID=com.asemos.mobile` native iOS identity token için bundle id.
  - `APPLE_ALLOWED_CLIENT_IDS`: web/service id gibi ek audience değerleri gerekirse virgülle ayrılmış liste.
- Apple ilk girişten sonra email'i tekrar göndermeyebilir. Backend şu an güvenli şekilde email olmayan identity token'ı reddeder; provider id kalıcı eşleme istenirse kullanıcı modeline Apple `sub` alanı eklenmelidir.

## Doğrulama

- Backend artık Google ve Apple token'larını imza, issuer, audience ve süre kontrollerinden geçirir.
- Gerçek login testi için provider console ayarları ve env değerleri tamamlandıktan sonra yeni mobile build ile cihazda test edin.

# Social login setup (short)

Full step-by-step guide (Turkish): **[docs/KURULUM_SOSYAL_GIRIS.md](docs/KURULUM_SOSYAL_GIRIS.md)**

Branch / PR strategy: **[docs/KATKI_BRANCH_REHBERI.md](docs/KATKI_BRANCH_REHBERI.md)**

## Quick checklist

- Configure Google OAuth (Web, iOS `com.asemos.mobile`, Android + SHA-1).
- **Web OAuth client → Authorized redirect URIs** (add every URI your build uses):
  - `asemos://oauthredirect` (Expo scheme in `app.json`: `asemos`, path `oauthredirect`)
  - Optional native form: `com.asemos.mobile:/oauthredirect`
- Enable Sign in with Apple on the App ID; rebuild iOS with EAS (`usesAppleSignIn` + `expo-apple-authentication` plugin).
- Set backend env: `GOOGLE_CLIENT_ID`, `GOOGLE_ALLOWED_CLIENT_IDS`, `APPLE_CLIENT_ID`, `APPLE_ALLOWED_CLIENT_IDS`.
- Set mobile env / EAS secrets: `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` (never commit real values).
- Test on device with a new native build (not Expo Go alone for Google).
- Apple ilk girişten sonra email'i tekrar göndermeyebilir; backend email olmayan identity token'ı güvenli şekilde reddeder.

Redirect URI is built in `apps/mobile/src/config/socialAuth.ts` via `getGoogleRedirectUri()`. Log it in dev if Google returns `redirect_uri_mismatch`.

**Never commit** .env, secrets, or real client secrets to Git.

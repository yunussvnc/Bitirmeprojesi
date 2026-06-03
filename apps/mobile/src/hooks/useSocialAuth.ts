import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import {
  getGoogleClientIdConfigError,
  googleAuthRequestConfig,
  hasGoogleClientIdForPlatform,
} from '@/src/config/socialAuth';
import { appleLogin, googleLogin, type AuthTokens } from '@/src/services/authService';
import { useAuthStore } from '@/src/store/useAuthStore';
import { getAuthUserMessage } from '@/src/utils/authErrors';
import { success } from '@/src/utils/haptics';

type RoleType = 'user' | 'venue';

function navigateAfterAuth(data: AuthTokens) {
  if (data.user.role === 'venue') {
    router.replace('/(venue-tabs)' as never);
    return;
  }
  if (!data.user.username || !data.user.birth_date) {
    router.replace('/first-time-setup' as never);
  } else {
    router.replace('/(tabs)/' as never);
  }
}

function assertRoleMatch(data: AuthTokens, roleType: RoleType) {
  if (roleType === 'venue' && data.user.role !== 'venue') {
    throw new Error('Mekan kayıtları sosyal medya ile yapılamaz. Lütfen başvuru formunu doldurun.');
  }
  if (roleType === 'user' && data.user.role === 'venue') {
    throw new Error('Girdiğiniz hesap bir mekan hesabı. Lütfen "Mekan" sekmesinden giriş yapın.');
  }
}

export function useSocialAuth(roleType: RoleType) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    ...googleAuthRequestConfig,
    scopes: [...googleAuthRequestConfig.scopes],
  });

  const finishSocialLogin = useCallback(
    async (token: string) => {
      setLoading(true);
      try {
        const data = await googleLogin(token);
        assertRoleMatch(data, roleType);
        useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
        useAuthStore.getState().setUser(data.user);
        success();
        navigateAfterAuth(data);
      } catch (err: unknown) {
        Alert.alert(t('auth.login_error_title'), getAuthUserMessage(err, t));
      } finally {
        setLoading(false);
      }
    },
    [roleType, t],
  );

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success' && response.authentication) {
      const token =
        response.authentication.idToken || response.authentication.accessToken;
      if (token) finishSocialLogin(token);
      return;
    }
    if (response.type === 'error' || response.type === 'dismiss') {
      if (response.type === 'error') {
        Alert.alert(t('auth.login_error_title'), t('auth.google_login_failed'));
      }
    }
  }, [response, finishSocialLogin, t]);

  const promptGoogle = useCallback(async () => {
    if (!hasGoogleClientIdForPlatform()) {
      Alert.alert(t('auth.login_error_title'), getGoogleClientIdConfigError());
      return;
    }
    if (__DEV__ && !request) {
      Alert.alert(t('auth.google_dev_title'), t('auth.google_dev_body'), [
        { text: t('common.ok') },
      ]);
      return;
    }
    await promptAsync({ useProxy: false, showInRecents: true });
  }, [promptAsync, request, t]);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert(t('auth.login_error_title'), t('auth.apple_ios_only'));
      return;
    }
    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) {
      Alert.alert(t('auth.login_error_title'), t('auth.apple_unavailable'));
      return;
    }
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        Alert.alert(t('auth.login_error_title'), t('auth.apple_login_failed'));
        return;
      }
      setLoading(true);
      const data = await appleLogin(credential.identityToken);
      assertRoleMatch(data, roleType);
      useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
      useAuthStore.getState().setUser(data.user);
      success();
      navigateAfterAuth(data);
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err?.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert(t('auth.login_error_title'), getAuthUserMessage(e, t));
    } finally {
      setLoading(false);
    }
  }, [roleType, t]);

  return {
    loading,
    setLoading,
    promptGoogle,
    signInWithApple,
    googleRequestReady: Boolean(request),
  };
}

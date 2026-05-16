/**
 * Error Boundary – React hata yakalama
 * Uygulama çökmesini önler, kullanıcıya anlamlı mesaj gösterir.
 */

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { spacing } from "@/src/constants/design";
import { useTranslation } from "react-i18next";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { captureException, addBreadcrumb } from "@/src/services/sentryService";
import { analytics, AnalyticsEvents } from "@/src/services/analyticsService";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);

    // Sentry'ye hata gönder (production'da da çalışır)
    captureException(error, {
      componentStack: errorInfo.componentStack,
      source: "ErrorBoundary",
    });

    // Analitik: Crash recovery kaydı
    analytics.track(AnalyticsEvents.CRASH_RECOVERED, {
      error_name: error.name,
      error_message: error.message,
    });

    if (__DEV__) {
      console.error("ErrorBoundary caught:", error, errorInfo);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          onRetry={this.reset}
        />
      );
    }
    return this.props.children;
  }
}

function ErrorBoundaryFallback({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  const { t } = useTranslation();

  // Hardcoded colors — ErrorBoundary MUST NOT depend on ThemeProvider
  // If ThemeProvider crashes, this fallback would also crash (cascade failure)
  return (
    <View style={[styles.container, { backgroundColor: '#0a0a0a' }]}>
      <IconSymbol name="exclamationmark.triangle.fill" size={64} color="#f87171" />
      <Text style={[styles.title, { color: '#ffffff' }]}>{t("error_extra.something_went_wrong")}</Text>
      <Text style={[styles.message, { color: '#9ca3af' }]}>
        {t("error_extra.unexpected_error")}
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#6366f1' }]}
        onPress={onRetry}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { color: '#ffffff' }]}>{t("common.retry")}</Text>
      </TouchableOpacity>
      {__DEV__ && (
        <Text style={[styles.debug, { color: '#666666' }]} numberOfLines={3}>
          {error.message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  title: {
    marginTop: spacing.lg,
    fontSize: 20,
  },
  message: {
    marginTop: spacing.sm,
    textAlign: "center",
    fontSize: 15,
  },
  button: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  debug: {
    marginTop: spacing.xl,
    fontSize: 11,
    fontFamily: "monospace",
  },
});

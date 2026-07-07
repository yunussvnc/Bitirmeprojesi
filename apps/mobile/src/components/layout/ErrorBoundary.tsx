import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing, radius } from '@/src/constants/design';
import { IconSymbol } from '@/src/components/ui/icon-symbol';

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <LottieView
        source={require('@/assets/animations/empty-box.json')}
        autoPlay
        loop
        style={{ width: 200, height: 200 }}
        colorFilters={[
          {
            keypath: "Shape Layer 1",
            color: colors.accent.primary,
          },
        ]}
      />
      <Text style={[styles.title, { color: colors.text.primary }]}>
        Hata Oluştu!
      </Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
        Beklenmedik bir sorun meydana geldi. Ekibimize bilgi verildi, lütfen tekrar deneyin.
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.accent.primary }]}
        onPress={retry}
        activeOpacity={0.8}
      >
        <IconSymbol name="arrow.clockwise" size={20} color="#fff" />
        <Text style={styles.buttonText}>Yeniden Dene</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    gap: spacing.sm,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '../../hooks/useTheme';
import { createTextStyle, spacing } from '@/src/constants/design';

interface LottieEmptyStateProps {
  title: string;
  description?: string;
}

export const LottieEmptyState: React.FC<LottieEmptyStateProps> = ({ title, description }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../../assets/animations/empty-box.json')}
        autoPlay
        loop
        style={styles.animation}
      />
      <Text style={[createTextStyle('body', 'medium'), { color: colors.text.primary, marginTop: spacing.lg, textAlign: 'center' }]}>
        {title}
      </Text>
      {description && (
        <Text style={[createTextStyle('bodySmall', 'regular'), { color: colors.text.secondary, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.xl }]}>
          {description}
        </Text>
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  animation: {
    width: width * 0.5,
    height: width * 0.5,
  },
});

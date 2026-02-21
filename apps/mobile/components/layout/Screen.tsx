/**
 * Screen Component
 * 
 * Base screen wrapper with safe area and scroll support.
 * Standardized spacing and layout for all screens.
 * 
 * @module components/layout/Screen
 */

import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ViewStyle,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { spacing as designSpacing } from '@/constants/design';

export interface ScreenProps {
  /**
   * Screen content
   */
  children: React.ReactNode;
  
  /**
   * Enable scrolling
   * @default true
   */
  scrollable?: boolean;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
  
  /**
   * Content container style
   */
  contentContainerStyle?: ViewStyle;
  
  /**
   * Pull-to-refresh handler
   */
  onRefresh?: () => void | Promise<void>;
  
  /**
   * Refresh state
   */
  refreshing?: boolean;
  
  /**
   * Include tab bar spacing at bottom
   * Use true when screen is inside tab navigator
   * @default false
   */
  withTabBar?: boolean;
  
  /**
   * Include header spacing at top
   * @default false
   */
  withHeader?: boolean;
}

export interface ScreenRef {
  scrollToTop: () => void;
}

/**
 * Screen Component
 * 
 * Base screen wrapper with safe area handling and optional scrolling.
 * Standardized spacing: horizontal padding + bottom padding for tab bar.
 * 
 * @example
 * ```tsx
 * <Screen withTabBar>
 *   <Text>Screen content</Text>
 * </Screen>
 * ```
 */
export const Screen = forwardRef<ScreenRef, ScreenProps>(({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  onRefresh,
  refreshing = false,
  withTabBar = false,
  withHeader = false,
}, ref) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  // Expose scrollToTop method
  useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    },
  }));

  // Standard spacing: horizontal padding from design tokens
  const horizontalPadding = designSpacing.screenPadding;
  
  // Top padding: safe area inset (status bar / notch) + extra visual spacing
  const topPadding = insets.top + designSpacing.base;
  
  // Bottom padding: clear gap above tab bar
  // Tab bar is absolute positioned: ~88px on iOS, ~60px on Android
  const bottomPadding = withTabBar 
    ? (Platform.OS === 'ios' ? 100 : 72)
    : designSpacing.xxl;

  const containerStyle = [
    styles.container,
    { backgroundColor: colors.background.primary },
    style,
  ];

  if (scrollable) {
    return (
      <View style={containerStyle}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: horizontalPadding,
              paddingTop: topPadding,
              paddingBottom: bottomPadding,
            },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          decelerationRate="normal"
          overScrollMode="never"
          bounces={true}
          bouncesZoom={false}
          alwaysBounceVertical={false}
          directionalLockEnabled={true}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent.primary}
                colors={[colors.accent.primary]}
                progressViewOffset={0}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <View 
        style={[
          styles.content, 
          { 
            paddingHorizontal: horizontalPadding,
            paddingTop: topPadding,
            paddingBottom: bottomPadding,
          },
          contentContainerStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
});
Screen.displayName = 'Screen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
});

/**
 * Master Professional Placeholder Screen
 *
 * Provides a high-end, premium "under construction" or "feature coming soon"
 * experience using subtle animations, gradients, and typography.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { createTextStyle, spacing } from '@/src/constants/design';
import { lightImpact } from '@/src/utils/haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
    title: string;
    description?: string;
    iconName?: React.ComponentProps<typeof IconSymbol>['name'];
}

export default function PlaceholderSettingsScreen({
    title,
    description = 'Bu özellik üzerinde özenle çalışıyoruz.\nÇok yakında güçlü bir deneyimle karşınızda olacak.',
    iconName = 'sparkles',
}: Props) {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    // Gentle floating animation
    const floatAnim = useSharedValue(0);

    useEffect(() => {
        floatAnim.value = withRepeat(
            withSequence(
                withTiming(-8, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
            ),
            -1, // Infinite
            true // Reverse
        );
    }, [floatAnim]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: floatAnim.value }],
    }));

    // Glow colors based on theme
    const glowStart = isDark ? 'rgba(78, 205, 196, 0.12)' : 'rgba(78, 205, 196, 0.15)';
    const glowEnd = isDark ? 'rgba(26, 26, 26, 0)' : 'rgba(250, 250, 250, 0)';

    return (
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
            {/* Background ambient glow */}
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                <LinearGradient
                    colors={[glowStart, glowEnd]}
                    style={{ width, height: width * 1.2 }}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />
            </View>

            {/* Header */}
            <View
                style={[
                    styles.header,
                    {
                        paddingTop: insets.top + (Platform.OS === 'ios' ? 12 : 16),
                        borderBottomColor: colors.surface.border,
                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)',
                    },
                ]}
            >
                <TouchableOpacity
                    onPress={() => {
                        lightImpact();
                        router.back();
                    }}
                    hitSlop={20}
                    style={styles.backBtn}
                    activeOpacity={0.6}
                >
                    <IconSymbol name="chevron.left" size={26} color={colors.text.primary} />
                </TouchableOpacity>

                <Text style={[createTextStyle('title', colors.text.primary), styles.title]} numberOfLines={1}>
                    {title}
                </Text>
                <View style={styles.backBtn} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Animated.View entering={FadeInDown.duration(800).springify()} style={[styles.iconWrapper, animatedStyle]}>
                    <View style={[styles.halo, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]} />

                    <LinearGradient
                        colors={[colors.accent.primary, isDark ? '#2E8B83' : '#6DDAD0']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                            styles.iconContainer,
                            {
                                shadowColor: colors.accent.primary,
                                shadowOffset: { width: 0, height: 8 },
                                shadowOpacity: 0.3,
                                shadowRadius: 16,
                                elevation: 10,
                            },
                        ]}
                    >
                        <IconSymbol name={iconName} size={42} color="#FFFFFF" />
                    </LinearGradient>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).duration(800).springify()}>
                    <Text style={[createTextStyle('title', colors.text.primary), styles.subtitle]}>Çok Yakında.</Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(350).duration(800).springify()}>
                    <Text style={[createTextStyle('body', colors.text.secondary), styles.description]}>{description}</Text>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.base,
        paddingBottom: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        zIndex: 10,
    },
    backBtn: {
        minWidth: 44,
        height: 44,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxl,
        marginTop: -40,
    },
    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xxl,
    },
    halo: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
    },
    iconContainer: {
        width: 90,
        height: 90,
        borderRadius: 36, // Squircle profile
        alignItems: 'center',
        justifyContent: 'center',
    },
    subtitle: {
        fontSize: 26,
        fontWeight: '800',
        marginBottom: spacing.md,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.8,
    },
});

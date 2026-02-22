/**
 * Create Bottom Sheet for Profile 
 * 
 * Shows a bottom sheet when clicking the '+' icon
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    PanResponder,
    Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol, IconSymbolName } from "@/src/components/ui/icon-symbol";
import { spacing } from "@/src/constants/design";
import { lightImpact } from "@/src/utils/haptics";
import { useRouter } from "expo-router";

const SCREEN_HEIGHT = Dimensions.get("window").height;
// 6 items + header ~ 400px height
const SHEET_HEIGHT = 440;

export interface CreateBottomSheetProps {
    visible: boolean;
    onClose: () => void;
}

interface CreateOption {
    id: string;
    label: string;
    icon: IconSymbolName;
    badge?: string;
    onPress: () => void;
}

export function CreateBottomSheet({ visible, onClose }: CreateBottomSheetProps) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);

    // Height animasyonu (native driver kapalı — height animate edilemez native'de)
    const animHeight = useRef(new Animated.Value(0)).current;
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    const closeSheet = useCallback(() => {
        animHeight.stopAnimation();
        Animated.spring(animHeight, {
            toValue: 0,
            useNativeDriver: false,
            damping: 24,
            stiffness: 220,
            mass: 0.8,
            overshootClamping: true,
        }).start(({ finished }) => {
            if (finished) {
                setModalVisible(false);
                onCloseRef.current();
            }
        });
    }, [animHeight]);

    const openSheet = useCallback(() => {
        animHeight.stopAnimation();
        setModalVisible(true);
        animHeight.setValue(0);
        Animated.spring(animHeight, {
            toValue: SHEET_HEIGHT,
            useNativeDriver: false,
            damping: 24,
            stiffness: 220,
            mass: 0.8,
            overshootClamping: true,
        }).start();
    }, [animHeight]);

    const closeSheetRef = useRef(closeSheet);
    closeSheetRef.current = closeSheet;
    const openSheetRef = useRef(openSheet);
    openSheetRef.current = openSheet;

    useEffect(() => {
        if (visible) {
            openSheetRef.current();
        }
    }, [visible]);

    const startHeightRef = useRef(SHEET_HEIGHT);

    const panResponder = React.useMemo(
        () => PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => false,
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
            onMoveShouldSetPanResponderCapture: () => false,
            onPanResponderTerminationRequest: () => false,
            onPanResponderGrant: () => {
                startHeightRef.current = SHEET_HEIGHT;
            },
            onPanResponderMove: (_, g) => {
                const next = startHeightRef.current - g.dy;
                const clamped = Math.max(0, Math.min(SHEET_HEIGHT + 30, next));
                animHeight.setValue(clamped);
            },
            onPanResponderRelease: (_, g) => {
                if (g.dy > 80 || g.vy > 0.5) {
                    closeSheetRef.current();
                } else {
                    openSheetRef.current();
                }
            },
        }),
        [animHeight, closeSheetRef, openSheetRef]
    );

    // Options configuration
    const options: CreateOption[] = [
        {
            id: "reels",
            label: "Reels Videosu",
            icon: "play.rectangle",
            onPress: () => {
                // Navigasyon rotası (gelecekte eklenecekse vs.)
                lightImpact();
                onClose();
                router.push("/contentCreation/CreatePostScreen" as any);
            },
        },
        {
            id: "edits",
            label: "Edits",
            icon: "rectangle.split.2x2",
            badge: "NEW",
            onPress: () => {
                lightImpact();
                onClose();
            },
        },
        {
            id: "post",
            label: "Gönderi",
            icon: "square.grid.3x3",
            onPress: () => {
                lightImpact();
                onClose();
                router.push("/contentCreation/CreatePostScreen" as any);
            },
        },
        {
            id: "story",
            label: "Hikaye",
            icon: "plus.circle",
            onPress: () => {
                lightImpact();
                onClose();
                router.push("/contentCreation/CreatePostScreen" as any);
            },
        },
        {
            id: "highlight",
            label: "Öne Çıkanlar",
            icon: "heart.circle",
            onPress: () => {
                lightImpact();
                onClose();
                router.push("/profile/create-highlight" as any);
            },
        },
        {
            id: "live",
            label: "Canlı",
            icon: "dot.radiowaves.left.and.right",
            onPress: () => {
                lightImpact();
                onClose();
            },
        },
    ];

    return (
        <Modal
            visible={modalVisible}
            transparent
            animationType="fade"
            onShow={() => { }}
            onRequestClose={() => closeSheet()}
        >
            <View style={styles.overlay}>
                {/* Backdrop (tıklanınca kapansın) */}
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => closeSheet()} />

                {/* Sheet gövdesi */}
                <Animated.View
                    style={[
                        styles.sheetContainer,
                        { backgroundColor: colors.surface.elevated, height: animHeight, paddingBottom: insets.bottom || 20 },
                    ]}
                >
                    {/* Handle (tutup çekme çubuğu) */}
                    <View {...panResponder.panHandlers} style={styles.dragArea}>
                        <View style={[styles.handle, { backgroundColor: colors.surface.border }]} />
                        <Text style={[styles.title, { color: colors.text.primary }]}>Oluştur</Text>
                        <View style={styles.headerSeparator} />
                    </View>

                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={styles.optionRow}
                            activeOpacity={0.7}
                            onPress={option.onPress}
                        >
                            <View style={[styles.iconContainer, { borderColor: colors.surface.border }]}>
                                <IconSymbol name={option.icon as any} size={22} color={colors.text.primary} />
                            </View>
                            <Text style={[styles.optionLabel, { color: colors.text.primary }]}>{option.label}</Text>

                            {option.badge && (
                                <View style={[styles.badgeContainer, { backgroundColor: colors.accent.primary }]}>
                                    <Text style={[styles.badgeText, { color: "#fff" }]}>{option.badge}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}

                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    sheetContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: "hidden",
    },
    dragArea: {
        alignItems: "center",
        paddingTop: 12,
        paddingBottom: 4,
        width: "100%",
        backgroundColor: "transparent",
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        marginBottom: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 16,
    },
    headerSeparator: {
        width: "100%",
        height: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(100,100,100,0.3)",
        marginBottom: 8,
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    iconContainer: {
        width: 32,
        alignItems: "flex-start",
        justifyContent: "center",
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: "500",
        flex: 1,
    },
    badgeContainer: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: "700",
    },
});

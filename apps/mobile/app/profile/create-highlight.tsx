import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, useWindowDimensions, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useTheme } from "@/src/hooks/useTheme";
import { createTextStyle } from "@/src/constants/design";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { lightImpact } from "@/src/utils/haptics";

const GRID_GAP = 1;
const GRID_COLS = 3;

interface ArchiveStory {
    id: string;
    image: string;
    dateStr: string;
    durationStr: string;
}

// Dummy data for archive UI match
const DUMMY_ARCHIVE: ArchiveStory[] = [
    { id: "1", image: "https://picsum.photos/400/600?random=1", dateStr: "2\nAra", durationStr: "0:20" },
    { id: "2", image: "https://picsum.photos/400/600?random=2", dateStr: "11\nAra", durationStr: "0:13" },
    { id: "3", image: "https://picsum.photos/400/600?random=3", dateStr: "31\nAra", durationStr: "0:15" },
    { id: "4", image: "https://picsum.photos/400/600?random=4", dateStr: "12\nOca", durationStr: "0:20" },
    { id: "5", image: "https://picsum.photos/400/600?random=5", dateStr: "4\nOca", durationStr: "0:20" },
    { id: "6", image: "https://picsum.photos/400/600?random=6", dateStr: "15\nOca", durationStr: "0:05" },
    { id: "7", image: "https://picsum.photos/400/600?random=7", dateStr: "16\nOca", durationStr: "0:20" },
    { id: "8", image: "https://picsum.photos/400/600?random=8", dateStr: "25\nOca", durationStr: "0:17" },
    { id: "9", image: "https://picsum.photos/400/600?random=9", dateStr: "21\nŞub", durationStr: "1:00" },
];

export default function CreateHighlightRoute() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const cellSize = (width - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelect = (id: string) => {
        lightImpact();
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const renderItem = ({ item }: { item: ArchiveStory }) => {
        const isSelected = selectedIds.has(item.id);
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => toggleSelect(item.id)}
                style={{
                    width: cellSize,
                    height: cellSize * 1.8, // Portre oranı
                    marginBottom: GRID_GAP,
                    marginRight: GRID_GAP,
                    position: "relative",
                    backgroundColor: colors.surface.elevated,
                }}
            >
                <Image
                    source={{ uri: item.image }}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                />
                {/* Date Badge */}
                <View style={styles.dateBadge}>
                    <Text style={styles.dateText}>{item.dateStr}</Text>
                </View>

                {/* Selected Circle */}
                <View style={styles.circleContainer}>
                    <View style={[styles.circleWrap, isSelected && styles.circleWrapSelected]}>
                        {isSelected ? (
                            <View style={[styles.circleInner, { backgroundColor: colors.accent.primary }]}>
                                <IconSymbol name="checkmark" size={14} color="#fff" />
                            </View>
                        ) : (
                            <View style={[styles.circleInnerEmpty, { borderColor: "#fff" }]} />
                        )}
                    </View>
                </View>

                {/* Duration Label */}
                <Text style={styles.durationText}>{item.durationStr}</Text>

                {/* Dark Overlay when selected */}
                {isSelected && <View style={[StyleSheet.absoluteFillObject, styles.selectedOverlay]} />}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: '#000' }]}>
            <StatusBar barStyle="light-content" />

            {/* ── Header ── */}
            <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: '#000' }]}>
                <TouchableOpacity
                    onPress={() => {
                        lightImpact();
                        router.back();
                    }}
                    hitSlop={12}
                    style={styles.headerBtnLeft}
                >
                    <Text style={[styles.headerActionText, { color: colors.accent.primary }]}>İptal</Text>
                </TouchableOpacity>

                <Text style={[createTextStyle("title", "#fff"), styles.headerTitle]} numberOfLines={1}>
                    Öne çıkanlara ekle
                </Text>

                <TouchableOpacity
                    onPress={() => {
                        if (selectedIds.size > 0) {
                            lightImpact();
                            router.push("/profile/edit-highlight" as any);
                        }
                    }}
                    hitSlop={12}
                    style={styles.headerBtnRight}
                    disabled={selectedIds.size === 0}
                >
                    <Text style={[styles.headerActionText, { color: selectedIds.size > 0 ? colors.accent.primary : '#555', fontWeight: '700' }]}>
                        İleri
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={DUMMY_ARCHIVE}
                keyExtractor={(item) => item.id}
                numColumns={GRID_COLS}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#333',
    },
    headerBtnLeft: {
        width: 60,
        alignItems: "flex-start",
        justifyContent: "center",
    },
    headerBtnRight: {
        width: 60,
        alignItems: "flex-end",
        justifyContent: "center",
    },
    headerActionText: {
        fontSize: 16,
        fontWeight: "400",
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "600",
        flex: 1,
        textAlign: 'center',
    },
    dateBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 32,
        alignItems: 'center',
    },
    dateText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 14,
    },
    circleContainer: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    circleWrap: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleWrapSelected: {
        // optional drop shadow when selected
    },
    circleInner: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleInnerEmpty: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    durationText: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    selectedOverlay: {
        backgroundColor: 'rgba(255,255,255,0.2)', // Light white overlay when selected
        zIndex: -1, // Make sure it's below text
    }
});

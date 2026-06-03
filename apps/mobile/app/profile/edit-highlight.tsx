import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, useWindowDimensions, StatusBar, TextInput } from "react-native";
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
    durationStr: string;
}

// Dummy data for edit highlight UI
const DUMMY_ARCHIVE: ArchiveStory[] = [
    { id: "1", image: "https://picsum.photos/400/600?random=1", durationStr: "0:15" },
    { id: "2", image: "https://picsum.photos/400/600?random=2", durationStr: "0:05" },
    { id: "3", image: "https://picsum.photos/400/600?random=3", durationStr: "0:12" },
    { id: "4", image: "https://picsum.photos/400/600?random=4", durationStr: "0:10" },
    { id: "5", image: "https://picsum.photos/400/600?random=5", durationStr: "0:08" },
    { id: "6", image: "https://picsum.photos/400/600?random=6", durationStr: "0:15" },
];

export default function EditHighlightRoute() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const cellSize = (width - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

    // Start with all selected for the "Seçilenler" tab
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(["1", "2", "3", "4", "5", "6"]));
    const [highlightName, setHighlightName] = useState(".");
    const [activeTab, setActiveTab] = useState<"selected" | "stories">("selected");

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

                {/* Top Right Heart Icon */}
                <View style={styles.topRightIcon}>
                    <IconSymbol name="heart" size={16} color="#fff" />
                </View>

                {/* Bottom Right Checkmark Circle */}
                <View style={styles.bottomRightIcon}>
                    {isSelected ? (
                        <View style={[styles.circleInner, { backgroundColor: colors.accent.primary, borderColor: '#fff', borderWidth: 1 }]}>
                            <IconSymbol name="checkmark" size={12} color="#fff" />
                        </View>
                    ) : (
                        <View style={[styles.circleInnerEmpty, { borderColor: "#fff" }]} />
                    )}
                </View>

                {/* Duration Label */}
                <Text style={styles.durationText}>{item.durationStr}</Text>

                {/* Semi-transparent overlay when unselected */}
                {!isSelected && <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,255,255,0.4)', zIndex: 0 }]} />}
            </TouchableOpacity>
        );
    };

    const dataToRender = activeTab === "selected"
        ? DUMMY_ARCHIVE // Display all in dummy so user can see toggle effect on "Seçilenler"
        : DUMMY_ARCHIVE; // Typically "Stories" tab displays the entire archive regardless of selection

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
                    Öne Çıkarmayı Düzenle
                </Text>

                <TouchableOpacity
                    onPress={() => {
                        lightImpact();
                        // Submit logic then navigate back
                        router.replace("/(tabs)/profile" as any);
                    }}
                    hitSlop={12}
                    style={styles.headerBtnRight}
                >
                    <Text style={[styles.headerActionText, { color: colors.accent.primary, fontWeight: '600' }]}>Bitti</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={dataToRender}
                keyExtractor={(item) => item.id}
                numColumns={GRID_COLS}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View>
                        {/* ── Cover Edit ── */}
                        <View style={styles.coverSection}>
                            <View style={styles.coverCircle}>
                                {/* Placeholder for cover image */}
                                <Image source={{ uri: "https://picsum.photos/400/600?random=1" }} style={styles.coverImageFill} contentFit="cover" />
                                <View style={styles.coverDarkOverlay} />
                            </View>
                            <TouchableOpacity activeOpacity={0.7} style={{ marginTop: 12 }}>
                                <Text style={{ color: colors.accent.primary, fontSize: 13, fontWeight: '600' }}>Kapağı Düzenle</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.separator} />

                        {/* ── Name Edit ── */}
                        <View style={styles.nameRow}>
                            <Text style={styles.nameLabel}>Ad</Text>
                            <TextInput
                                style={styles.nameInput}
                                value={highlightName}
                                onChangeText={setHighlightName}
                                placeholder="Öne Çıkanlar"
                                placeholderTextColor="#666"
                                selectionColor={colors.accent.primary}
                                autoCapitalize="none"
                                cursorColor={colors.accent.primary}
                            />
                        </View>

                        <View style={styles.separator} />

                        {/* ── Tabs ── */}
                        <View style={styles.tabsContainer}>
                            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab("selected")} activeOpacity={0.8}>
                                <Text style={[styles.tabText, activeTab === "selected" && styles.tabTextActive]}>Seçilenler</Text>
                                {activeTab === "selected" && <View style={styles.activeTabIndicator} />}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab("stories")} activeOpacity={0.8}>
                                <Text style={[styles.tabText, activeTab === "stories" && styles.tabTextActive]}>Hikayeler</Text>
                                {activeTab === "stories" && <View style={styles.activeTabIndicator} />}
                            </TouchableOpacity>
                        </View>
                    </View>
                }
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
        borderBottomColor: '#222',
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
    coverSection: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    coverCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 1.5,
        borderColor: '#fff',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111',
    },
    coverImageFill: {
        width: '100%',
        height: '100%',
    },
    coverDarkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#222',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    nameLabel: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '400',
        width: 60,
    },
    nameInput: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        paddingVertical: 0, // for Android
    },
    tabsContainer: {
        flexDirection: 'row',
        height: 48,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#222',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    tabText: {
        color: '#888',
        fontSize: 15,
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#fff',
    },
    activeTabIndicator: {
        position: 'absolute',
        bottom: -StyleSheet.hairlineWidth,
        left: 20,
        right: 20,
        height: 2,
        backgroundColor: '#fff',
    },
    topRightIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 1,
    },
    bottomRightIcon: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        zIndex: 2,
    },
    circleInner: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleInnerEmpty: {
        width: 20,
        height: 20,
        borderRadius: 10,
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
        zIndex: 1,
    },
});

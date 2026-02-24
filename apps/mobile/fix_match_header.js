const fs = require('fs');
let fileContent = fs.readFileSync('src/components/domain/matching/MatchScreen.tsx', 'utf-8');

// We will change the top header in the component return.
const returnStart = fileContent.indexOf('return (', fileContent.indexOf('const renderSwipeTab'));
const topHeaderStart = fileContent.indexOf('{/* Header with tabs + profile icon */}', returnStart);
const topHeaderEnd = fileContent.indexOf('{activeTab === "swipe" ? renderSwipeTab() : renderLikesTab()}', topHeaderStart);

const newHeader = `
            {/* Dynamic Sticky Header matching the Mockup */}
            <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
                {/* Left: Key & Back */}
                <View style={{ flexDirection: 'row', alignItems: 'center', position: 'absolute', left: 16, bottom: 8 }}>
                    <TouchableOpacity
                        onPress={() => router.push("/(tabs)/messages")}
                        hitSlop={12}
                        style={{ marginRight: 12 }}
                    >
                        <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <IconSymbol name="key.fill" size={20} color={ACCENT} />
                    <ThemedText style={{ fontSize: 16, fontWeight: '700', marginLeft: 6, color: colors.text.primary }}>0</ThemedText>
                </View>

                {/* Center: Dynamic Name from Candidate or active tab name */}
                <View style={{ flex: 1, alignItems: 'center' }}>
                    {activeTab === "swipe" && currentCandidate ? (
                        <ThemedText style={styles.headerNameText}>
                            {currentCandidate.display_name}, {currentCandidate.age}
                        </ThemedText>
                    ) : (
                        <ThemedText style={styles.headerNameText}>
                            {activeTab === "swipe" ? "Eşleşme" : "Beğeniler"}
                        </ThemedText>
                    )}
                </View>

                {/* Right: Flag */}
                <TouchableOpacity
                    style={{ position: 'absolute', right: 16, bottom: 8 }}
                    hitSlop={12}
                >
                    <IconSymbol name="flag.fill" size={20} color={ACCENT} />
                </TouchableOpacity>
            </View>

            {/* Segmented Control for Tabs */}
            <View style={styles.segmentedControlContainer}>
                <TouchableOpacity
                    style={[styles.segmentBtn, activeTab === "swipe" && styles.segmentBtnActive]}
                    onPress={() => setActiveTab("swipe")}
                >
                    <ThemedText style={[styles.segmentText, activeTab === "swipe" && styles.segmentTextActive]}>
                        Eşleşme
                    </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.segmentBtn, activeTab === "likes" && styles.segmentBtnActive]}
                    onPress={() => setActiveTab("likes")}
                >
                    <ThemedText style={[styles.segmentText, activeTab === "likes" && styles.segmentTextActive]}>
                        Beğeniler
                    </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.profileBtn}
                    onPress={() => router.push("/match-profile-setup")}
                >
                    <IconSymbol name="person.crop.circle.fill" size={24} color={ACCENT} />
                </TouchableOpacity>
            </View>

            `;

fileContent = fileContent.substring(0, topHeaderStart) + newHeader + fileContent.substring(topHeaderEnd);

// Also remove hingeHeader from renderProfileContent
fileContent = fileContent.replace(
    /\s*{\/\* Header Name \*\/}\s*<View style={styles\.hingeHeader}>[\s\S]*?<\/View>/g,
    ''
);

// Add New Styles
const stylesEnd = fileContent.lastIndexOf('});');
const addedStyles = `
    headerNameText: {
        fontSize: 20,
        fontWeight: "900",
        fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    segmentedControlContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "transparent",
    },
    segmentBtn: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginHorizontal: 4,
        backgroundColor: "rgba(0,0,0,0.05)",
    },
    segmentBtnActive: {
        backgroundColor: ACCENT,
    },
    segmentText: {
        fontSize: 14,
        fontWeight: "600",
        color: "rgba(0,0,0,0.6)",
    },
    segmentTextActive: {
        color: "#FFF",
    },
    profileBtn: {
        position: 'absolute',
        right: 16,
    },
`;
fileContent = fileContent.substring(0, stylesEnd) + addedStyles + fileContent.substring(stylesEnd);

fs.writeFileSync('src/components/domain/matching/MatchScreen.tsx', fileContent);

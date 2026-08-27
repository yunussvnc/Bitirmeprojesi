import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    /* Header */
    header: {
        flexDirection: "row",
        alignItems: "flex-end", // Align items to the bottom
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        position: "relative",
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "700",
        letterSpacing: -0.2,
        textAlign: "center",
        marginBottom: 2, // Slight adjustment for baseline
        flex: 1,
    },
    headerBtn: {
        position: "absolute",
        right: 16,
        bottom: 11, // Match the paddingBottom of header
        padding: 4,
        zIndex: 10,
    },
    headerLeftBtn: {
        position: "absolute",
        left: 16,
        bottom: 7, // Adjust to cleanly align flame horizontally with text
        padding: 4,
        zIndex: 10,
    },

    /* Search */
    searchSection: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        height: 38,
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
    },
    newChatBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },

    /* Section Header */
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
    },
    requestsLink: {
        fontSize: 14,
        fontWeight: "600",
    },

    /* Conversation Card */
    conversationCard: {
        marginHorizontal: 12,
        marginVertical: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        // 3D shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 6,
        // Subtle border for glass / depth effect
        borderWidth: 0.5,
        borderColor: "rgba(255,255,255,0.06)",
    },
    cardInner: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 4,
    },

    /* Separator */
    separator: {
        paddingHorizontal: 28,
        height: 1,
        justifyContent: "center",
    },
    separatorLine: {
        height: StyleSheet.hairlineWidth,
    },
    avatarContainer: {
        position: "relative",
        marginRight: 14,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    avatarPlaceholder: {
        backgroundColor: '#2a2a3a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: {
        fontSize: 20,
        fontWeight: '700',
        color: '#a0a0c0',
    },
    onlineDot: {
        position: "absolute",
        bottom: 1,
        right: 1,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: "#2ecc71",
        borderWidth: 2.5,
    },
    matchFlame: {
        position: "absolute",
        bottom: -2,
        left: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#1DB954",
        borderWidth: 2.5,
        alignItems: "center",
        justifyContent: "center",
    },
    cardContent: {
        flex: 1,
    },
    cardTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 3,
    },
    name: {
        fontSize: 15,
        fontWeight: "500",
        flex: 1,
        marginRight: 8,
    },
    time: {
        fontSize: 13,
        fontWeight: "400",
    },
    message: {
        fontSize: 14,
        fontWeight: "400",
        lineHeight: 19,
    },
    boldText: {
        fontWeight: "700",
    },

    /* Place Tag */
    placeTag: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        marginTop: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 4,
    },
    placeTagText: {
        fontSize: 12,
        fontWeight: "600",
    },

    /* Unread */
    unreadDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        marginLeft: 10,
    },

    /* Empty State */
    emptyState: {
        alignItems: "center",
        paddingTop: 80,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 8,
    },
    emptyDesc: {
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 28,
    },
    startBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    startBtnText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },

    /* Edit Mode Toolbar */
    editToolbar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        position: 'relative',
    },
    cancelEditBtn: {
        paddingVertical: 4,
        zIndex: 1,
    },
    cancelEditText: {
        fontSize: 15,
        fontWeight: "500",
    },
    editModeTitle: {
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 15,
        fontWeight: "600",
        zIndex: 0,
    },
    selectAllBtn: {
        paddingVertical: 4,
        zIndex: 1,
    },
    selectAllText: {
        fontSize: 15,
        fontWeight: "600",
    },

    /* Checkbox (Edit Mode) */
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        marginRight: 12,
        alignItems: "center",
        justifyContent: "center",
    },

    /* Swipe Actions */
    swipeActionsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingLeft: 8,
        paddingRight: 12,
        marginVertical: 4,
    },
    swipeActionBtn: {
        width: 56,
        height: '100%' as any,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
        gap: 4,
    },
    swipeActionLabel: {
        color: "#FFF",
        fontSize: 11,
        fontWeight: "600",
    },

    /* Floating Actions */
    floatingActions: {
        position: 'absolute',
        right: 20,
        alignItems: 'center',
    },
    fab: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    }
});

export default styles;

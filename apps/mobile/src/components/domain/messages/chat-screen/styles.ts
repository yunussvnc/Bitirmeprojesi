import { Dimensions, Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    /* Header */
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backBtn: {
        paddingRight: 8,
    },
    headerProfile: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    headerName: {
        fontSize: 16,
        fontWeight: "700",
    },
    headerStatus: {
        fontSize: 12,
        fontWeight: "400",
        marginTop: 1,
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
    },

    /* Messages */
    messageList: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 8,
    },


    /* Input Bar */
    inputBar: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 10,
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        gap: 6,
    },
    inputContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-end",
        borderRadius: 24,
        borderWidth: 1,
        paddingRight: 6,
        paddingVertical: 4,
        minHeight: 46,
        maxHeight: 120,
    },
    cameraBtn: {
        padding: 10,
        paddingRight: 4,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        paddingHorizontal: 8,
        paddingTop: Platform.OS === "ios" ? 10 : 8,
        paddingBottom: Platform.OS === "ios" ? 10 : 8,
        maxHeight: 100,
    },
    sendButton: {
        padding: 10,
        marginBottom: 1,
    },

    /* Modals */
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    optionsModal: {
        borderRadius: 16,
        overflow: "hidden",
    },
    optionBtn: {
        paddingVertical: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    optionText: {
        fontSize: 17,
        fontWeight: "400",
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        width: "100%",
    },

    /* Report Modal */
    reportModalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        padding: 20,
    },
    reportModalContent: {
        borderRadius: 16,
        padding: 20,
        width: "100%",
    },
    reportHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    reportTitle: {
        fontSize: 18,
        fontWeight: "700",
    },
    reportDesc: {
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    reportInputWrapper: {
        borderWidth: 1,
        borderRadius: 12,
        height: 150,
        marginBottom: 8,
        padding: 12,
    },
    reportInput: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
    },
    wordCount: {
        fontSize: 12,
        alignSelf: "flex-end",
        marginBottom: 20,
    },
    submitReportBtn: {
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    submitReportText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },


    // ── Preview Modal ──
    previewModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        justifyContent: 'flex-end',
    },
    previewModalContent: {
        flex: 1,
        backgroundColor: '#000',
    },
    previewTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    previewCancel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        fontWeight: '500',
    },
    previewTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    previewSendBtn: {
        backgroundColor: '#2ecc71',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    previewSendText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    previewImage: {
        flex: 1,
        width: '100%',
    },
    previewCaptionBar: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    previewCaptionInput: {
        fontSize: 15,
        minHeight: 40,
        maxHeight: 100,
    },

    // ── Image Viewer ──
    imageViewerOverlay: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageViewerContainer: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageViewerImage: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    imageViewerCloseBtn: {
        position: 'absolute',
        top: 52,
        right: 20,
        zIndex: 100,
    },
    imageViewerCloseBtnInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    imageViewerCloseX: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 18,
    },
    imageViewerHint: {
        position: 'absolute',
        bottom: 36,
        alignSelf: 'center',
    },
    imageViewerHintText: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 12,
        textAlign: 'center',
    },
    restrictionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    restrictionText: {
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
    },
});

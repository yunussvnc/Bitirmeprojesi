/**
 * Chat Screen
 *
 * Bireysel sohbet ekranı — mekan paylaşımı odaklı mesajlaşma.
 */

import React, { useRef, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    Platform,
    Keyboard,
} from "react-native";
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Image } from "expo-image";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { MessageBubble } from "./MessageBubble";
import { lightImpact } from "@/src/utils/haptics";
import { useAppStore } from "@/src/store/useAppStore";
import { useTranslation } from "react-i18next";
import { ChatActionModals } from './chat-screen/ChatActionModals';
import { ChatImageViewerModal } from './chat-screen/ChatImageViewerModal';
import { styles } from './chat-screen/styles';
import { useChatScreen } from './chat-screen/useChatScreen';
import { parseTargetUserId as _parseTargetUserId, type Message } from './chat-screen/types';

export default function ChatScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { chatId, name: nameParam, avatar: avatarParam, targetUserId: targetUserIdParam } = useLocalSearchParams<{ chatId: string; name?: string; avatar?: string; targetUserId?: string }>();
    const { t, i18n } = useTranslation();

    const flatListRef = useRef<FlatList>(null);

    const {
        inputText,
        setInputText,
        lastSeenId,
        isOptionsVisible,
        setIsOptionsVisible,
        isReportVisible,
        setIsReportVisible,
        reportText,
        handleReportTextChange,
        msgPermission,
        selectedImageUri,
        setSelectedImageUri,
        previewUri,
        setPreviewUri,
        contact,
        isBackendConv,
        visibleMessages,
        openImageViewer,
        sendMessage,
        handleCameraPress,
        sendImageMessage,
        handleDeleteMessage,
        resolvedChatId,
    } = useChatScreen({
        chatId: chatId as string | undefined,
        nameParam: nameParam as string | undefined,
        avatarParam: avatarParam as string | undefined,
        targetUserIdParam: targetUserIdParam as string | undefined,
        router,
        t,
        i18n,
    });

    const renderMessage = useCallback(({ item }: { item: Message }) => {
        const isLast = visibleMessages[visibleMessages.length - 1]?.id === item.id;
        return (
            <MessageBubble
                item={item}
                isLast={isLast}
                lastSeenId={lastSeenId}
                colors={colors}
                t={t}
                handleDeleteMessage={handleDeleteMessage}
                openImageViewer={openImageViewer}
                useAppStore={useAppStore}
                router={router}
            />
        );
    }, [colors, handleDeleteMessage, lastSeenId, openImageViewer, router, t, visibleMessages]);

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background.primary }]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={0}
        >
            <Stack.Screen 
                options={{ 
                    gestureEnabled: true, 
                    fullScreenGestureEnabled: true,
                    animation: "slide_from_right" 
                }} 
            />
            {/* ── Header ── */}
            <View
                style={[
                    styles.header,
                    {
                        paddingTop: insets.top + 4,
                        borderBottomColor: colors.surface.border,
                        backgroundColor: colors.background.primary,
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.backBtn}
                    hitSlop={12}
                    activeOpacity={0.7}
                    onPress={() => {
                        lightImpact();
                        router.back();
                    }}
                >
                    <IconSymbol name="chevron.left" size={26} color={colors.text.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.headerProfile}
                    activeOpacity={0.8}
                    onPress={() => {
                        // Önce gerçek backend user ID'yi dene, yoksa mock data için fallback kullan
                        const userId = contact.targetUserId || _parseTargetUserId(resolvedChatId);
                        if (userId) {
                            router.push(`/user/${userId}` as any);
                        }
                    }}
                >
                    <Image source={{ uri: contact.avatar }} style={styles.headerAvatar} contentFit="cover" />
                    <View>
                        <Text style={[styles.headerName, { color: colors.text.primary }]} numberOfLines={1}>
                            {contact.name}
                        </Text>
                        <Text style={[styles.headerStatus, { color: contact.isOnline ? "#2ecc71" : colors.text.tertiary }]}>
                            {contact.isOnline ? t("chat.online", "Çevrimiçi") : t("chat.last_seen_today", "Son görülme: bugün")}
                        </Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.headerActions}>

                    <TouchableOpacity
                        hitSlop={8}
                        activeOpacity={0.7}
                        onPress={() => {
                            lightImpact();
                            setIsOptionsVisible(true);
                        }}
                    >
                        <IconSymbol name="ellipsis" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Messages ── */}
            <FlatList
                ref={flatListRef}
                style={{ flex: 1 }}
                data={[...visibleMessages].reverse()}
                inverted={true}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={[styles.messageList, { paddingTop: 20 }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                onScrollBeginDrag={() => Keyboard.dismiss()}
            />

            {/* ── Kısıtlı Mod Bilgi Banner'ı ── */}
            {msgPermission && !msgPermission.can_send_media && isBackendConv && (
                <View style={[styles.restrictionBanner, { backgroundColor: colors.surface.elevated, borderTopColor: colors.surface.border }]}>
                    <IconSymbol name="lock.fill" size={13} color={colors.text.tertiary} />
                    <Text style={[styles.restrictionText, { color: colors.text.tertiary }]}>
                        {msgPermission.awaiting_reply
                            ? t("chat.restriction_awaiting", "Cevap bekleniyor — yeni mesaj gönderilemez")
                            : msgPermission.reason === "private_account_no_mutual"
                                ? t("chat.restriction_private", "Gizli hesap — mesaj göndermek için takipleşin")
                                : t("chat.restriction_limited", "Kısıtlı mod — karşılıklı takipleşince kısıtlamalar kalkar")}
                    </Text>
                </View>
            )}

            {/* ── Input Bar ── */}
            <View
                style={[
                    styles.inputBar,
                    {
                        paddingBottom: insets.bottom || 12,
                        backgroundColor: colors.background.primary,
                        borderTopColor: colors.surface.border,
                    },
                ]}
            >
                <View style={[styles.inputContainer, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
                    <TouchableOpacity
                        style={[styles.cameraBtn, msgPermission && !msgPermission.can_send_media && { opacity: 0.35 }]}
                        activeOpacity={0.7}
                        onPress={handleCameraPress}
                    >
                        <IconSymbol name="camera.fill" size={20} color={colors.accent.primary} />
                    </TouchableOpacity>

                    <TextInput
                        style={[styles.textInput, { color: colors.text.primary }]}
                        placeholder={
                            msgPermission && !msgPermission.can_send
                                ? t("chat.input_locked", "Mesaj gönderme kısıtlandı…")
                                : t("chat.type_message")
                        }
                        placeholderTextColor={colors.text.tertiary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={1000}
                        cursorColor={colors.accent.primary}
                        editable={!msgPermission || msgPermission.can_send}
                    />
                </View>

                {inputText.trim() ? (
                    <TouchableOpacity
                        style={styles.sendButton}
                        activeOpacity={0.7}
                        onPress={sendMessage}
                    >
                        <IconSymbol name="paperplane" size={20} color={colors.accent.primary} />
                    </TouchableOpacity>
                ) : null}
            </View>

            <ChatActionModals
                contactName={contact.name}
                optionsVisible={isOptionsVisible}
                onCloseOptions={() => setIsOptionsVisible(false)}
                onBlock={() => {
                    // Handler hook içinde; visible state kontrolü burada sağlandığı için sadece görünürlüğü kapatma mantığı korunur
                    setIsOptionsVisible(false);
                    // Block ve rapor işlemleri hook içinde Alert akışlarıyla tetiklenir
                    // useChatScreen bu modalların eylemlerini kapsıyor
                }}
                onOpenReport={() => {
                    setIsOptionsVisible(false);
                    setTimeout(() => setIsReportVisible(true), 300);
                }}
                reportVisible={isReportVisible}
                onCloseReport={() => {
                    setIsReportVisible(false);
                    handleReportTextChange("");
                }}
                reportText={reportText}
                onReportTextChange={handleReportTextChange}
                onSubmitReport={undefined as any}
                previewUri={previewUri}
                onClosePreview={() => setPreviewUri(null)}
                onSendPreview={sendImageMessage}
                caption={inputText}
                onCaptionChange={setInputText}
            />

            <ChatImageViewerModal
                imageUri={selectedImageUri}
                onDismiss={() => setSelectedImageUri(null)}
            />
        </KeyboardAvoidingView>
    );
}

import React from 'react';
import { Alert as RNAlert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { Router } from 'expo-router';
import type { TFunction, i18n as I18nInstance } from 'i18next';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useMessagesStore } from '@/src/store/useMessagesStore';
import { useChatMessagesStore } from '@/src/store/useChatMessagesStore';
import { useIslandStore } from '@/src/store/useIslandStore';
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';
import { API_BASE_URL } from '@/src/constants/api';
import { lightImpact, success } from '@/src/utils/haptics';
import { logger } from '@/src/utils/logger';
import { toggleBlockUser, createReport } from '@/src/services/moderationService';
import { getMessages as fetchBackendMessages, sendMessage as backendSendMessage, markMessagesRead, getConversationPermission, type ConversationPermission } from '@/src/services/messageService';
import { apiUploadFile } from '@/src/utils/apiClient';
import { parseTargetUserId, type Message } from './types';

interface UseChatScreenParams {
    chatId: string | undefined;
    nameParam?: string;
    avatarParam?: string;
    targetUserIdParam?: string;
    router: Router;
    t: TFunction;
    i18n: I18nInstance;
}

export function useChatScreen({ chatId, nameParam, avatarParam, targetUserIdParam, router, t, i18n }: UseChatScreenParams) {
    const resolvedChatId = chatId || '1';
    const currentUser = useAuthStore((s) => s.user);
    const accessToken = useAuthStore((s) => s.accessToken);
    const currentLocale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';

    const [inputText, setInputText] = React.useState('');
    const [lastSeenId, setLastSeenId] = React.useState<string | null>(null);
    const [isOptionsVisible, setIsOptionsVisible] = React.useState(false);
    const [isReportVisible, setIsReportVisible] = React.useState(false);
    const [reportText, setReportText] = React.useState('');
    const [msgPermission, setMsgPermission] = React.useState<ConversationPermission | null>(null);
    const [selectedImageUri, setSelectedImageUri] = React.useState<string | null>(null);
    const [previewUri, setPreviewUri] = React.useState<string | null>(null);

    const openImageViewer = React.useCallback((uri: string) => {
        setSelectedImageUri(uri);
    }, []);

    const lastStoredMsgIdRef = React.useRef<string | null>(null);

    const numericConvId = parseInt(resolvedChatId, 10);
    const isNumeric = !isNaN(numericConvId) && resolvedChatId === String(numericConvId);
    const isBackendConv = isNumeric;

    const [messages, setMessages] = React.useState<Message[]>(() => {
        const initial: Message[] = [];
        try {
            const storeData = useChatMessagesStore.getState().messagesByChat[resolvedChatId];
            if (storeData && storeData.length > 0) {
                const seenIds = new Set(initial.map((m) => m.id));
                const newFromStore: Message[] = storeData
                    .filter((m) => !seenIds.has(m.id))
                    .map((m) => ({
                        id: m.id,
                        text: m.text,
                        isMine: m.isMine,
                        timestamp: (() => {
                            try {
                                const d = new Date(m.timestamp);
                                return d.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
                            } catch { return m.timestamp; }
                        })(),
                        imageUri: m.imageUri,
                        status: m.status,
                        sharedPostId: m.sharedPostId,
                    }));
                return [...initial, ...newFromStore];
            }
        } catch { /* ignore */ }
        return initial;
    });

    const storeConversation = useMessagesStore((state) => state.conversations.find(c => c.id === resolvedChatId));

    const contact = React.useMemo(() => storeConversation ? {
        name: storeConversation.name,
        avatar: storeConversation.avatar,
        isOnline: storeConversation.isOnline,
        targetUserId: storeConversation.targetUserId,
    } : nameParam ? {
        name: decodeURIComponent(nameParam),
        avatar: avatarParam ? decodeURIComponent(avatarParam) : `https://ui-avatars.com/api/?name=${encodeURIComponent(nameParam)}&background=random`,
        isOnline: false,
        targetUserId: targetUserIdParam ? parseInt(targetUserIdParam, 10) : undefined,
    } : {
        name: 'Kullanıcı',
        avatar: 'https://ui-avatars.com/api/?name=K&background=random',
        isOnline: false,
        targetUserId: undefined,
    }, [avatarParam, nameParam, storeConversation, targetUserIdParam]);

    const visibleMessages = messages;

    React.useEffect(() => {
        useMessagesStore.getState().setActiveConversation(resolvedChatId);
        return () => {
            useMessagesStore.getState().setActiveConversation(null);
        };
    }, [resolvedChatId]);

    React.useEffect(() => {
        if (!isBackendConv || !accessToken) return;

        const WS_BASE = API_BASE_URL.replace(/^http/, 'ws');
        const wsUrl = `${WS_BASE}/api/v1/ws/chat/${numericConvId}?token=${accessToken}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
        };
        ws.onerror = (e) => {
            console.warn(`❌ Chat WS error:`, e);
        };
        ws.onclose = () => {
        };
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'message:status') {
                    const messageIds: string[] = (data.message_ids ?? (data.message_id ? [String(data.message_id)] : [])).map(String);
                    if (messageIds.length > 0 && data.status === 'read') {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.isMine && messageIds.includes(m.id)
                                    ? { ...m, status: 'read' as const }
                                    : m
                            )
                        );
                    }
                } else if (data.type === 'new_message' && data.message) {
                    const msg = data.message;
                    if (msg.sender_id !== currentUser?.id) {
                        setMessages((prev) => {
                            if (prev.some((m) => m.id === String(msg.id))) return prev;
                            return [...prev, {
                                id: String(msg.id),
                                text: msg.content ?? '',
                                isMine: false,
                                imageUri: msg.media_url ?? undefined,
                                timestamp: (() => {
                                    try {
                                        return new Date(msg.created_at).toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
                                    } catch { return ''; }
                                })(),
                            }];
                        });

                        useIslandStore.getState().showIsland({
                            title: contact?.name || 'Kullanıcı',
                            subtitle: msg.content || 'Yeni mesaj',
                            icon: (contact.avatar ? { uri: contact.avatar } : 'message') as any,
                            color: '#00C6FF',
                            duration: 4000,
                        });
                    }
                } else if (data.type === 'message:sent') {
                    const msg = data.message;
                    if (msg) {
                        setMessages((prev) =>
                            prev.map((m) =>
                                (m.status === 'sent' && m.text === msg.content)
                                    ? { ...m, id: String(msg.id), status: 'delivered' as const }
                                    : m
                            )
                        );
                    }
                }
            } catch { /* ignore parse errors */ }
        };

        return () => {
            ws.close(1000, 'Screen unmounted');
        };
    }, [accessToken, contact.avatar, contact.name, currentLocale, currentUser?.id, isBackendConv, numericConvId]);

    React.useEffect(() => {
        if (!isBackendConv) return;

        const myId = currentUser?.id;

        const loadMessages = async () => {
            try {
                const res = await fetchBackendMessages(numericConvId, 1, 100);
                if (res.items.length > 0) {
                    const backendMsgs: Message[] = res.items.map((m: any) => ({
                        id: String(m.id),
                        text: m.content,
                        isMine: m.sender_id === myId,
                        timestamp: (() => {
                            try {
                                return new Date(m.created_at).toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
                            } catch { return ''; }
                        })(),
                        status: m.sender_id === myId
                            ? (m.is_read ? 'read' as const : 'sent' as const)
                            : undefined,
                        sharedPostId: m.shared_post_id ?? undefined,
                        imageUri: m.media_url ? (m.media_url.startsWith('/') ? `${API_BASE_URL}${m.media_url}` : m.media_url) : undefined,
                        isStoryReply: m.message_type === 'story_reply',
                        storySnapshotUrl: m.story_snapshot_url ?? undefined,
                        parentStoryId: m.parent_story_id ?? undefined,
                    }));
                    setMessages((prev) => {
                        // Bellek Optimizasyonu (Erken Çıkış): 30 saniyelik polling'lerde gereksiz array/object allocation'ı önler.
                        // Geçici mesajları (temp_) filtrele, geriye kalanları backend'den gelenle karşılaştır.
                        const prevNonTemp = prev.filter(m => !m.id.startsWith('temp_') && Number(m.id) < 1_700_000_000_000);
                        let isIdentical = prevNonTemp.length === backendMsgs.length;
                        if (isIdentical) {
                            for (let i = 0; i < backendMsgs.length; i++) {
                                const oMsg = prevNonTemp[i];
                                const nMsg = backendMsgs[i];
                                // Eski mesaj 'delivered' ise ve backend 'sent' döndüyse (backend henüz read yapmamış), bunu değişiklik sayma
                                const isStatusSame = oMsg.status === nMsg.status || (oMsg.status === 'delivered' && nMsg.status === 'sent');
                                if (oMsg.id !== nMsg.id || !isStatusSame) {
                                    isIdentical = false;
                                    break;
                                }
                            }
                        }

                        // Eğer backend'den gelen veri ile elimizdeki onaylı veri tıpatıp aynıysa, state'i hiç ellemeyerek
                        // re-render ve GC baskısını (garbage collection) sıfıra indiriyoruz.
                        if (isIdentical) {
                            return prev;
                        }

                        const backendIdSet = new Set(backendMsgs.map(m => m.id));

                        const mergedMsgs = backendMsgs.map(newMsg => {
                            const oldMsg = prev.find(m => m.id === newMsg.id);
                            if (oldMsg) {
                                if (oldMsg.status === 'delivered' && newMsg.status === 'sent') {
                                    return { ...newMsg, status: 'delivered' as const };
                                }
                            }
                            return newMsg;
                        });

                        // Henüz backend'de olmayan optimistic (geçici ID'li) mesajları koru.
                        const pendingOptimistic = prev.filter(m => {
                            if (backendIdSet.has(m.id)) return false; // Backend zaten biliyor
                            if (!m.isMine) return false;              // Sadece kendi mesajlarımız
                            const isTemp = m.id.startsWith('temp_') || (Number(m.id) > 1_700_000_000_000);
                            return isTemp && m.status === 'sent';
                        });

                        return pendingOptimistic.length > 0
                            ? [...mergedMsgs, ...pendingOptimistic]
                            : mergedMsgs;
                    });

                    const latestMsg = backendMsgs[backendMsgs.length - 1];
                    if (latestMsg && backendMsgs.length > 0) {
                        const textToSave = latestMsg.text || (latestMsg.imageUri ? t('chat.photo', 'Fotoğraf 📷') : '');
                        const sender = latestMsg.isMine ? 'me' : contact.name || 'Kullanıcı';
                        const latestItem = res.items[res.items.length - 1];
                        const realTimestamp = latestItem?.created_at ? new Date(latestItem.created_at).getTime() : undefined;

                        setTimeout(() => {
                            const freshConvs = useMessagesStore.getState().conversations;
                            if (!freshConvs.some(c => c.id === chatId)) {
                                useMessagesStore.getState().addConversation({
                                    id: chatId as string,
                                    name: contact.name || 'Kullanıcı',
                                    username: '',
                                    avatar: contact.avatar || '',
                                    lastMessage: textToSave,
                                    lastMessageSender: sender as any,
                                    timestamp: new Date(latestMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    unread: !latestMsg.isMine,
                                    isOnline: contact.isOnline || false,
                                    lastMessageAt: realTimestamp ?? Date.now(),
                                });
                                lastStoredMsgIdRef.current = latestMsg.id;
                            } else {
                                const c = freshConvs.find(c => c.id === chatId);
                                const existingTs = c?.lastMessageAt ?? 0;
                                if (lastStoredMsgIdRef.current !== latestMsg.id) {
                                    lastStoredMsgIdRef.current = latestMsg.id;
                                    if (realTimestamp === undefined || realTimestamp >= existingTs) {
                                        useMessagesStore.getState().updateLastMessageAt(
                                            chatId as string,
                                            textToSave,
                                            new Date(latestMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                            sender as any,
                                            undefined,
                                            realTimestamp,
                                        );
                                    }
                                }
                                if (c?.isArchived) useMessagesStore.getState().unarchiveConversation(chatId as string);
                            }
                        }, 0);
                    }
                }

                const hasUnreadFromOther = res.items.some((m: any) => m.sender_id !== myId && !m.is_read);
                if (hasUnreadFromOther) {
                    markMessagesRead(numericConvId).catch(() => { });
                }
            } catch {
                if (__DEV__) logger.warn('[ChatScreen] Could not load messages for conv', numericConvId);
            }
        };

        loadMessages();
        const pollInterval = setInterval(loadMessages, 30000);
        return () => clearInterval(pollInterval);
    }, [chatId, contact.avatar, contact.isOnline, contact.name, currentLocale, currentUser?.id, isBackendConv, numericConvId, t]);

    React.useEffect(() => {
        if (!isBackendConv) {
            setMsgPermission({ can_send: true, can_send_media: true, hide_read_receipt: false, messages_sent_count: 0, awaiting_reply: false } as any);
            return;
        }
        const loadPerm = async () => {
            const perm = await getConversationPermission(numericConvId);
            setMsgPermission(perm);
        };
        loadPerm();
        const permInterval = setInterval(loadPerm, 30000);
        return () => clearInterval(permInterval);
    }, [isBackendConv, numericConvId]);

    const initialMessagesRef = React.useRef(messages);
    React.useEffect(() => {
        const initialMessages = initialMessagesRef.current;
        if (initialMessages.length > 0) {
            setLastSeenId(initialMessages[initialMessages.length - 1].id);
        }
    }, []);

    const handleBlock = React.useCallback(async () => {
        // BUG-13: Parse user id — prioritize contact.targetUserId
        const targetId = contact.targetUserId || parseTargetUserId(resolvedChatId);
        if (targetId !== null) {
            try {
                await toggleBlockUser(targetId);
            } catch { /* ignore */ }
        }
        success();
        Alert.alert(t('common.success'), t('chat.blocked_success', { name: contact.name }), [
            { text: t('common.ok'), onPress: () => router.replace('/settings/blocked-users' as any) }
        ]);
    }, [contact.name, contact.targetUserId, resolvedChatId, router, t]);

    const handleReport = React.useCallback(async () => {
        const charCount = reportText.trim().length;
        if (charCount === 0) {
            Alert.alert(t('common.error'), t('chat.report_empty'));
            return;
        }
        if (charCount > 500) {
            Alert.alert(t('common.error'), t('chat.report_max_chars'));
            return;
        }

        const targetId = contact.targetUserId || parseTargetUserId(resolvedChatId);
        if (targetId !== null) {
            try {
                await createReport({ target_type: 'user', target_id: targetId, reason: 'harassment', description: reportText.trim() });
                await toggleBlockUser(targetId);
            } catch { /* ignore */ }
        }
        success();
        Alert.alert(t('common.success'), t('chat.report_success', { name: contact.name }), [
            { text: t('common.ok'), onPress: () => router.replace('/settings/blocked-users' as any) }
        ]);
    }, [contact.name, contact.targetUserId, reportText, resolvedChatId, router, t]);

    const handleReportTextChange = React.useCallback((text: string) => {
        if (text.length <= 500) {
            setReportText(text);
        } else {
            setReportText(text.slice(0, 500));
        }
    }, []);

    const sendMessage = React.useCallback(() => {
        if (!inputText.trim()) return;

        if (msgPermission && !msgPermission.can_send) {
            const blockedMsg = t('chat.blocked_cannot_send');
            const body =
                (msgPermission as any).reason === 'blocked'
                    ? blockedMsg
                    : (msgPermission as any).reason === 'awaiting_reply'
                        ? t('chat.awaiting_reply')
                        : t('chat.cannot_send');
            Alert.alert(t('chat.restricted_title'), body);
            return;
        }

        lightImpact();
        const newMsg: Message = {
            id: String(Date.now()),
            text: inputText.trim(),
            isMine: true,
            timestamp: new Date().toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
        };
        setMessages((prev) => [...prev, newMsg]);
        if (msgPermission) {
            setMsgPermission(prev => {
                if (!prev) return prev;
                if ((prev as any).reason === 'mutual_follow') {
                    return { ...prev, messages_sent_count: prev.messages_sent_count + 1 } as any;
                }
                return { ...prev, messages_sent_count: prev.messages_sent_count + 1, can_send: false, awaiting_reply: true } as any;
            });
        }
        if (chatId) {
            useChatMessagesStore.getState().addMessage(chatId, {
                id: newMsg.id,
                text: newMsg.text,
                isMine: true,
                timestamp: new Date().toISOString(),
                status: 'sent',
            });
            const convs = useMessagesStore.getState().conversations;
            if (!convs.some(c => c.id === chatId)) {
                useMessagesStore.getState().addConversation({
                    id: chatId,
                    name: contact.name || 'Kullanıcı',
                    username: '',
                    avatar: contact.avatar || '',
                    lastMessage: newMsg.text,
                    lastMessageSender: 'me',
                    timestamp: new Date(newMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    unread: false,
                    isOnline: contact.isOnline || false,
                    lastMessageAt: Date.now(),
                });
            } else {
                useMessagesStore.getState().updateLastMessageAt(chatId, newMsg.text, new Date(newMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 'me');
                const c = convs.find(c => c.id === chatId);
                if (c?.isArchived) useMessagesStore.getState().unarchiveConversation(chatId);
            }
        }
        if (isBackendConv) {
            backendSendMessage(numericConvId, { content: newMsg.text })
                .then((sent) => {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === newMsg.id
                                ? { ...m, id: String(sent.id), status: 'delivered' as const }
                                : m
                        )
                    );
                })
                .catch((e) =>
                    logger.warn('[ChatScreen] Backend mesaj gönderilemedi', e)
                );
        }
        setInputText('');
    }, [chatId, contact.avatar, contact.isOnline, contact.name, currentLocale, isBackendConv, inputText, msgPermission, numericConvId, t]);

    const handleCameraPress = React.useCallback(() => {
        if (msgPermission && !msgPermission.can_send_media) {
            Alert.alert(
                t('chat.restricted_title', 'Medya Gönderilemedi'),
                t('chat.media_restricted', 'Bu konuşmada medya gönderebilmek için karşılıklı takipleşmeniz gerekiyor.')
            );
            return;
        }
        Alert.alert(
            t('chat.send_photo', 'Fotoğraf Gönder'),
            t('chat.photo_options_desc', 'Lütfen bir seçenek belirleyin:'),
            [
                {
                    text: t('chat.camera', 'Kamera'),
                    onPress: async () => {
                        try {
                            const { status } = await ImagePicker.requestCameraPermissionsAsync();
                            if (status !== 'granted') {
                                Alert.alert(t('common.error'), t('chat.camera_perm_err'));
                                return;
                            }
                            const result = await ImagePicker.launchCameraAsync({
                                mediaTypes: ['images'] as any,
                                quality: 0.8,
                            });
                            if (!result.canceled && (result as any).assets && (result as any).assets.length > 0) {
                                setPreviewUri((result as any).assets[0].uri);
                            }
                        } catch {
                            Alert.alert(t('common.error'), t('chat.camera_err'));
                        }
                    }
                },
                {
                    text: t('chat.gallery', 'Galeri'),
                    onPress: async () => {
                        try {
                            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                            if (status !== 'granted') {
                                Alert.alert(t('common.error'), t('chat.gallery_perm_err'));
                                return;
                            }
                            const result = await ImagePicker.launchImageLibraryAsync({
                                mediaTypes: ['images'] as any,
                                quality: 0.8,
                            });
                            if (!result.canceled && (result as any).assets && (result as any).assets.length > 0) {
                                setPreviewUri((result as any).assets[0].uri);
                            }
                        } catch {
                            Alert.alert(t('common.error'), t('chat.gallery_err'));
                        }
                    }
                },
                {
                    text: t('common.cancel'),
                    style: 'cancel'
                }
            ]
        );
    }, [msgPermission, t]);

    const sendImageMessage = React.useCallback(async (uri: string) => {
        if (!isBackendConv) return;
        setPreviewUri(null);
        const captionText = inputText.trim();
        const tempId = `temp_img_${Date.now()}`;
        const optimisticMsg: Message = {
            id: tempId,
            text: captionText,
            imageUri: uri,
            isMine: true,
            timestamp: new Date().toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
        };
        setMessages((prev) => [...prev, optimisticMsg]);
        if (chatId) {
            useChatMessagesStore.getState().addMessage(chatId, {
                id: tempId,
                text: captionText,
                isMine: true,
                timestamp: new Date().toISOString(),
                imageUri: uri,
                status: 'sent',
            });
        }
        setInputText('');

        try {
            const filename = uri.split('/').pop() || 'photo.jpg';
            const match = /\.([^.]+)$/.exec(filename);
            const type = match ? `image/${match[1].toLowerCase().replace('jpg', 'jpeg')}` : 'image/jpeg';

            const uploadResult = await apiUploadFile('/upload/image', { uri, name: filename, type } as any);
            const mediaUrl: string = (uploadResult as any).url;

            const sent = await backendSendMessage(numericConvId, {
                content: captionText || t('chat.photo', '📷 Fotoğraf'),
                message_type: 'image',
                media_url: mediaUrl,
            } as any);

            const realId = String(sent.id);
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === tempId
                        ? { ...m, id: realId, imageUri: mediaUrl.startsWith('/') ? `${API_BASE_URL}${mediaUrl}` : mediaUrl, status: 'delivered' as const }
                        : m
                )
            );

            if (chatId) {
                const store = useChatMessagesStore.getState();
                const existing = store.messagesByChat[chatId] ?? [];
                const updated = existing.map((m: any) =>
                    m.id === tempId
                        ? { ...m, id: realId, imageUri: mediaUrl.startsWith('/') ? `${API_BASE_URL}${mediaUrl}` : mediaUrl, status: 'delivered' as const }
                        : m
                );
                useChatMessagesStore.setState({ messagesByChat: { ...store.messagesByChat, [chatId]: updated } });
            }

            const textToSave = t('chat.photo', 'Fotoğraf 📷');
            setTimeout(() => {
                useMessagesStore.getState().updateLastMessageAt(chatId as string, textToSave, new Date(optimisticMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 'me');
            }, 0);
        } catch (err) {
            logger.error('[sendImageMessage] Upload failed:', err);
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            if (chatId) {
                const store = useChatMessagesStore.getState();
                const existing = store.messagesByChat[chatId] ?? [];
                useChatMessagesStore.setState({
                    messagesByChat: { ...store.messagesByChat, [chatId]: existing.filter((m: any) => m.id !== tempId) }
                });
            }
            Alert.alert(t('common.error', 'Hata'), t('chat.photo_send_err', 'Fotoğraf gönderilemedi.'));
        }
    }, [chatId, currentLocale, inputText, isBackendConv, numericConvId, t]);

    const handleDeleteMessage = React.useCallback((msgId: string) => {
        lightImpact();
        RNAlert.alert(
            t('chat.delete_message_title', 'Mesajı Sil'),
            t('chat.delete_message_desc', 'Bu mesajı silmek istediğinize emin misiniz?'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: () => {
                        setMessages((prev) => prev.filter((m) => m.id !== msgId));
                        if (chatId) {
                            const store = useChatMessagesStore.getState();
                            const existing = store.messagesByChat[chatId] ?? [];
                            const filtered = existing.filter((m: any) => m.id !== msgId);
                            useChatMessagesStore.setState({
                                messagesByChat: {
                                    ...store.messagesByChat,
                                    [chatId]: filtered,
                                },
                            });
                        }
                    },
                },
            ]
        );
    }, [chatId, t]);

    return {
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
        // expose but keep internal actions intact
        handleBlock,
        handleReport,
    } as const;
}

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { lightImpact } from '@/src/utils/haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export function MessageBubble({
  item,
  isLast,
  lastSeenId,
  colors,
  t,
  handleDeleteMessage,
  openImageViewer,
  useAppStore,
  router,
}: {
  item: any;
  isLast: boolean;
  lastSeenId: string | null;
  colors: any;
  t: (key: string, options?: any) => string;
  handleDeleteMessage: (msgId: string) => void;
  openImageViewer: (uri: string) => void;
  useAppStore: any;
  router: any;
}) {
  // Tik durumu: sadece kendi mesajlarında
  let tickIcon = null;
  if (item.isMine) {
    const isRead = item.status === 'read' || item.seen || (isLast && lastSeenId === item.id);
    const isDelivered = item.status === 'delivered';
    const readColor = "#2196F3";     // Mavi → görüldü
    const defaultColor = "rgba(255,255,255,0.6)"; // Soluk → gönderildi/teslim edildi

    if (isRead) {
      tickIcon = <MaterialCommunityIcons name="check-all" size={16} color={readColor} style={{ marginLeft: 4 }} />;
    } else if (isDelivered) {
      tickIcon = <MaterialCommunityIcons name="check-all" size={16} color={defaultColor} style={{ marginLeft: 4 }} />;
    } else {
      tickIcon = <MaterialCommunityIcons name="check" size={16} color={defaultColor} style={{ marginLeft: 4 }} />;
    }
  }

  const longPressHandler = () => handleDeleteMessage(item.id);

  // Mekan kartı mesajı
  if (item.placeCard) {
    const renderStars = (rating: number = 4.8) => {
      const stars = [];
      const fullStars = Math.floor(rating);
      for (let i = 0; i < 5; i++) {
        stars.push(
          <IconSymbol
            key={i}
            name={i < fullStars ? "star.fill" : "star"}
            size={12}
            color="#F5A623"
          />
        );
      }
      return <View style={styles.starsContainer}>{stars}</View>;
    };

    return (
      <Animated.View entering={FadeInUp.springify().damping(15)} style={[styles.messageBubbleRow, item.isMine ? styles.myRow : styles.theirRow]}>
        <TouchableOpacity onLongPress={longPressHandler} activeOpacity={0.9}>
          <View style={[styles.messageContentWrapper, item.isMine ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              lightImpact();
              if (item.placeCard?.id) {
                router.push(`/place/${item.placeCard.id}` as any);
              } else {
                useAppStore.getState().setPendingPlaceName(item.placeCard?.name);
                router.replace("/(tabs)/explore" as any);
              }
            }}
            style={[
              styles.newPlaceCardBubble,
              {
                backgroundColor: "#111111", // Dark background
                borderColor: "#00E5FF", // Neon glow border
                borderWidth: 1,
                // Glow effect parameters (iOS mostly, Android uses elevation or no real glow)
                shadowColor: "#00E5FF",
                shadowOpacity: 0.8,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 0 },
                elevation: 8,
              },
            ]}
          >
            <Image
              source={{ uri: item.placeCard.image }}
              style={styles.placeCardImage}
              contentFit="cover"
            />
            <View style={styles.placeCardInfo}>
              <Text
                style={[styles.placeCardName, { color: "#FFFFFF" }]}
                numberOfLines={1}
              >
                {item.placeCard.name}
              </Text>
              
              <Text
                style={[styles.placeCardAddr, { color: "rgba(255,255,255,0.6)", marginTop: 2 }]}
                numberOfLines={1}
              >
                {item.placeCard.category ? `${item.placeCard.address} | ${item.placeCard.category}` : item.placeCard.address}
              </Text>
              
              <View style={styles.ratingRow}>
                <Text style={styles.ratingText}>{item.placeCard.rating?.toFixed(1) || "4.8"}</Text>
                {renderStars(item.placeCard.rating || 4.8)}
                <Text style={styles.reviewCountText}>({item.placeCard.reviewCount || 342})</Text>
              </View>

              <Text style={styles.placeCardDesc} numberOfLines={2}>
                {item.placeCard.description || t("chat.place_desc_fallback", "Harika bir mekan, mutlaka ziyaret etmelisin.")}
              </Text>

              <View style={styles.visitButton}>
                <Text style={styles.visitButtonText}>
                  {t("chat.visit_now", "Visit Now")}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <View style={[styles.newTimeRow, item.isMine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
            <Text style={[styles.newMsgTime, { color: colors.text.tertiary }]}>{item.timestamp}</Text>
            {item.isMine && tickIcon}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
    );
  }

  // ── Hikayeye Yanıt Mesajı (AŞAMA 5) ──
  if (item.isStoryReply) {
    const isStoryExpired = !item.storySnapshotUrl;
    return (
      <Animated.View entering={FadeInUp.springify().damping(15).delay(50)} style={[styles.messageBubbleRow, item.isMine ? styles.myRow : styles.theirRow]}>
        <TouchableOpacity onLongPress={longPressHandler} activeOpacity={0.9}>
          <View style={[styles.messageContentWrapper, item.isMine ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
          <View
            style={[
              styles.storyReplyCard,
              {
                backgroundColor: item.isMine ? "#ffffff" : colors.surface.elevated,
                borderColor: item.isMine ? 'rgba(0,0,0,0.08)' : colors.surface.border,
                opacity: isStoryExpired ? 0.7 : 1,
              },
            ]}
          >
            {isStoryExpired ? (
              <View style={[styles.storyReplyThumb, styles.storyReplyThumbExpired]}>
                <IconSymbol name="clock.badge.xmark" size={22} color="rgba(255,255,255,0.5)" />
              </View>
            ) : (
              <Image
                source={{ uri: item.storySnapshotUrl! }}
                style={styles.storyReplyThumb}
                contentFit="cover"
              />
            )}
            <View style={styles.storyReplyContent}>
              <Text
                style={[
                  styles.storyReplyLabel,
                  { color: item.isMine ? 'rgba(0,0,0,0.45)' : colors.text.tertiary },
                ]}
              >
                {isStoryExpired
                  ? 'Bu hikayeye artık ulaşılamıyor'
                  : (item.isMine ? 'Hikayeye yanıt verdim' : 'Hikayenize yanıt verdi')
                }
              </Text>
              <Text
                style={[
                  styles.newMsgText,
                  { color: item.isMine ? '#000' : colors.text.primary },
                ]}
              >
                {item.text}
              </Text>
            </View>
          </View>
          <View style={[styles.newTimeRow, item.isMine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
            <Text style={[styles.newMsgTime, { color: colors.text.tertiary }]}>{item.timestamp}</Text>
            {item.isMine && tickIcon}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
    );
  }

  // Paylaşılan gönderi mesajı
  if (item.sharedPostId && item.imageUri) {
    return (
      <Animated.View entering={FadeInUp.springify().damping(15).delay(100)} style={[styles.messageBubbleRow, item.isMine ? styles.myRow : styles.theirRow]}>
        <TouchableOpacity onLongPress={longPressHandler} activeOpacity={0.9}>
          <View style={[styles.messageContentWrapper, item.isMine ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              lightImpact();
              useAppStore.getState().setPendingSharedPostId(item.sharedPostId!);
              router.push(`/(tabs)/feed` as any);
            }}
            style={[
              styles.newPlaceCardBubble,
              {
                backgroundColor: item.isMine ? "#ffffff" : colors.surface.elevated,
                borderColor: colors.surface.border,
              },
            ]}
          >
            <Image
              source={{ uri: item.imageUri }}
              style={styles.placeCardImage}
              contentFit="cover"
            />
            <View style={styles.placeCardInfo}>
              <View style={styles.placeCardNameRow}>
                <IconSymbol name="photo.on.rectangle" size={14} color={item.isMine ? "#2ecc71" : colors.accent.primary} />
                <Text style={[styles.placeCardName, { color: item.isMine ? "#000000" : colors.text.primary }]} numberOfLines={2}>
                  {item.text}
                </Text>
              </View>
              <Text style={[styles.placeCardHint, { color: item.isMine ? "#2ecc71" : colors.accent.primary }]}>
                {t("chat.open_post", "Gönderiyi aç →")}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={[styles.newTimeRow, item.isMine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
            <Text style={[styles.newMsgTime, { color: colors.text.tertiary }]}>{item.timestamp}</Text>
            {item.isMine && tickIcon}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
    );
  }

  // Fotoğraflı mesaj
  if (item.imageUri) {
    return (
      <Animated.View entering={FadeInUp.springify().damping(15).delay(50)} style={[styles.messageBubbleRow, item.isMine ? styles.myRow : styles.theirRow]}>
        <TouchableOpacity onLongPress={longPressHandler} activeOpacity={0.9}>
          <View style={[styles.messageContentWrapper, item.isMine ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => openImageViewer(item.imageUri!)}
            onLongPress={longPressHandler}
            style={[styles.imageBubble, item.isMine ? { backgroundColor: "#ffffff" } : { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border, borderWidth: 1 }]}
          >
            <Image
              source={{ uri: item.imageUri }}
              style={styles.messageImage}
              contentFit="cover"
            />
            {item.text ? (
              <Text style={[styles.newMsgText, { color: item.isMine ? "#000000" : colors.text.primary, marginTop: 8 }]}>
                {item.text}
              </Text>
            ) : null}
          </TouchableOpacity>
          <View style={[styles.newTimeRow, item.isMine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
            <Text style={[styles.newMsgTime, { color: colors.text.tertiary }]}>{item.timestamp}</Text>
            {item.isMine && tickIcon}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
    );
  }

  // Düz Metin
  return (
    <Animated.View entering={FadeInUp.springify().damping(15)} style={[styles.messageBubbleRow, item.isMine ? styles.myRow : styles.theirRow]}>
      <TouchableOpacity onLongPress={longPressHandler} activeOpacity={0.9}>
        <View style={[styles.messageContentWrapper, item.isMine ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
          {item.isMine ? (
            <LinearGradient
              colors={['#00C6FF', '#0072FF']} // A beautiful blue gradient for "my messages"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.newBubble,
                { borderBottomRightRadius: 4 },
              ]}
            >
              <Text style={[styles.newMsgText, { color: "#FFF" }]}>{item.text}</Text>
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.newBubble,
                { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border, borderWidth: 1, borderBottomLeftRadius: 4 },
              ]}
            >
              <Text style={[styles.newMsgText, { color: colors.text.primary }]}>{item.text}</Text>
            </View>
          )}
          <View style={[styles.newTimeRow, item.isMine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
            <Text style={[styles.newMsgTime, { color: colors.text.tertiary }]}>{item.timestamp}</Text>
            {item.isMine && tickIcon}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  messageBubbleRow: {
    marginBottom: 16,
  },
  myRow: {
    alignItems: "flex-end",
  },
  theirRow: {
    alignItems: "flex-start",
  },
  messageContentWrapper: {
    maxWidth: "80%",
  },
  newBubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  newMsgText: {
    fontSize: 15,
    lineHeight: 21,
  },
  newTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  newMsgTime: {
    fontSize: 12,
  },
  imageBubble: {
    borderRadius: 12,
    padding: 4,
    overflow: 'hidden',
  },
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 8,
  },
  newPlaceCardBubble: {
    width: 260,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  placeCardImage: {
    width: "100%",
    height: 120,
  },
  placeCardInfo: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  placeCardNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2,
  },
  placeCardName: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  placeCardAddr: {
    fontSize: 13,
  },
  placeCardHint: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 6,
    gap: 4,
  },
  ratingText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
    alignItems: "center",
    marginBottom: 1, // Visual alignment
  },
  reviewCountText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
  placeCardDesc: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  visitButton: {
    backgroundColor: "#00E5FF", // Matching the glow color
    borderRadius: 24,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  visitButtonText: {
    color: "#000000",
    fontWeight: "700",
    fontSize: 14,
  },
  storyReplyCard: {
    flexDirection: "row",
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    maxWidth: 280,
  },
  storyReplyThumb: {
    width: 72,
    height: 88,
  },
  storyReplyThumbExpired: {
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyReplyContent: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
    gap: 4,
  },
  storyReplyLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});

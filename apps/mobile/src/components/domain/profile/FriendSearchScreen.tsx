import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
  Keyboard,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Avatar } from "@/src/components/ui";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { useTheme } from "@/src/hooks/useTheme";
import { lightImpact } from "@/src/utils/haptics";
import { searchUsers, type UserSummary } from "@/src/services/searchService";
import { toggleFollow } from "@/src/services/userService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { handleApiError } from "@/src/utils/errorHandler";
import { useTranslation } from "react-i18next";
import { openConversation } from "@/src/services/messageService";

const DEBOUNCE_MS = 400;

export default function FriendSearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const { t } = useTranslation();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Animated glow for the search bar
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleFocus = () => {
    Animated.timing(glowAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(glowAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const glowBorderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surface.border as string, colors.accent.primary as string],
  });

  const doSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setResults([]);
        setSearched(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      setSearched(true);
      try {
        const res = await searchUsers(trimmed, 1, 30);
        // Filter out current user from results
        const filtered = (res.items || []).filter(
          (u) => u.id !== authUser?.id
        );
        setResults(filtered);
      } catch (e) {
        handleApiError(e);
      } finally {
        setLoading(false);
      }
    },
    [authUser?.id]
  );

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      doSearch(text);
    }, DEBOUNCE_MS);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleToggleFollow = async (userId: number, index: number) => {
    lightImpact();
    const original = results[index];
    if (!original) return;

    // Optimistic update
    setResults((prev) => {
      const next = [...prev];
      const cur = next[index];
      if (!cur) return prev;
      const willFollow = !cur.is_following && cur.follow_status !== "pending";
      next[index] = {
        ...cur,
        is_following: willFollow && !cur.is_private,
        follow_status: willFollow
          ? cur.is_private
            ? "pending"
            : "accepted"
          : null,
      };
      return next;
    });
    try {
      const res = await toggleFollow(userId);
      setResults((prev) => {
        const next = [...prev];
        if (!next[index]) return prev;
        next[index] = {
          ...next[index],
          is_following: res.status === "accepted",
          follow_status: res.status as "pending" | "accepted" | null,
        };
        return next;
      });
    } catch (e) {
      // Revert
      setResults((prev) => {
        const next = [...prev];
        if (!next[index]) return prev;
        next[index] = {
          ...next[index],
          is_following: original.is_following,
          follow_status: original.follow_status,
        };
        return next;
      });
      handleApiError(e);
    }
  };

  const { mode } = useLocalSearchParams<{ mode?: string }>();

  const navigateToProfile = async (user: UserSummary) => {
    lightImpact();
    Keyboard.dismiss();
    
    if (mode === "chat") {
      try {
        const res = await openConversation(user.id);
        const displayName = user.first_name
          ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}`
          : user.username || `User ${user.id}`;
          
        router.push(`/chat/${res.conversation_id}?name=${encodeURIComponent(displayName)}&avatar=${encodeURIComponent(user.avatar_url || "")}&targetUserId=${user.id}` as any);
      } catch (e) {
        handleApiError(e);
      }
      return;
    }

    if (user.id === authUser?.id) {
      router.push("/(tabs)/profile" as any);
    } else {
      router.push(`/user/${user.id}` as any);
    }
  };

  const renderItem = ({ item, index }: { item: UserSummary; index: number }) => {
    const displayName = item.first_name
      ? `${item.first_name}${item.last_name ? ` ${item.last_name}` : ""}`
      : null;

    return (
      <TouchableOpacity
        style={styles.userRow}
        onPress={() => navigateToProfile(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatarRing, { borderColor: colors.surface.border }]}>
          <Avatar
            source={item.avatar_url ? { uri: item.avatar_url } : undefined}
            name={item.username || item.first_name || "U"}
            size={50}
          />
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: colors.text.primary }]} numberOfLines={1}>
            {item.username || `${t("profile.user")} ${item.id}`}
          </Text>
          {displayName && (
            <Text style={[styles.fullName, { color: colors.text.secondary }]} numberOfLines={1}>
              {displayName}
            </Text>
          )}
        </View>

        {mode !== "chat" && (() => {
          const isPending = item.follow_status === "pending";
          const isFollowing = item.is_following;

          let label: string;
          let btnStyle: object;
          let textStyle: object;

          if (isFollowing) {
            label = t("friend_search.following");
            btnStyle = {
              backgroundColor: colors.surface.elevated,
              borderWidth: 1,
              borderColor: colors.surface.border,
            };
            textStyle = { color: colors.text.primary };
          } else if (isPending) {
            label = t("profile.requested_btn");
            btnStyle = {
              backgroundColor: colors.surface.elevated,
              borderWidth: 1,
              borderColor: colors.surface.border,
            };
            textStyle = { color: colors.text.secondary };
          } else {
            label = t("friend_search.follow");
            btnStyle = {
              backgroundColor: colors.accent.primary,
              borderWidth: 1,
              borderColor: colors.accent.primary,
            };
            textStyle = { color: colors.accent.onPrimary };
          }

          return (
            <TouchableOpacity
              style={[styles.followBtn, btnStyle]}
              onPress={() => handleToggleFollow(item.id, index)}
              activeOpacity={0.8}
            >
              <Text style={[styles.followBtnText, textStyle]}>{label}</Text>
            </TouchableOpacity>
          );
        })()}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            lightImpact();
            router.back();
          }}
          hitSlop={12}
          style={[styles.headerBtn, { backgroundColor: colors.surface.elevated }]}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{t("friend_search.title")}</Text>

        <View style={styles.headerBtn} />
      </View>

      {/* ── Premium Search Bar ── */}
      <View style={styles.searchSection}>
        <Animated.View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surface.elevated,
              borderColor: glowBorderColor,
            },
          ]}
        >
          <IconSymbol
            name="magnifyingglass"
            size={18}
            color={colors.text.tertiary}
          />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder={t("friend_search.search_placeholder")}
            placeholderTextColor={colors.text.tertiary}
            value={query}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => doSearch(query)}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={clearSearch}
              hitSlop={8}
              style={[styles.clearBtn, { backgroundColor: colors.surface.pressed }]}
            >
              <IconSymbol name="xmark" size={12} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color={colors.accent.primary} />
            <Text style={[styles.stateText, { color: colors.text.tertiary }]}>
              {t("friend_search.searching")}
            </Text>
          </View>
        ) : searched && results.length === 0 ? (
          <View style={styles.centerState}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.surface.elevated }]}>
              <IconSymbol name="person.fill.questionmark" size={32} color={colors.text.tertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              {t("friend_search.no_user_found")}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.text.tertiary }]}>
              {t("friend_search.no_user_desc", { query })}
            </Text>
          </View>
        ) : !searched ? (
          <View style={styles.centerState}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.surface.elevated }]}>
              <IconSymbol name="person.2.fill" size={32} color={colors.accent.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              {t("friend_search.find_friends")}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.text.tertiary }]}>
              {t("friend_search.find_friends_desc")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Text style={[styles.resultCount, { color: colors.text.secondary }]}>
                {t("friend_search.results_count", { count: results.length })}
              </Text>
            }
          />
        )}
      </View>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: -0.2,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  avatarRing: {
    padding: 2,
    borderRadius: 40,
    borderWidth: 1.5,
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  fullName: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: "400",
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 20,
  },
  stateText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/hooks/useTheme';
import { getFriendRecommendations, type RecommendedUser } from '@/src/services/recommendationService';
import { toggleFollow } from '@/src/services/userService';

export function SuggestedUsersCarousel() {
  const { colors } = useTheme();
  const router = useRouter();
  const [users, setUsers] = useState<RecommendedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const res = await getFriendRecommendations();
      setUsers(res.items);
    } catch (e) {
      console.warn('Failed to load recommendations', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (u: RecommendedUser) => {
    const isNowFollowing = !u.is_following;
    setUsers((prev) =>
      prev.map((item) =>
        item.id === u.id
          ? {
              ...item,
              is_following: isNowFollowing,
              follow_status: u.is_private ? (isNowFollowing ? 'pending' : null) : null,
            }
          : item
      )
    );
    try {
      await toggleFollow(u.id);
    } catch (e) {
      // revert
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...u } : item))
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingVertical: 32 }]}>
        <ActivityIndicator size="small" color={colors.text.secondary} />
      </View>
    );
  }

  if (users.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.headerText, { color: colors.text.primary }]}>
        Önerilen Kişiler
      </Text>
      <FlatList
        data={users}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const isFollowing = item.is_following;
          const isPending = item.follow_status === 'pending';

          let btnText = 'Takip Et';
          let btnColor = "#3b82f6";
          let btnTextColor = '#fff';

          if (isFollowing) {
            btnText = 'Takip Ediliyor';
            btnColor = colors.surface.elevated;
            btnTextColor = colors.text.primary;
          } else if (isPending) {
            btnText = 'İstek Gönderildi';
            btnColor = colors.surface.elevated;
            btnTextColor = colors.text.primary;
          }

          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}
              onPress={() => router.push(`/user/${item.id}`)}
              activeOpacity={0.9}
            >
              <Image
                source={item.avatar_url ? { uri: item.avatar_url } : require('@/assets/images/default-avatar.png')}
                style={styles.avatar}
                contentFit="cover"
              />
              <Text style={[styles.name, { color: colors.text.primary }]} numberOfLines={1}>
                {item.first_name ? `${item.first_name} ${item.last_name || ''}` : item.username}
              </Text>
              <Text style={[styles.reason, { color: colors.text.secondary }]} numberOfLines={2}>
                {item.recommendation_reason}
              </Text>
              <TouchableOpacity
                style={[styles.followBtn, { backgroundColor: btnColor }]}
                onPress={() => handleToggleFollow(item)}
              >
                <Text style={[styles.followBtnText, { color: btnTextColor }]}>{btnText}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 12,
    gap: 12,
  },
  card: {
    width: 140,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  reason: {
    fontSize: 11,
    textAlign: 'center',
    height: 32, // limit 2 lines
  },
  followBtn: {
    marginTop: 'auto',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  followBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

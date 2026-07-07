import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  PanResponder,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { lightImpact } from '@/src/utils/haptics';
import { useTranslation } from "react-i18next";
import { getNotificationSubscription, updateNotificationSubscription } from '@/src/services/userService';
import Toast from 'react-native-toast-message';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.35;

export interface NotificationSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  targetUserId: number;
  targetUsername: string;
}

export function NotificationSettingsSheet({
  visible,
  onClose,
  targetUserId,
  targetUsername,
}: NotificationSettingsSheetProps) {
  const { colors, typography } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [notifyOnPost, setNotifyOnPost] = useState(false);
  const [notifyOnStory, setNotifyOnStory] = useState(false);

  // Animation values
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset state and fetch
      setLoading(true);
      fetchSettings();

      // Open animations
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Close animations
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const fetchSettings = async () => {
    try {
      const res = await getNotificationSubscription(targetUserId);
      setNotifyOnPost(res.notify_posts);
      setNotifyOnStory(res.notify_stories);
    } catch (err: any) {
      if (err?.code !== 'NOT_FOUND') {
        console.warn('Failed to fetch notification settings', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    lightImpact();
    onClose();
  };

  const handleToggle = async (type: 'post' | 'story', value: boolean) => {
    lightImpact();
    
    // Optimistic update
    const prevPost = notifyOnPost;
    const prevStory = notifyOnStory;
    
    if (type === 'post') setNotifyOnPost(value);
    if (type === 'story') setNotifyOnStory(value);
    
    setSaving(true);
    try {
      const newPost = type === 'post' ? value : notifyOnPost;
      const newStory = type === 'story' ? value : notifyOnStory;
      
      await updateNotificationSubscription(targetUserId, newPost, newStory);
      Toast.show({
        type: 'success',
        text1: 'Bildirim ayarları güncellendi',
      });
    } catch (err) {
      console.error('Failed to update notification settings', err);
      // Revert on error
      setNotifyOnPost(prevPost);
      setNotifyOnStory(prevStory);
      Toast.show({
        type: 'error',
        text1: 'Bir hata oluştu, lütfen tekrar deneyin.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Drag to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > SHEET_HEIGHT * 0.3 || gestureState.vy > 1) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        {/* Overlay for tap-to-close */}
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Sheet Content */}
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background.primary,
              paddingBottom: Math.max(insets.bottom, 24),
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Handle */}
          <View {...panResponder.panHandlers} style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.surface.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {targetUsername} İçin Bildirimler
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={colors.accent.primary} />
              </View>
            ) : (
              <View style={styles.optionsContainer}>
                
                <View style={[styles.optionRow, { borderBottomColor: colors.surface.border }]}>
                  <View style={styles.optionLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.surface.elevated }]}>
                      <IconSymbol name="plus.square" size={24} color={colors.text.primary} />
                    </View>
                    <View style={styles.optionTexts}>
                      <Text style={[styles.optionTitle, { color: colors.text.primary }]}>Gönderiler</Text>
                      <Text style={[styles.optionDesc, { color: colors.text.secondary }]}>
                        Gönderi paylaştığında bildirim al
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={notifyOnPost}
                    onValueChange={(v) => handleToggle('post', v)}
                    trackColor={{ false: colors.surface.border, true: colors.accent.primary }}
                    disabled={saving}
                  />
                </View>

                <View style={[styles.optionRow, { borderBottomColor: colors.surface.border, borderBottomWidth: 0 }]}>
                  <View style={styles.optionLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.surface.elevated }]}>
                      <IconSymbol name="play.circle" size={24} color={colors.text.primary} />
                    </View>
                    <View style={styles.optionTexts}>
                      <Text style={[styles.optionTitle, { color: colors.text.primary }]}>Hikayeler</Text>
                      <Text style={[styles.optionDesc, { color: colors.text.secondary }]}>
                        Hikaye paylaştığında bildirim al
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={notifyOnStory}
                    onValueChange={(v) => handleToggle('story', v)}
                    trackColor={{ false: colors.surface.border, true: colors.accent.primary }}
                    disabled={saving}
                  />
                </View>

              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: SHEET_HEIGHT,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionTexts: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 13,
  },
});

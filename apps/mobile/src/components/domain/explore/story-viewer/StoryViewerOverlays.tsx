import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { ShareStorySheet } from '@/src/components/domain/stories/ShareStorySheet';
import { Avatar } from '@/src/components/ui/Avatar';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import type {
  Story,
  StoryReportReason,
  StoryViewerItem,
} from '@/src/services/storyService';
import { timeAgo } from '@/src/utils/timeAgo';

import { styles } from './styles';

interface StoryViewerOverlaysProps {
  story: Story;
  viewersModalVisible: boolean;
  viewers: StoryViewerItem[];
  viewersLoading: boolean;
  onCloseViewers: () => void;
  showOwnMenu: boolean;
  onCloseOwnMenu: () => void;
  onDeleteStory: () => void;
  showOtherMenu: boolean;
  onCloseOtherMenu: () => void;
  onOpenReportMenu: () => void;
  showReportMenu: boolean;
  onCloseReportMenu: () => void;
  onReport: (reason: StoryReportReason) => void;
  shareSheetVisible: boolean;
  onCloseShareSheet: () => void;
}

const REPORT_REASONS: {
  key: StoryReportReason;
  label: string;
  icon: React.ComponentProps<typeof IconSymbol>['name'];
}[] = [
  { key: 'spam', label: 'Spam', icon: 'envelope.badge' },
  { key: 'inappropriate', label: 'Uygunsuz İçerik', icon: 'eye.slash' },
  { key: 'violence', label: 'Şiddet', icon: 'exclamationmark.shield' },
  { key: 'harassment', label: 'Taciz', icon: 'person.crop.circle.badge.exclamationmark' },
  { key: 'other', label: 'Diğer', icon: 'questionmark.circle' },
];

export function StoryViewerOverlays({
  story,
  viewersModalVisible,
  viewers,
  viewersLoading,
  onCloseViewers,
  showOwnMenu,
  onCloseOwnMenu,
  onDeleteStory,
  showOtherMenu,
  onCloseOtherMenu,
  onOpenReportMenu,
  showReportMenu,
  onCloseReportMenu,
  onReport,
  shareSheetVisible,
  onCloseShareSheet,
}: StoryViewerOverlaysProps) {
  const { t } = useTranslation();

  return (
    <>
      <Modal
        visible={viewersModalVisible}
        transparent
        animationType="slide"
        onRequestClose={onCloseViewers}
      >
        <TouchableOpacity style={styles.viewersModalOverlay} activeOpacity={1} onPress={onCloseViewers}>
          <TouchableOpacity style={styles.viewersModalContent} activeOpacity={1}>
            <View style={styles.viewersHeader}>
              <Text style={styles.viewersTitle}>
                {t('story.viewers_title', { defaultValue: 'Görüntüleyenler' })}
              </Text>
              <TouchableOpacity onPress={onCloseViewers} style={styles.viewersCloseBtn}>
                <IconSymbol name="xmark" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            {viewersLoading ? (
              <View style={styles.viewersLoading}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : viewers.length > 0 ? (
              <ScrollView style={styles.viewersList} contentContainerStyle={{ paddingBottom: 40 }}>
                {viewers.map((viewer, index) => (
                  <View key={index} style={styles.viewerItem}>
                    <Avatar
                      source={viewer.user.avatar_url ? { uri: viewer.user.avatar_url } : undefined}
                      name={viewer.user.first_name || viewer.user.username || 'U'}
                      size={40}
                    />
                    <View style={styles.viewerInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.viewerName}>
                          {viewer.user.first_name || viewer.user.username || 'U'}
                        </Text>
                        {viewer.reaction === '❤️' && (
                          <IconSymbol name="heart.fill" size={14} color="#ef4444" />
                        )}
                      </View>
                      <Text style={styles.viewerTime}>{timeAgo(viewer.viewed_at)}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.viewersEmpty}>
                <Text style={styles.viewersEmptyText}>
                  {t('story.no_viewers', { defaultValue: 'Henüz görüntüleyen yok' })}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showOwnMenu}
        transparent
        animationType="fade"
        onRequestClose={onCloseOwnMenu}
      >
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={onCloseOwnMenu}>
          <View style={styles.menuContent}>
            <TouchableOpacity style={styles.menuItem} onPress={onDeleteStory}>
              <IconSymbol name="trash" size={20} color="#ef4444" />
              <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Hikayeyi Sil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={onCloseOwnMenu}>
              <IconSymbol name="xmark" size={20} color="#fff" />
              <Text style={styles.menuItemText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showOtherMenu}
        transparent
        animationType="fade"
        onRequestClose={onCloseOtherMenu}
      >
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={onCloseOtherMenu}>
          <View style={styles.menuContent}>
            <TouchableOpacity style={styles.menuItem} onPress={onOpenReportMenu}>
              <IconSymbol name="exclamationmark.triangle" size={20} color="#f59e0b" />
              <Text style={styles.menuItemText}>Şikayet Et</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={onCloseOtherMenu}>
              <IconSymbol name="xmark" size={20} color="#fff" />
              <Text style={styles.menuItemText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showReportMenu}
        transparent
        animationType="fade"
        onRequestClose={onCloseReportMenu}
      >
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={onCloseReportMenu}>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Şikayet Nedeni</Text>
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.key}
                style={styles.menuItem}
                onPress={() => onReport(reason.key)}
              >
                <IconSymbol name={reason.icon} size={18} color="#fff" />
                <Text style={styles.menuItemText}>{reason.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <ShareStorySheet
        visible={shareSheetVisible}
        onClose={onCloseShareSheet}
        story={story}
      />
    </>
  );
}

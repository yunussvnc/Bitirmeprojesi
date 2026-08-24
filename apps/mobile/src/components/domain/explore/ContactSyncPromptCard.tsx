import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { useTheme } from '@/src/hooks/useTheme';
import * as Contacts from 'expo-contacts';
import { syncContacts, type ContactItem } from '@/src/services/recommendationService';
import { useAuthStore } from '@/src/store/useAuthStore';
import * as Haptics from 'expo-haptics';

export function ContactSyncPromptCard({ onSynced }: { onSynced?: () => void }) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  const handleSync = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });

        if (data.length > 0) {
          const contactItems: ContactItem[] = [];
          for (const c of data) {
            if (c.phoneNumbers && c.phoneNumbers.length > 0) {
              for (const phone of c.phoneNumbers) {
                if (phone.number) {
                  contactItems.push({
                    name: c.name || null,
                    phone: phone.number,
                  });
                }
              }
            }
          }
          const res = await syncContacts(contactItems);
          if (user) {
            setUser({ ...user, has_synced_contacts: true });
          }
          Alert.alert('Başarılı', `${res.count} kişi senkronize edildi. Artık arkadaşlarınızı bulabilirsiniz.`);
          onSynced?.();
        } else {
          Alert.alert('Hata', 'Rehberinizde numara bulunamadı.');
        }
      } else {
        Alert.alert('İzin Gerekli', 'Rehber eşitlemek için ayarlardan izin vermelisiniz.');
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert('Hata', 'Rehber eşitlenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (user?.has_synced_contacts) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.background.primary }]}>
        <IconSymbol name="person.3.fill" size={24} color={colors.text.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Arkadaşlarınızı Bulun</Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Rehberinizi eşitleyerek tanıdığınız kişileri kolayca bulun. Numaralarınız güvenle saklanır ve kimseyle paylaşılmaz.
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.text.primary }]}
        onPress={handleSync}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.background.primary} />
        ) : (
          <Text style={[styles.btnText, { color: colors.background.primary }]}>Eşitle</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

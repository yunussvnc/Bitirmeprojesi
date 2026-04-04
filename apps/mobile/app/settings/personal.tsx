/**
 * Kişisel Detaylar — Backend bağlantılı
 * Kullanıcının e-posta, telefon ve doğum tarihini gösterir ve düzenleme imkânı sunar.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { Section } from "@/src/components/layout/Section";
import { SettingsRow } from "@/src/components/ui";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/src/constants/design";
import { lightImpact, success } from "@/src/utils/haptics";
import { useAuthStore } from "@/src/store/useAuthStore";
import { apiGet, apiPatch } from "@/src/utils/apiClient";

type UserProfile = {
  id: number;
  email?: string;
  phone?: string;
  birth_date?: string;
  username?: string;
  first_name?: string;
  created_at?: string;
};

export default function PersonalDetailsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore((s) => s.user);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await apiGet<UserProfile>("/auth/me");
      setProfile(data);
    } catch {
      // Fallback to auth store data
      if (authUser) {
        setProfile({
          id: authUser.id,
          email: (authUser as any).email,
          username: (authUser as any).username,
          first_name: (authUser as any).first_name,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const openEdit = (field: string, currentValue: string) => {
    lightImpact();
    setEditField(field);
    setEditValue(currentValue || "");
  };

  const handleSave = async () => {
    if (!editField) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = { [editField]: editValue.trim() };
      await apiPatch("/auth/me", payload);
      success();
      setProfile((prev) => prev ? { ...prev, [editField]: editValue.trim() } : prev);
      setEditField(null);
    } catch (err: any) {
      Alert.alert("Hata", err.message || "Güncelleme başarısız.");
    } finally {
      setSaving(false);
    }
  };

  const fieldLabels: Record<string, string> = {
    email: "E-posta Adresi",
    phone: "Telefon Numarası",
    birth_date: "Doğum Tarihi",
  };

  const formatDate = (d?: string) => {
    if (!d) return "Belirtilmedi";
    try {
      return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    } catch { return d; }
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>Kişisel Detaylar</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent.primary} />
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Info Banner */}
          <View style={[styles.infoBanner, { backgroundColor: isDark ? "rgba(78,205,196,0.08)" : "rgba(78,205,196,0.06)" }]}>
            <IconSymbol name="info.circle" size={18} color={colors.accent.primary} />
            <Text style={[styles.infoText, { color: colors.text.secondary }]}>
              Bu bilgiler hesabınıza özeldir ve profilinizde görünmez.
            </Text>
          </View>

          <Section title="İletişim Bilgileri">
            <SettingsRow
              label="E-posta Adresi"
              value={profile?.email || "Kayıtlı değil"}
              showArrow
              icon="envelope"
              onPress={() => openEdit("email", profile?.email || "")}
            />
            <SettingsRow
              label="Telefon Numarası"
              value={profile?.phone || "Kayıtlı değil"}
              showArrow
              icon="phone"
              onPress={() => openEdit("phone", profile?.phone || "")}
            />
          </Section>

          <Section title="Kimlik Bilgileri">
            <SettingsRow
              label="Doğum Tarihi"
              value={formatDate(profile?.birth_date)}
              showArrow
              icon="calendar"
              onPress={() => openEdit("birth_date", profile?.birth_date || "")}
            />
            <Text style={[styles.hint, { color: colors.text.tertiary }]}>
              Doğum tarihiniz yaşınızı hesaplamak için kullanılır ve profilinizde görünmez.
            </Text>
          </Section>

          <Section title="Hesap Bilgileri">
            <SettingsRow
              label="Kullanıcı ID"
              value={`#${profile?.id || "—"}`}
              icon="number"
            />
            <SettingsRow
              label="Hesap Oluşturulma"
              value={formatDate(profile?.created_at)}
              icon="clock"
            />
          </Section>
        </ScrollView>
      )}

      {/* Edit Modal */}
      <Modal visible={!!editField} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary, borderColor: colors.surface.border }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditField(null)} hitSlop={12}>
                <Text style={[styles.modalCancel, { color: colors.text.secondary }]}>Vazgeç</Text>
              </TouchableOpacity>
              <Text style={[createTextStyle("title", colors.text.primary), styles.modalTitle]}>
                {editField ? fieldLabels[editField] || editField : ""}
              </Text>
              <TouchableOpacity onPress={handleSave} disabled={saving} hitSlop={12}>
                {saving ? (
                  <ActivityIndicator size="small" color={colors.accent.primary} />
                ) : (
                  <Text style={[styles.modalSave, { color: colors.accent.primary }]}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.modalInput, {
                color: colors.text.primary,
                backgroundColor: colors.surface.elevated,
                borderColor: colors.surface.border,
              }]}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={editField ? fieldLabels[editField] : ""}
              placeholderTextColor={colors.text.tertiary}
              autoFocus
              autoCapitalize="none"
              keyboardType={editField === "email" ? "email-address" : editField === "phone" ? "phone-pad" : "default"}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: "flex-start", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  infoBanner: {
    flexDirection: "row", alignItems: "center", padding: 12,
    borderRadius: 10, marginBottom: 12, gap: 8,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  hint: { fontSize: 13, lineHeight: 18, marginTop: -4, marginBottom: 8, marginLeft: 16 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40, borderWidth: 1,
  },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 20,
  },
  modalCancel: { fontSize: 16, fontWeight: "500" },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  modalSave: { fontSize: 16, fontWeight: "700" },
  modalInput: {
    fontSize: 16, paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 12, borderWidth: 1,
  },
});

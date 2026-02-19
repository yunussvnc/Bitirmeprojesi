/**
 * FilterBottomSheet – Premium filtre bottom sheet.
 * Segmented kontroller, choice chip'ler ve SelectField'ler.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { lightImpact } from '@/src/utils/haptics';

/* ── Types ── */

export interface FilterValues {
  location: string | null;
  category: string | null;
  vibe: 'quiet' | 'lively' | null;
  purpose: 'work' | 'friends' | 'date' | null;
  budget: 'low' | 'mid' | 'high' | null;
}

export interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  values: FilterValues;
  onApply: (v: FilterValues) => void;
  districts: string[];
  placeTypes: string[];
}

/* ── Helpers ── */

interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

function Segment<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[];
  value: T | null;
  onChange: (v: T | null) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={segStyles.row}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            onPress={() => { lightImpact(); onChange(active ? null : o.value); }}
            activeOpacity={0.7}
            style={[
              segStyles.item,
              {
                backgroundColor: active ? colors.accent.primary : colors.background.tertiary,
                borderColor: active ? colors.accent.primary : colors.surface.border,
              },
            ]}
          >
            <Text
              style={[
                segStyles.label,
                { color: active ? '#fff' : colors.text.secondary },
              ]}
            >
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const segStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: { fontSize: 13, fontWeight: '600' },
});

function PickerChip({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  onSelect: (v: string | null) => void;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const display = value ? options.find((o) => o.value === value)?.label ?? value : label;

  return (
    <>
      <TouchableOpacity
        onPress={() => { lightImpact(); setOpen(true); }}
        activeOpacity={0.7}
        style={[
          pkStyles.chip,
          {
            backgroundColor: value ? colors.accent.primary + '14' : colors.background.tertiary,
            borderColor: value ? colors.accent.primary + '40' : colors.surface.border,
          },
        ]}
      >
        <Text
          style={[
            pkStyles.text,
            { color: value ? colors.accent.primary : colors.text.secondary },
          ]}
          numberOfLines={1}
        >
          {display}
        </Text>
        <IconSymbol name="chevron.down" size={14} color={value ? colors.accent.primary : colors.text.tertiary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={pkStyles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={[pkStyles.sheet, { backgroundColor: colors.surface.elevated }]} onPress={() => {}}>
            <View style={[pkStyles.sheetHeader, { borderBottomColor: colors.surface.border }]}>
              <Text style={[pkStyles.sheetTitle, { color: colors.text.primary }]}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={12}>
                <IconSymbol name="xmark" size={18} color={colors.text.tertiary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={pkStyles.scroll} showsVerticalScrollIndicator>
              <TouchableOpacity
                onPress={() => { lightImpact(); onSelect(null); setOpen(false); }}
                style={[pkStyles.option, !value && { backgroundColor: colors.accent.primary + '14' }]}
              >
                <Text style={[pkStyles.optText, { color: !value ? colors.accent.primary : colors.text.primary }]}>Tümü</Text>
                {!value && <IconSymbol name="checkmark" size={16} color={colors.accent.primary} />}
              </TouchableOpacity>
              {options.map((o) => (
                <TouchableOpacity
                  key={o.value}
                  onPress={() => { lightImpact(); onSelect(o.value); setOpen(false); }}
                  style={[pkStyles.option, o.value === value && { backgroundColor: colors.accent.primary + '14' }]}
                >
                  <Text style={[pkStyles.optText, { color: o.value === value ? colors.accent.primary : colors.text.primary, fontWeight: o.value === value ? '600' : '400' }]}>{o.label}</Text>
                  {o.value === value && <IconSymbol name="checkmark" size={16} color={colors.accent.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const pkStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  text: { fontSize: 13, fontWeight: '500' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 340, borderRadius: 16, overflow: 'hidden', maxHeight: 360 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetTitle: { fontSize: 15, fontWeight: '600' },
  scroll: { maxHeight: 300 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 16 },
  optText: { fontSize: 15 },
});

/* ── Main Component ── */

export function FilterBottomSheet({
  visible,
  onClose,
  values,
  onApply,
  districts,
  placeTypes,
}: FilterBottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<FilterValues>(values);

  useEffect(() => {
    if (visible) setDraft(values);
  }, [visible]);

  const patch = <K extends keyof FilterValues>(k: K, v: FilterValues[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const activeCount = [draft.location, draft.category, draft.vibe, draft.purpose, draft.budget].filter(Boolean).length;

  const handleApply = () => {
    lightImpact();
    onApply(draft);
    onClose();
  };

  const handleClear = () => {
    lightImpact();
    const empty: FilterValues = { location: null, category: null, vibe: null, purpose: null, budget: null };
    setDraft(empty);
    onApply(empty);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background.primary,
              paddingBottom: insets.bottom + 16,
            },
          ]}
          onPress={() => {}}
        >
          {/* Handle */}
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.surface.border }]} />
          </View>

          {/* Title */}
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text.primary }]}>Filtreler</Text>
            {activeCount > 0 && (
              <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
                <Text style={[styles.clearBtn, { color: colors.accent.primary }]}>Temizle</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Konum & Tür */}
            <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>Konum & Tür</Text>
            <View style={styles.pickerRow}>
              <PickerChip
                label="İlçe"
                value={draft.location}
                options={districts.map((d) => ({ value: d, label: d }))}
                onSelect={(v) => patch('location', v)}
              />
              <PickerChip
                label="Tür"
                value={draft.category}
                options={placeTypes.map((t) => ({ value: t, label: t }))}
                onSelect={(v) => patch('category', v)}
              />
            </View>

            {/* Bütçe */}
            <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>Bütçe</Text>
            <Segment<'low' | 'mid' | 'high'>
              options={[
                { value: 'low', label: '₺' },
                { value: 'mid', label: '₺₺' },
                { value: 'high', label: '₺₺₺' },
              ]}
              value={draft.budget}
              onChange={(v) => patch('budget', v)}
            />

            {/* Ortam */}
            <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>Ortam</Text>
            <Segment<'quiet' | 'lively'>
              options={[
                { value: 'quiet', label: 'Sessiz' },
                { value: 'lively', label: 'Canlı' },
              ]}
              value={draft.vibe}
              onChange={(v) => patch('vibe', v)}
            />

            {/* Amaç */}
            <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>Amaç</Text>
            <Segment<'work' | 'friends' | 'date'>
              options={[
                { value: 'work', label: 'Çalışma' },
                { value: 'friends', label: 'Arkadaş' },
                { value: 'date', label: 'Date' },
              ]}
              value={draft.purpose}
              onChange={(v) => patch('purpose', v)}
            />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleApply}
              activeOpacity={0.8}
              style={[styles.applyBtn, { backgroundColor: colors.accent.primary }]}
            >
              <Text style={styles.applyText}>
                {activeCount > 0 ? `Uygula (${activeCount})` : 'Uygula'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ── Summary helpers (used by parent) ── */

const LABEL_MAP: Record<string, string> = {
  low: '₺',
  mid: '₺₺',
  high: '₺₺₺',
  quiet: 'Sessiz',
  lively: 'Canlı',
  work: 'Çalışma',
  friends: 'Arkadaş',
  date: 'Date',
};

export function getFilterSummaryChips(v: FilterValues, max = 3): { chips: string[]; extra: number } {
  const all: string[] = [];
  if (v.location) all.push(v.location);
  if (v.category) all.push(v.category);
  if (v.budget) all.push(LABEL_MAP[v.budget] ?? v.budget);
  if (v.vibe) all.push(LABEL_MAP[v.vibe] ?? v.vibe);
  if (v.purpose) all.push(LABEL_MAP[v.purpose] ?? v.purpose);
  return { chips: all.slice(0, max), extra: Math.max(0, all.length - max) };
}

export function countActiveFilters(v: FilterValues): number {
  return [v.location, v.category, v.vibe, v.purpose, v.budget].filter(Boolean).length;
}

/* ── Styles ── */

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  clearBtn: { fontSize: 14, fontWeight: '600' },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 10,
  },
  pickerRow: { flexDirection: 'row', gap: 10 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.15)',
  },
  applyBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

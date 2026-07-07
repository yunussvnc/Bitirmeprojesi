import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { useTheme } from "@/src/hooks/useTheme";

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  description?: string;
  cancelText?: string;
  confirmText?: string;
  confirmStyle?: "default" | "destructive";
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  visible,
  title,
  description,
  cancelText = "İptal",
  confirmText = "Tamam",
  confirmStyle = "default",
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.container,
                {
                  backgroundColor: colors.surface.elevated,
                  borderColor: colors.surface.border,
                },
              ]}
            >
              <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
              {description ? (
                <Text style={[styles.description, { color: colors.text.secondary }]}>
                  {description}
                </Text>
              ) : null}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: colors.surface.default },
                  ]}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.buttonText, { color: colors.text.primary }]}>
                    {cancelText}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor:
                        confirmStyle === "destructive"
                          ? colors.semantic.error + "20"
                          : colors.accent.primary + "20",
                    },
                  ]}
                  onPress={onConfirm}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color:
                          confirmStyle === "destructive"
                            ? colors.semantic.error
                            : colors.accent.primary,
                      },
                    ]}
                  >
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});

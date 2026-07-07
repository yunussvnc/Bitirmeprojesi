import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useAlertStore } from '@/src/store/useAlertStore';
import { useTheme } from '@/src/hooks/useTheme';
import { BlurView } from 'expo-blur';
import { lightImpact } from '@/src/utils/haptics';

const { width } = Dimensions.get('window');

export function CustomAlertOverlay() {
  const { isOpen, title, message, buttons, hideAlert } = useAlertStore();
  const { colors } = useTheme();

  if (!isOpen) return null;

  return (
    <Modal transparent visible={isOpen} animationType="none" onRequestClose={hideAlert}>
      <TouchableWithoutFeedback onPress={hideAlert}>
        <Animated.View 
          entering={FadeIn.duration(200)} 
          exiting={FadeOut.duration(200)} 
          style={styles.overlay}
        >
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View 
              entering={ZoomIn.duration(250).springify().damping(18)} 
              exiting={ZoomOut.duration(200)} 
              style={[
                styles.alertBox, 
                { 
                  backgroundColor: colors.surface.elevated, 
                  borderColor: colors.surface.border,
                  shadowColor: colors.text.primary 
                }
              ]}
            >
              {/* Başlık */}
              {title ? (
                <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
              ) : null}

              {/* Mesaj */}
              {message ? (
                <Text style={[styles.message, { color: colors.text.secondary }]}>{message}</Text>
              ) : null}

              {/* Butonlar */}
              <View style={styles.buttonContainer}>
                {buttons?.map((button, index) => {
                  const isDestructive = button.style === 'destructive';
                  const isCancel = button.style === 'cancel';
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.7}
                      style={[
                        styles.button,
                        {
                          backgroundColor: isDestructive 
                            ? 'rgba(239, 68, 68, 0.15)' 
                            : isCancel 
                              ? colors.surface.default 
                              : 'rgba(16, 185, 129, 0.15)', // Default (ok)
                          marginLeft: index > 0 ? 10 : 0
                        }
                      ]}
                      onPress={() => {
                        lightImpact();
                        hideAlert();
                        if (button.onPress) {
                          setTimeout(() => button.onPress!(), 100);
                        }
                      }}
                    >
                      <Text 
                        style={[
                          styles.buttonText, 
                          { 
                            color: isDestructive 
                              ? '#ef4444' 
                              : isCancel 
                                ? colors.text.primary 
                                : '#10b981' // Default (ok)
                          }
                        ]}
                      >
                        {button.text || 'Tamam'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  alertBox: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

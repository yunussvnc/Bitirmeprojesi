import React from 'react';
import { View, StyleSheet, Modal, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { usePreviewStore } from '@/src/store/usePreviewStore';
import { PlaceCard } from '@/src/components/domain/place/PlaceCard';
import { useTheme } from '@/src/hooks/useTheme';

const { width, height } = Dimensions.get('window');

export const PeekAndPopOverlay = () => {
  const { previewedPlace } = usePreviewStore();
  const { colors } = useTheme();

  if (!previewedPlace) return null;

  return (
    <Modal transparent animationType="none" visible={true} statusBarTranslucent>
      <Animated.View 
        entering={FadeIn.duration(200)} 
        exiting={FadeOut.duration(200)} 
        style={styles.container}
      >
        <BlurView 
          intensity={60} 
          tint={colors.background.primary === '#000000' ? 'dark' : 'light'} 
          style={StyleSheet.absoluteFill} 
        />
        
        <Animated.View 
          entering={ZoomIn.duration(300).springify().damping(18).stiffness(150)}
          exiting={ZoomOut.duration(200)}
          style={styles.cardWrapper}
        >
          {/* Prevent touches on the previewed card from doing anything */}
          <View pointerEvents="none" style={styles.cardInner}>
            <PlaceCard {...previewedPlace} placeId={undefined} />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cardWrapper: {
    width: width * 0.88,
    // Add some 3D shadow for the pop effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  cardInner: {
    width: '100%',
  }
});

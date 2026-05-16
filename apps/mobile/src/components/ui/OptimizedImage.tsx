import React, { useState } from 'react';
import { StyleSheet, View, StyleProp, ImageStyle } from 'react-native';
import { Image, ImageProps } from 'expo-image';

export interface OptimizedImageProps extends Omit<ImageProps, 'source' | 'placeholder'> {
  /**
   * The main high-resolution image URL.
   */
  url?: string | null;
  /**
   * The medium-resolution image URL.
   */
  mediumUrl?: string | null;
  /**
   * The thumbnail image URL.
   */
  thumbnailUrl?: string | null;
  /**
   * The blurhash string for instant placeholder rendering.
   */
  blurhash?: string | null;
  /**
   * Which size variant to load. If the variant is missing, it falls back to the next available size.
   * Defaults to 'medium'.
   */
  variant?: 'thumbnail' | 'medium' | 'full';
  
  /**
   * Standard React Native style object.
   */
  style?: StyleProp<ImageStyle>;
  
  /**
   * Fallback source if all URLs are missing (e.g., local placeholder).
   */
  fallbackSource?: any;
}

/**
 * A wrapper around `expo-image` that provides aggressive disk caching,
 * progressive loading (Blurhash -> Image), and multi-variant resolution support.
 * 
 * It automatically selects the correct resolution based on the `variant` prop
 * to save bandwidth and improve rendering performance.
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  url,
  mediumUrl,
  thumbnailUrl,
  blurhash,
  variant = 'medium',
  style,
  fallbackSource,
  contentFit = 'cover',
  transition = 300,
  ...rest
}) => {
  const [error, setError] = useState(false);

  // Determine the best URL to use based on the requested variant
  let activeUrl: string | null = null;
  
  if (variant === 'thumbnail') {
    activeUrl = thumbnailUrl || mediumUrl || url || null;
  } else if (variant === 'medium') {
    activeUrl = mediumUrl || url || thumbnailUrl || null;
  } else {
    activeUrl = url || mediumUrl || thumbnailUrl || null;
  }

  // Construct placeholder
  let placeholder: any = undefined;
  if (blurhash) {
    // expo-image natively supports blurhash objects in the placeholder prop
    placeholder = { blurhash, width: 32, height: 32 }; // size is optional but helps with rendering ratio
  } else if (thumbnailUrl && variant !== 'thumbnail') {
    // If we don't have a blurhash but we have a thumbnail and we're loading full/medium,
    // use the thumbnail as the placeholder.
    placeholder = thumbnailUrl;
  }

  // If no active URL is found (or it errored out) and we have a fallback, use it.
  const source = (activeUrl && !error) ? activeUrl : fallbackSource;

  if (!source && !placeholder) {
    // If absolutely nothing is available, render an empty view to preserve layout
    return <View style={[style, styles.emptyPlaceholder]} />;
  }

  return (
    <Image
      style={style}
      source={source as any}
      placeholder={placeholder}
      contentFit={contentFit}
      transition={transition}
      cachePolicy="disk" // Aggressively cache to disk for offline and bandwidth saving
      onError={() => setError(true)}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  emptyPlaceholder: {
    backgroundColor: '#E1E1E1',
  },
});

// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
export type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'magnifyingglass': 'search',
  'bookmark': 'bookmark-border',
  'bookmark.fill': 'bookmark',
  'heart': 'favorite-border',
  'heart.fill': 'favorite',
  'trash': 'delete',
  'xmark': 'close',
  'mappin.and.ellipse': 'place',
  'person.fill': 'person',
  'person.circle.fill': 'account-circle',
  'bell.fill': 'notifications',
  'location.fill': 'location-on',
  'globe': 'language',
  'questionmark.circle.fill': 'help',
  'doc.text.fill': 'description',
  'lock.fill': 'lock',
  'info.circle.fill': 'info',
  'gear': 'settings',
  'checkmark': 'check',
  'slider.horizontal.3': 'tune',
  'arrow.up.arrow.down': 'swap-vert',
  'chevron.up': 'keyboard-arrow-up',
  'chevron.down': 'keyboard-arrow-down',
  'star': 'star-border',
  'star.fill': 'star',
  'trophy.fill': 'emoji-events',
  'map.fill': 'map',
  'calendar': 'calendar-today',
  'chart.bar.fill': 'bar-chart',
  'crown.fill': 'workspace-premium',
  'play.fill': 'play-arrow',
  'checkmark.seal.fill': 'verified',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}

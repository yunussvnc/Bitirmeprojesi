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
  'ellipsis': 'more-horiz',
  'heart': 'favorite-border',
  'heart.fill': 'favorite',
  'trash': 'delete',
  'xmark': 'close',
  'eye': 'visibility',
  'eye.slash': 'visibility-off',
  'exclamationmark.triangle': 'report',
  'speaker.slash': 'volume-off',
  'person.badge.minus': 'person-remove',
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
  'video.fill': 'videocam',
  'checkmark.seal.fill': 'verified',
  'square.grid.2x2.fill': 'dashboard',
  'bubble.right': 'chat-bubble-outline',
  'photo': 'photo-library',
  'plus': 'add',
  'mappin.circle.fill': 'place',
  'play.circle.fill': 'play-circle-filled',
  'photo.on.rectangle.angled': 'photo-library',
  'sparkles': 'auto-awesome',
  'apple.logo': 'apple',
  'circle.hexagongrid.fill': 'dashboard',
  'camera.fill': 'photo-camera',
  'moon.fill': 'dark-mode',
  'sun.max.fill': 'light-mode',
  'person.2.fill': 'people',
  'square.grid.2x2': 'dashboard',
  'plus.circle.fill': 'add-circle',
  'arrow.clockwise': 'refresh',
  'person.crop.square': 'portrait',
  'paperplane': 'send',
  'square.and.pencil': 'edit',
  'phone.fill': 'phone',
  'flame.fill': 'local-fire-department',
  'line.3.horizontal': 'menu',
  'square.and.arrow.up': 'share',
  'person.fill.questionmark': 'person-search',
  'person.crop.square.fill': 'account-box',
  'photo.fill': 'photo',
  'music.note': 'music-note',
  'smiley': 'mood',
  'person.crop.circle.badge.plus': 'person-add',
  'xmark.circle.fill': 'cancel',
  // --- Production crash fix: 29 previously unmapped icons ---
  'archivebox': 'archive',
  'arrow.triangle.2.circlepath': 'sync',
  'arrow.uturn.backward': 'undo',
  'building.2': 'business',
  'camera.rotate.fill': 'flip-camera-ios',
  'checkmark.circle.fill': 'check-circle',
  'clock': 'access-time',
  'doc.text.image': 'article',
  'doc.text.magnifyingglass': 'find-in-page',
  'dollarsign.circle': 'attach-money',
  'envelope.fill': 'email',
  'exclamationmark.triangle.fill': 'warning',
  'fork.knife': 'restaurant',
  'graduationcap.fill': 'school',
  'link': 'link',
  'list.bullet.clipboard': 'assignment',
  'list.bullet.clipboard.fill': 'assignment',
  'lock.rotation': 'screen-lock-rotation',
  'mappin': 'place',
  'nosign': 'block',
  'pencil': 'edit',
  'person.text.rectangle': 'badge',
  'photo.on.rectangle': 'collections',
  'photo.badge.plus': 'add-photo-alternate',
  'qrcode.viewfinder': 'qr-code-scanner',
  'ruler.fill': 'straighten',
  'square.on.square.squareshape.controlhandles': 'content-copy',
  'text.bubble.fill': 'textsms',
  'timer': 'timer',
  'trash.fill': 'delete',
  'tray.and.arrow.up': 'upload',
  'video.badge.plus': 'video-call',
  'arrow.turn.down.right': 'subdirectory-arrow-right',
  'star.bubble.fill': 'rate-review',
  'building.2.fill': 'business',
  'clock.fill': 'schedule',
  'tag.fill': 'sell',
  'doc.text.image.fill': 'article',
  'creditcard.fill': 'credit-card',
  'arrow.right.square.fill': 'exit-to-app',
  'gearshape.fill': 'settings',
} as IconMapping;

/** Fallback icon when a mapping is missing — prevents Android crash */
const FALLBACK_ICON: ComponentProps<typeof MaterialIcons>['name'] = 'help-outline';

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
  const mappedName = MAPPING[name] ?? FALLBACK_ICON;
  return <MaterialIcons color={color} size={size} name={mappedName} style={style} />;
}


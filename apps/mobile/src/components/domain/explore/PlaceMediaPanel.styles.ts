import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_HORIZ_MARGIN = 12;
const PANEL_CONTENT_WIDTH = SCREEN_WIDTH - PANEL_HORIZ_MARGIN * 2;
const GRID_COLS = 3;
const GAP = 2;
const PADDING = 16;
const CELL_SIZE = (PANEL_CONTENT_WIDTH - PADDING * 2 - (GRID_COLS - 1) * GAP) / GRID_COLS;
const PANEL_COLLAPSED = Math.min(SCREEN_HEIGHT * 0.62, 520);
const PANEL_EXPANDED = SCREEN_HEIGHT * 0.72;
const HERO_HEIGHT = 140;
const STORY_RING_SIZE = 64;
const PLACE_STORY_SIZE = 82;

// Instagram story ring gradient
const STORY_GRADIENT: [string, string, ...string[]] = ['#4ade80', '#22c55e', '#16a34a', '#15803d'];

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: Platform.OS === 'ios' ? 96 : 80,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  dragHandleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
    paddingBottom: 12,
    zIndex: 30,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    opacity: 0.45,
  },
  heroWrap: {
    height: HERO_HEIGHT,
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING,
    paddingTop: 12,
    paddingBottom: 16,
  },
  heroText: {
    flex: 1,
    justifyContent: 'flex-end',
    minHeight: '100%',
  },
  heroPlaceName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroMeta: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  heroSaveBtn: {
    padding: 4,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storiesSection: {
    paddingTop: 12,
  },
  storiesRow: {
    paddingHorizontal: PADDING,
    paddingBottom: 12,
    gap: 14,
  },
  storyRingWrap: {
    marginRight: 10,
  },
  storyGradientRing: {
    width: STORY_RING_SIZE + 4,
    height: STORY_RING_SIZE + 4,
    borderRadius: (STORY_RING_SIZE + 4) / 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRingInner: {
    width: STORY_RING_SIZE - 4,
    height: STORY_RING_SIZE - 4,
    borderRadius: (STORY_RING_SIZE - 4) / 2,
    overflow: 'hidden',
  },
  storyVideoIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeStoriesSection: {
    marginTop: 8,
    paddingBottom: 8,
  },

  placeStoriesRow: {
    marginTop: 15,
    paddingHorizontal: PADDING,
    gap: 14,
  },
  placeStoryItem: {
    alignItems: 'center',
    width: PLACE_STORY_SIZE,
  },
  placeStoryRing: {
    width: PLACE_STORY_SIZE + 3,
    height: PLACE_STORY_SIZE + 3,
    borderRadius: (PLACE_STORY_SIZE + 3) / 2,
    padding: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeStoryRingSeen: {
    width: PLACE_STORY_SIZE + 3,
    height: PLACE_STORY_SIZE + 3,
    borderRadius: (PLACE_STORY_SIZE + 3) / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeStoryGap: {
    padding: 3,
    borderRadius: PLACE_STORY_SIZE / 2,
  },
  placeStoryInner: {
    width: PLACE_STORY_SIZE - 6,
    height: PLACE_STORY_SIZE - 6,
    borderRadius: (PLACE_STORY_SIZE - 6) / 2,
    overflow: 'hidden',
  },
  placeStoryName: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
    maxWidth: PLACE_STORY_SIZE + 20,
  },
  postModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  postModalContent: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  postModalClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 20,
  },
  postModalCloseBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: PADDING,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionHeaderLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  gridScroll: {
    flex: 1,
  },
  gridContent: {
    padding: PADDING,
    paddingTop: 12,
  },
  loadingWrap: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptyButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  cell: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: PADDING,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  footerActionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  footerBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  detailBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  heroImageModalOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageModalClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 40,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heroImageModalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});

export {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  PANEL_HORIZ_MARGIN,
  PANEL_CONTENT_WIDTH,
  GRID_COLS,
  GAP,
  PADDING,
  CELL_SIZE,
  PANEL_COLLAPSED,
  PANEL_EXPANDED,
  HERO_HEIGHT,
  STORY_RING_SIZE,
  PLACE_STORY_SIZE,
  STORY_GRADIENT
};
export default styles;

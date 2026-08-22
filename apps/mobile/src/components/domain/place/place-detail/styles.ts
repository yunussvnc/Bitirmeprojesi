import { StyleSheet } from 'react-native';

import { spacing } from '@/src/constants/design';

export const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  headerRightButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  placeImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  titleSection: {
    marginBottom: spacing.base,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  reviewButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-end",
  },
  reviewBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  reviewBackdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  reviewSheet: {
    width: "100%",
    alignSelf: "stretch",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.base,
    overflow: "hidden",
  },
  reviewHandleRow: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  reviewDragArea: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  reviewHandle: {
    width: 44,
    height: 4,
    borderRadius: 999,
  },
  reviewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
    marginBottom: spacing.base,
  },
  reviewsMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.base,
  },
  reviewsMetaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewsMetaDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#00000022",
    marginHorizontal: spacing.base,
  },
  reviewScrollContent: {
    paddingBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  content: {
    paddingTop: spacing.base,
  },
  placeMetaSection: {
    marginBottom: spacing.md,
  },
  placeMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  ratingContainer: {
    flex: 1,
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  sectionCard: {
    marginBottom: spacing.xl,
  },
  campaignCard: {
    marginBottom: spacing.lg,
  },
  campaignHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  atmosphereTags: {
    flexDirection: "row",
    gap: spacing.base,
    marginTop: spacing.base,
  },
  atmosphereTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  highlightsGrid: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 0,
  },
  highlightItem: {
    flex: 1,
    minWidth: 0,
    maxWidth: "25%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  highlightItemLowered: {
    marginTop: spacing.lg,
  },
  locationPreview: {
    // Spacing handled by children
  },
  locationAddress: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  locationButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.base,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewsSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.lg,
    gap: spacing.base,
  },
  ratingBadge: {
    minWidth: 84,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  ratingBadgeText: {
    fontSize: 20,
    fontWeight: "700",
  },
  ratingDetails: {
    flex: 1,
    gap: spacing.xs,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewItem: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: spacing.xs,
    gap: 4,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  reviewImageContainer: {
    marginTop: spacing.sm,
    borderRadius: 12,
    overflow: "hidden",
    width: 200,
    height: 150,
  },
  reviewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  reviewImageBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewImageBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  galleryVerifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  galleryVerifiedText: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "600",
  },
  galleryReviewText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
  },
  galleryReviewNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.base,
  },
  galleryNavButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  galleryNavText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  similarScrollContent: {
    paddingRight: spacing.screenPadding,
  },
  similarCardWrapper: {
    width: 280,
    marginRight: spacing.base,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  reviewIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBox: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 16,
    padding: spacing.base,
  },
  menuItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  moreItemsText: {
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
  },
});

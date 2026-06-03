import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/hooks/useTheme";
import { spacing, createTextStyle } from "@/src/constants/design";
import { RatingStars } from "@/src/components/ui";
import type { GoogleReview } from "@/src/services/mekanService";

type Props = {
  review: GoogleReview;
  onMorePress?: () => void;
  showMoreLink?: boolean;
};

function avatarInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

export function GoogleReviewCard({ review, onMorePress, showMoreLink }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const bodyStyle = createTextStyle("body", colors.text.primary);
  const captionStyle = createTextStyle("caption", colors.text.tertiary);

  const ratingLabel =
    review.rating > 0
      ? t("place_detail.google_review_rating", { rating: review.rating })
      : null;

  return (
    <View style={[styles.card, { borderBottomColor: colors.surface.border }]}>
      <View style={styles.headerRow}>
        {review.avatar_url ? (
          <Image source={{ uri: review.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: colors.surface.elevated }]}>
            <Text style={[styles.avatarLetter, { color: colors.text.primary }]}>
              {avatarInitial(review.author_name)}
            </Text>
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={[bodyStyle, styles.authorName]} numberOfLines={1}>
            {review.author_name}
          </Text>
          <Text style={[captionStyle, { color: colors.text.secondary }]}>
            {t("place_detail.google_reviews_badge")}
          </Text>
        </View>
      </View>

      <View style={styles.ratingRow}>
        {review.rating > 0 && (
          <>
            <RatingStars value={review.rating} disabled size={14} />
            {ratingLabel ? (
              <Text style={[captionStyle, styles.ratingText]}>{ratingLabel}</Text>
            ) : null}
          </>
        )}
        {review.relative_time ? (
          <Text style={[captionStyle, styles.timeText]}>{review.relative_time}</Text>
        ) : null}
      </View>

      <Text style={[bodyStyle, styles.reviewText]} numberOfLines={4}>
        {review.text}
      </Text>

      {showMoreLink && onMorePress ? (
        <TouchableOpacity onPress={onMorePress} activeOpacity={0.7} hitSlop={8}>
          <Text style={[captionStyle, styles.moreLink, { color: colors.accent.primary }]}>
            {t("place_detail.more")}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  authorName: {
    fontWeight: "600",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  ratingText: {
    marginLeft: 4,
  },
  timeText: {
    marginLeft: spacing.xs,
  },
  reviewText: {
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  moreLink: {
    marginTop: spacing.xs,
    fontWeight: "600",
  },
});

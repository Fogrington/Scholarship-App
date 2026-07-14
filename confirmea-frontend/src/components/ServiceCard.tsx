import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, shadow, typography } from "../theme/theme";
import { Listing } from "../data/mockData";

type Props = {
  listing: Listing;
  onPress: () => void;
};

export default function ServiceCard({ listing, onPress }: Props) {
  const discounted = listing.discountPercent
    ? Math.round(listing.price * (1 - listing.discountPercent / 100))
    : listing.price;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.thumb}>
        <Ionicons name="cut-outline" size={26} color={colors.apricotDark} />
      </View>

      <View style={styles.info}>
        <View style={styles.rowBetween}>
          <Text style={typography.subheading} numberOfLines={1}>
            {listing.businessName}
          </Text>
          {listing.discountPercent ? (
            <View style={styles.discountTag}>
              <Text style={styles.discountText}>-{listing.discountPercent}%</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.service} numberOfLines={1}>
          {listing.service}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={colors.textMuted} />
          <Text style={styles.metaText}>{listing.distanceKm} km</Text>
          <Text style={styles.dot}>•</Text>
          <Ionicons name="star" size={13} color={colors.apricotDark} />
          <Text style={styles.metaText}>{listing.rating}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.metaText}>{listing.reviews} reviews</Text>
        </View>

        <View style={[styles.rowBetween, { marginTop: spacing.sm }]}>
          <View style={styles.timeTag}>
            <Ionicons name="time-outline" size={13} color={colors.warning} />
            <Text style={styles.timeText}>{listing.slotTime}</Text>
          </View>

          <View style={styles.priceWrap}>
            {listing.discountPercent ? (
              <Text style={styles.priceOld}>${listing.price}</Text>
            ) : null}
            <Text style={styles.price}>${discounted}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.apricotLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  service: {
    ...typography.body,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  metaText: {
    ...typography.caption,
    marginLeft: 3,
  },
  dot: {
    ...typography.caption,
    marginHorizontal: 5,
  },
  timeTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCEEE6",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  timeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.warning,
    marginLeft: 4,
  },
  priceWrap: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceOld: {
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: "line-through",
    marginRight: 6,
  },
  price: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.black,
  },
  discountTag: {
    backgroundColor: colors.apricot,
    borderRadius: radius.pill,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  discountText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
  },
});

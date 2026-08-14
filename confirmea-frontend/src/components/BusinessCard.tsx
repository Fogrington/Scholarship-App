import React from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, shadow, typography } from "../theme/theme";
import { getCategoryIllustration } from "../data/categoryIllustrations";
import type { BusinessWithOffers } from "../types";

type Props = {
  business: BusinessWithOffers;
  onPress: () => void;
};

export default function BusinessCard({ business, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.imageWrap}>
        <Image
          source={getCategoryIllustration(business.category)}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText}>{business.category}</Text>
        </View>
        <View style={styles.offersTag}>
          <Text style={styles.offersTagText}>
            {business.openOffers} offer{business.openOffers === 1 ? "" : "s"} open
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.rowBetween}>
          <Text style={typography.subheading} numberOfLines={1}>
            {business.name}
          </Text>
        </View>

        <View style={styles.metaRow}>
          {business.distanceKm != null && (
            <>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>{business.distanceKm} km</Text>
              <Text style={styles.dot}>•</Text>
            </>
          )}
          {business.rating !== null ? (
            <>
              <Ionicons name="star" size={13} color={colors.apricotDark} />
              <Text style={styles.metaText}>{business.rating}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.metaText}>{business.reviewCount} reviews</Text>
            </>
          ) : (
            <Text style={styles.metaText}>New — no reviews yet</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadow.card,
  },
  imageWrap: {
    width: "100%",
    height: 150,
    backgroundColor: colors.apricotLight,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  categoryTag: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: colors.black,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  categoryTagText: { color: colors.white, fontSize: 11, fontWeight: "800" },
  offersTag: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: colors.apricot,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  offersTagText: { color: colors.white, fontSize: 11, fontWeight: "800" },
  info: {
    padding: spacing.md,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
});

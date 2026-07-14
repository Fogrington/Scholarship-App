import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import { mockListings } from "../data/mockData";
import Badge from "../components/Badge";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ClientStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<ClientStackParamList, "ListingDetail">;

export default function ListingDetailScreen({ route, navigation }: Props) {
  const { listingId } = route.params;
  const listing = mockListings.find((l) => l.id === listingId);
  const [confirmed, setConfirmed] = useState(false);

  if (!listing) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={typography.body}>Listing not found.</Text>
      </SafeAreaView>
    );
  }

  const discounted = listing.discountPercent
    ? Math.round(listing.price * (1 - listing.discountPercent / 100))
    : listing.price;

  const handleConfirm = () => {
    setConfirmed(true);
    Alert.alert(
      "Slot held!",
      `${listing.service} at ${listing.businessName} is confirmed for ${listing.slotTime}.`,
      [{ text: "View my bookings", onPress: () => navigation.navigate("Home") }]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.black} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Ionicons name="cut-outline" size={40} color={colors.apricotDark} />
        </View>

        <View style={styles.rowBetween}>
          <Text style={typography.heading}>{listing.businessName}</Text>
          {listing.discountPercent ? (
            <Badge text={`${listing.discountPercent}% OFF`} tone="apricot" />
          ) : null}
        </View>

        <Text style={styles.service}>{listing.service}</Text>

        <View style={styles.metaCard}>
          <MetaRow icon="location-outline" label={listing.address} />
          <MetaRow icon="navigate-outline" label={`${listing.distanceKm} km away`} />
          <MetaRow icon="time-outline" label={`Slot: ${listing.slotTime}`} />
          <MetaRow icon="star" label={`${listing.rating} (${listing.reviews} reviews)`} />
        </View>

        <View style={styles.priceCard}>
          <View>
            <Text style={typography.caption}>Total price</Text>
            <View style={styles.priceRow}>
              {listing.discountPercent ? (
                <Text style={styles.priceOld}>${listing.price}</Text>
              ) : null}
              <Text style={styles.price}>${discounted}</Text>
            </View>
          </View>
          <Badge text="No deposit needed" tone="success" />
        </View>

        <View style={styles.noticeCard}>
          <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
          <Text style={styles.noticeText}>
            Slots fill fast — this booking is held for 10 minutes while you confirm.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.confirmBtn, confirmed && styles.confirmBtnDone]}
          onPress={handleConfirm}
          disabled={confirmed}
        >
          <Text style={styles.confirmText}>
            {confirmed ? "Booking confirmed" : `Confirm for $${discounted}`}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function MetaRow({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.metaRowItem}>
      <Ionicons name={icon} size={16} color={colors.apricotDark} />
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  content: { padding: spacing.lg, paddingBottom: 120 },
  hero: {
    height: 140,
    borderRadius: radius.lg,
    backgroundColor: colors.apricotLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  service: { ...typography.subheading, marginTop: 4, marginBottom: spacing.md },
  metaCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  metaRowItem: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  metaLabel: { ...typography.body, marginLeft: spacing.sm },
  priceCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    ...shadow.card,
  },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginTop: 2 },
  priceOld: {
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: "line-through",
    marginRight: 6,
  },
  price: { fontSize: 22, fontWeight: "800", color: colors.black },
  noticeCard: {
    flexDirection: "row",
    backgroundColor: "#FCEEE6",
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "flex-start",
  },
  noticeText: { ...typography.caption, marginLeft: spacing.sm, flex: 1, color: colors.warning },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmBtn: {
    backgroundColor: colors.black,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmBtnDone: {
    backgroundColor: colors.success,
  },
  confirmText: { color: colors.white, fontWeight: "800", fontSize: 15 },
});

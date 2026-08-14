import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, Alert, Image } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import Badge from "../components/Badge";
import { useBookings } from "../context/BookingsContext";
import { ApiError } from "../api/client";
import { getCategoryIllustration } from "../data/categoryIllustrations";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { ClientTabParamList } from "../navigation/RootNavigator";
import type { Listing } from "../types";

// Mounted in both the Home stack and the Explore stack (same shape, different
// sibling screens) — hooks instead of typed screen props let this work in either,
// same pattern as BusinessDetailScreen.
type LocalParamList = {
  ListingDetail: { listing: Listing };
};

export default function ListingDetailScreen() {
  const route = useRoute<RouteProp<LocalParamList, "ListingDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<LocalParamList>>();
  const { listing } = route.params;
  const { addBooking, isBooked } = useBookings();
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alreadyBooked = confirmed || isBooked(listing.id);

  const discounted = listing.discountPercent
    ? Math.round(listing.price * (1 - listing.discountPercent / 100))
    : listing.price;

  const handleConfirm = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await addBooking(listing);
      setConfirmed(true);
      Alert.alert(
        "Slot reserved!",
        `${listing.service} at ${listing.businessName} is booked for ${listing.slotTime}. Pay ${listing.businessName} directly when you arrive.`,
        [
          {
            text: "View my bookings",
            onPress: () =>
              navigation
                .getParent<BottomTabNavigationProp<ClientTabParamList>>()
                ?.navigate("BookingsTab"),
          },
        ]
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reserve this slot. Try again.");
    } finally {
      setSubmitting(false);
    }
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
          <Image
            source={getCategoryIllustration(listing.category)}
            style={styles.heroImage}
            resizeMode="cover"
          />
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
          {listing.distanceKm != null && (
            <MetaRow icon="navigate-outline" label={`${listing.distanceKm} km away`} />
          )}
          <MetaRow icon="time-outline" label={`Slot: ${listing.slotTime}`} />
          <MetaRow
            icon="star"
            label={listing.rating !== null ? `${listing.rating} (${listing.reviews} reviews)` : "New — no reviews yet"}
          />
          {listing.capacity > 1 && (
            <MetaRow
              icon="people-outline"
              label={`${listing.remainingSpots} of ${listing.capacity} spots left`}
            />
          )}
        </View>

        <View style={styles.priceCard}>
          <View>
            <Text style={typography.caption}>Price (pay in person)</Text>
            <View style={styles.priceRow}>
              {listing.discountPercent ? (
                <Text style={styles.priceOld}>${listing.price}</Text>
              ) : null}
              <Text style={styles.price}>${discounted}</Text>
            </View>
          </View>
          <Badge text="Pay at the business" tone="success" />
        </View>

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.noticeCard}>
          <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
          <Text style={styles.noticeText}>
            No card needed in the app — you'll pay {listing.businessName} directly when
            you arrive. Slots move fast, so try to be on time.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.confirmBtn, alreadyBooked && styles.confirmBtnDone]}
          onPress={handleConfirm}
          disabled={alreadyBooked || submitting}
        >
          <Text style={styles.confirmText}>
            {alreadyBooked ? "Slot reserved" : submitting ? "Reserving…" : `Reserve slot · $${discounted}`}
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
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
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
  errorCard: {
    flexDirection: "row",
    backgroundColor: "#FBEAE6",
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  errorText: { ...typography.caption, marginLeft: spacing.sm, flex: 1, color: colors.warning },
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

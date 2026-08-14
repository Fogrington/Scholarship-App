import React from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import { useBookings } from "../context/BookingsContext";
import Badge from "../components/Badge";
import type { ClientTabParamList } from "../navigation/RootNavigator";

export default function BookingsScreen() {
  const { bookings, loading, error } = useBookings();
  const navigation = useNavigation<BottomTabNavigationProp<ClientTabParamList>>();

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={[typography.heading, styles.title]}>My Bookings</Text>

      {error ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : loading ? (
        <ActivityIndicator color={colors.apricotDark} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            if (!item.listing) return null;
            const discounted = item.listing.discountPercent
              ? Math.round(item.listing.price * (1 - item.listing.discountPercent / 100))
              : item.listing.price;

            return (
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={typography.subheading}>{item.listing.businessName}</Text>
                  <Badge
                    text={item.status}
                    tone={item.status === "Upcoming" ? "apricot" : "success"}
                  />
                </View>
                <Text style={styles.service}>{item.listing.service}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>{item.listing.slotTime}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>{item.listing.address}</Text>
                </View>
                <View style={styles.payRow}>
                  <Text style={styles.payLabel}>Pay in person</Text>
                  <Text style={styles.payAmount}>${discounted}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="calendar-outline" size={30} color={colors.apricotDark} />
              </View>
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptyText}>
                Last-minute slots near you come and go fast — take a look at what's open right now.
              </Text>
              <Pressable style={styles.emptyCta} onPress={() => navigation.navigate("HomeTab")}>
                <Ionicons name="search" size={17} color={colors.white} />
                <Text style={styles.emptyCtaText}>Browse open slots</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  title: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, marginBottom: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  service: { ...typography.body, marginTop: 4, marginBottom: spacing.sm },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  metaText: { ...typography.caption, marginLeft: 6 },
  payRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  payLabel: { ...typography.caption },
  payAmount: { fontSize: 16, fontWeight: "800", color: colors.black },
  empty: { alignItems: "center", marginTop: spacing.xl, opacity: 0.6, paddingHorizontal: spacing.lg },
  emptyText: { ...typography.body, marginTop: spacing.sm, textAlign: "center" },
  emptyState: {
    alignItems: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.apricotLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: { ...typography.heading, fontSize: 17, textAlign: "center" },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.black,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    ...shadow.card,
  },
  emptyCtaText: { color: colors.white, fontWeight: "800", fontSize: 14, marginLeft: 8 },
});

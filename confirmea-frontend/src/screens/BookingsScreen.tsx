import React from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import { useBookings } from "../context/BookingsContext";
import Badge from "../components/Badge";

export default function BookingsScreen() {
  const { bookings } = useBookings();

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={[typography.heading, styles.title]}>My Bookings</Text>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
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
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>No bookings yet — go grab a last-minute slot!</Text>
          </View>
        }
      />
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
  empty: { alignItems: "center", marginTop: spacing.xl, opacity: 0.6 },
  emptyText: { ...typography.body, marginTop: spacing.sm, textAlign: "center" },
});

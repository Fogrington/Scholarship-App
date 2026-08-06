import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView, Pressable, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import { useBusiness } from "../context/BusinessContext";
import Badge from "../components/Badge";
import { ApiError } from "../api/client";

export default function BusinessBookingsScreen() {
  const { bookings, loading, error, markArrived } = useBusiness();
  const [markingId, setMarkingId] = useState<number | null>(null);

  const handleMarkArrived = (id: number, customerName: string) => {
    Alert.alert("Mark as arrived?", `Confirm ${customerName} has arrived for their appointment.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark arrived",
        onPress: async () => {
          setMarkingId(id);
          try {
            await markArrived(id);
          } catch (err) {
            Alert.alert("Couldn't update it", err instanceof ApiError ? err.message : "Try again.");
          } finally {
            setMarkingId(null);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={[typography.heading, styles.title]}>Bookings</Text>

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
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={typography.subheading}>{item.customer.name}</Text>
                <Badge
                  text={item.status}
                  tone={item.status === "Upcoming" ? "apricot" : "success"}
                />
              </View>
              <Text style={styles.email}>{item.customer.email}</Text>

              <View style={styles.metaRow}>
                <Ionicons name="cut-outline" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>{item.listing.service}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>{item.listing.slotTime}</Text>
              </View>

              {item.status === "Upcoming" && (
                <Pressable
                  style={styles.arrivedBtn}
                  onPress={() => handleMarkArrived(item.id, item.customer.name)}
                  disabled={markingId === item.id}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.white} />
                  <Text style={styles.arrivedBtnText}>
                    {markingId === item.id ? "Updating…" : "Mark arrived"}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={28} color={colors.textMuted} />
              <Text style={styles.emptyText}>No one's booked a slot yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  title: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, marginBottom: spacing.md, fontSize: 20 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  email: { ...typography.caption, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  metaText: { ...typography.caption, marginLeft: 6 },
  arrivedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success,
    borderRadius: radius.sm,
    paddingVertical: 10,
    marginTop: spacing.md,
  },
  arrivedBtnText: { color: colors.white, fontWeight: "800", fontSize: 12.5, marginLeft: 6 },
  empty: { alignItems: "center", marginTop: spacing.xl, opacity: 0.6, paddingHorizontal: spacing.lg },
  emptyText: { ...typography.body, marginTop: spacing.sm, textAlign: "center" },
});

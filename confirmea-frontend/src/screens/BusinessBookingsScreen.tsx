import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import { useBusiness } from "../context/BusinessContext";
import Badge from "../components/Badge";
import ConfirmModal from "../components/ConfirmModal";
import RateCustomerModal from "../components/RateCustomerModal";
import { ApiError } from "../api/client";
import type { BusinessBooking } from "../types";

type PendingAction = { id: number; customerName: string; outcome: "arrived" | "no-show" };
type RatePrompt = { id: number; customerName: string; outcome: "arrived" | "no-show" };

const STATUS_TONE: Record<BusinessBooking["status"], "apricot" | "success" | "warning" | "black"> = {
  Offered: "apricot",
  Upcoming: "apricot",
  Completed: "success",
  NoShow: "warning",
  Cancelled: "black",
};

export default function BusinessBookingsScreen() {
  const { bookings, loading, error, markArrived, markNoShow, rateCustomer } = useBusiness();
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [ratePrompt, setRatePrompt] = useState<RatePrompt | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!pending) return;
    const { id, customerName, outcome } = pending;
    setPending(null);
    setActionError(null);
    setMarkingId(id);
    try {
      if (outcome === "arrived") {
        await markArrived(id);
      } else {
        await markNoShow(id);
      }
      setRatePrompt({ id, customerName, outcome });
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't update it. Try again.");
    } finally {
      setMarkingId(null);
    }
  };

  const handleRateSubmit = async (rating: number) => {
    if (!ratePrompt) return;
    await rateCustomer(ratePrompt.id, rating);
    setRatePrompt(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={[typography.heading, styles.title]}>Bookings</Text>

      {actionError && (
        <View style={styles.actionErrorBox}>
          <Text style={styles.actionErrorText}>{actionError}</Text>
        </View>
      )}

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
                <View style={{ flex: 1 }}>
                  <Text style={typography.subheading}>{item.customer.name}</Text>
                  <View style={styles.ratingRow}>
                    {item.customer.rating !== null ? (
                      <>
                        <Ionicons name="star" size={12} color={colors.apricotDark} />
                        <Text style={styles.ratingText}>
                          {item.customer.rating} ({item.customer.reviewCount})
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.ratingText}>New customer</Text>
                    )}
                  </View>
                </View>
                <Badge text={item.status} tone={STATUS_TONE[item.status]} />
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
                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.arrivedBtn}
                    onPress={() => setPending({ id: item.id, customerName: item.customer.name, outcome: "arrived" })}
                    disabled={markingId === item.id}
                  >
                    <Ionicons name="checkmark-circle-outline" size={16} color={colors.white} />
                    <Text style={styles.arrivedBtnText}>
                      {markingId === item.id ? "Updating…" : "Mark arrived"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.noShowBtn}
                    onPress={() => setPending({ id: item.id, customerName: item.customer.name, outcome: "no-show" })}
                    disabled={markingId === item.id}
                  >
                    <Ionicons name="close-circle-outline" size={16} color={colors.warning} />
                    <Text style={styles.noShowBtnText}>No-show</Text>
                  </Pressable>
                </View>
              )}

              {item.canRateCustomer && (
                <Pressable
                  style={styles.rateBtn}
                  onPress={() =>
                    setRatePrompt({
                      id: item.id,
                      customerName: item.customer.name,
                      outcome: item.status === "NoShow" ? "no-show" : "arrived",
                    })
                  }
                >
                  <Ionicons name="star-outline" size={15} color={colors.apricotDark} />
                  <Text style={styles.rateBtnText}>Rate this customer</Text>
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

      <ConfirmModal
        visible={pending !== null}
        title={pending?.outcome === "arrived" ? "Mark as arrived?" : "Mark as a no-show?"}
        message={
          pending
            ? pending.outcome === "arrived"
              ? `Confirm ${pending.customerName} has arrived for their appointment.`
              : `Confirm ${pending.customerName} didn't show up for their appointment.`
            : ""
        }
        confirmLabel={pending?.outcome === "arrived" ? "Mark arrived" : "Mark no-show"}
        destructive={pending?.outcome === "no-show"}
        onCancel={() => setPending(null)}
        onConfirm={handleConfirm}
      />

      <RateCustomerModal
        visible={ratePrompt !== null}
        customerName={ratePrompt?.customerName ?? ""}
        outcome={ratePrompt?.outcome ?? "arrived"}
        onSubmit={handleRateSubmit}
        onSkip={() => setRatePrompt(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  title: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, marginBottom: spacing.md, fontSize: 20 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  actionErrorBox: {
    backgroundColor: "#FBEAE6",
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  actionErrorText: { color: colors.warning, fontSize: 12.5, fontWeight: "600" },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  ratingText: { ...typography.caption, marginLeft: 3 },
  email: { ...typography.caption, marginTop: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  metaText: { ...typography.caption, marginLeft: 6 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: spacing.md },
  arrivedBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success,
    borderRadius: radius.sm,
    paddingVertical: 10,
  },
  arrivedBtnText: { color: colors.white, fontWeight: "800", fontSize: 12.5, marginLeft: 6 },
  noShowBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: colors.warning,
  },
  noShowBtnText: { color: colors.warning, fontWeight: "800", fontSize: 12.5, marginLeft: 6 },
  rateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rateBtnText: { color: colors.apricotDark, fontWeight: "700", fontSize: 12.5, marginLeft: 6 },
  empty: { alignItems: "center", marginTop: spacing.xl, opacity: 0.6, paddingHorizontal: spacing.lg },
  emptyText: { ...typography.body, marginTop: spacing.sm, textAlign: "center" },
});

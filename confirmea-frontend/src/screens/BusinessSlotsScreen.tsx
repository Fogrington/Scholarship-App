import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView, Pressable, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import { useAuth } from "../context/AuthContext";
import { useBusiness } from "../context/BusinessContext";
import Badge from "../components/Badge";
import { ApiError } from "../api/client";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BusinessStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<BusinessStackParamList, "Slots">;

export default function BusinessSlotsScreen({ navigation }: Props) {
  const { businessName } = useAuth();
  const { listings, loading, error, closeListing } = useBusiness();
  const [closingId, setClosingId] = useState<number | null>(null);

  const handleClose = (id: number, service: string) => {
    Alert.alert("Close this slot?", `"${service}" will stop showing up for customers to book.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Close slot",
        style: "destructive",
        onPress: async () => {
          setClosingId(id);
          try {
            await closeListing(id);
          } catch (err) {
            Alert.alert("Couldn't close it", err instanceof ApiError ? err.message : "Try again.");
          } finally {
            setClosingId(null);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Open Slots</Text>
          <Text style={styles.subtitle}>{businessName ?? "Your business"}</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => navigation.navigate("AddSlot")}>
          <Ionicons name="add" size={22} color={colors.white} />
        </Pressable>
      </View>

      {error ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : loading ? (
        <ActivityIndicator color={colors.apricotDark} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={typography.subheading}>{item.service}</Text>
                {!item.isActive ? (
                  <Badge text="Closed" tone="black" />
                ) : item.isFull ? (
                  <Badge text="Full" tone="warning" />
                ) : (
                  <Badge text="Open" tone="apricot" />
                )}
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>{item.slotTime}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="pricetag-outline" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>
                  ${item.price}
                  {item.discountPercent ? ` · ${item.discountPercent}% off` : ""}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="people-outline" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>
                  {item.upcomingBookings} of {item.capacity} spot{item.capacity === 1 ? "" : "s"} booked
                </Text>
              </View>

              {item.isActive && (
                <Pressable
                  style={styles.closeBtn}
                  onPress={() => handleClose(item.id, item.service)}
                  disabled={closingId === item.id}
                >
                  <Text style={styles.closeBtnText}>
                    {closingId === item.id ? "Closing…" : "Close this slot"}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={28} color={colors.textMuted} />
              <Text style={styles.emptyText}>No open slots yet — add one to get started.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  title: { ...typography.heading, fontSize: 20 },
  subtitle: { ...typography.caption, marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  metaText: { ...typography.caption, marginLeft: 6 },
  closeBtn: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: "center",
  },
  closeBtnText: { color: colors.warning, fontWeight: "700", fontSize: 12.5 },
  empty: { alignItems: "center", marginTop: spacing.xl, opacity: 0.6, paddingHorizontal: spacing.lg },
  emptyText: { ...typography.body, marginTop: spacing.sm, textAlign: "center" },
});

import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import { mockPendingBusinesses, PendingBusiness } from "../data/mockData";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Admin">;

export default function AdminScreen({ navigation }: Props) {
  const [pending, setPending] = useState<PendingBusiness[]>(mockPendingBusinesses);

  const decide = (id: string) => {
    setPending((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.topTitle}>Business approvals</Text>
        <View style={{ width: 36 }} />
      </View>

      <Text style={styles.sectionLabel}>
        {pending.length} PENDING REGISTRATION{pending.length === 1 ? "" : "S"}
      </Text>

      <FlatList
        data={pending}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={typography.subheading}>{item.name}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="document-text-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>ABN {item.abn}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>{item.address}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>Submitted {item.submitted}</Text>
            </View>

            <View style={styles.actionRow}>
              <Pressable style={styles.rejectBtn} onPress={() => decide(item.id)}>
                <Text style={styles.rejectText}>Reject</Text>
              </Pressable>
              <Pressable style={styles.approveBtn} onPress={() => decide(item.id)}>
                <Text style={styles.approveText}>Approve</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>All caught up — no pending registrations.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  topTitle: { ...typography.subheading },
  sectionLabel: {
    ...typography.caption,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  metaText: { ...typography.caption, marginLeft: 5 },
  actionRow: { flexDirection: "row", marginTop: spacing.md },
  rejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    marginRight: spacing.sm,
  },
  rejectText: { color: colors.charcoal, fontWeight: "700" },
  approveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.black,
    alignItems: "center",
  },
  approveText: { color: colors.white, fontWeight: "700" },
  empty: { alignItems: "center", marginTop: spacing.xl, opacity: 0.6 },
  emptyText: { ...typography.body, marginTop: spacing.sm, textAlign: "center" },
});

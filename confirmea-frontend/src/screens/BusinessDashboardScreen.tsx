import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView, Pressable, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import { mockBusinessSlots, BusinessSlot } from "../data/mockData";
import Badge from "../components/Badge";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "BusinessDashboard">;

export default function BusinessDashboardScreen({ navigation }: Props) {
  const [slots, setSlots] = useState<BusinessSlot[]>(mockBusinessSlots);
  const [listed, setListed] = useState(true);

  const openSlots = slots.filter((s) => !s.filled).length;

  const toggleSlot = (id: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, filled: !s.filled } : s))
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.topTitle}>Business dashboard</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{openSlots}</Text>
          <Text style={typography.caption}>Open slots today</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>$0</Text>
          <Text style={typography.caption}>Est. fees this week</Text>
        </View>
      </View>

      <View style={styles.listedRow}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="storefront-outline" size={18} color={colors.apricotDark} />
          <Text style={styles.listedLabel}>Salt & Co Hair Studio is listed</Text>
        </View>
        <Switch
          value={listed}
          onValueChange={setListed}
          trackColor={{ false: colors.border, true: colors.apricot }}
          thumbColor={colors.white}
        />
      </View>

      <Text style={styles.sectionLabel}>TODAY'S SLOTS</Text>

      <FlatList
        data={slots}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.slotCard}>
            <View style={{ flex: 1 }}>
              <Text style={typography.subheading}>{item.service}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>{item.time}</Text>
              </View>
            </View>
            <Pressable onPress={() => toggleSlot(item.id)}>
              <Badge text={item.filled ? "Filled" : "Open — list it"} tone={item.filled ? "success" : "apricot"} />
            </Pressable>
          </View>
        )}
      />

      <View style={styles.footer}>
        <Pressable style={styles.addBtn}>
          <Ionicons name="add-circle-outline" size={18} color={colors.white} />
          <Text style={styles.addBtnText}>Add a last-minute slot</Text>
        </Pressable>
      </View>
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
  summaryRow: { flexDirection: "row", paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginRight: spacing.sm,
    ...shadow.card,
  },
  summaryNumber: { fontSize: 24, fontWeight: "800", color: colors.black, marginBottom: 2 },
  listedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  listedLabel: { ...typography.body, marginLeft: spacing.sm, fontWeight: "600" },
  sectionLabel: {
    ...typography.caption,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  slotCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  metaText: { ...typography.caption, marginLeft: 4 },
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
  addBtn: {
    flexDirection: "row",
    backgroundColor: colors.black,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: colors.white, fontWeight: "800", fontSize: 15, marginLeft: 8 },
});

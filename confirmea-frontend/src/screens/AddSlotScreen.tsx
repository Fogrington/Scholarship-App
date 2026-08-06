import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import { categories } from "../types";
import { useBusiness } from "../context/BusinessContext";
import { ApiError } from "../api/client";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BusinessStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<BusinessStackParamList, "AddSlot">;

const DAYS = ["Today", "Tomorrow"] as const;

// Half-hour slots covering typical trading hours, 8:00 AM to 9:00 PM.
function buildTimeOptions(): string[] {
  const times: string[] = [];
  for (let hour = 8; hour <= 21; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 21 && minute === 30) continue;
      const period = hour < 12 ? "AM" : "PM";
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      times.push(`${displayHour}:${minute === 0 ? "00" : "30"} ${period}`);
    }
  }
  return times;
}

const CAPACITY_MIN = 1;
const CAPACITY_MAX = 20;

export default function AddSlotScreen({ navigation }: Props) {
  const { addListing } = useBusiness();
  const timeOptions = useMemo(buildTimeOptions, []);

  const [service, setService] = useState("");
  const [category, setCategory] = useState(categories[0].key);
  const [price, setPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [day, setDay] = useState<(typeof DAYS)[number]>("Today");
  const [time, setTime] = useState<string | null>(null);
  const [capacity, setCapacity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const priceNum = Number(price);
  const canSubmit =
    service.trim().length > 0 &&
    time !== null &&
    price.trim().length > 0 &&
    !Number.isNaN(priceNum) &&
    priceNum > 0;

  const adjustCapacity = (delta: number) => {
    setCapacity((prev) => Math.min(CAPACITY_MAX, Math.max(CAPACITY_MIN, prev + delta)));
  };

  const handleSubmit = async () => {
    if (!canSubmit || !time) return;
    setError(null);
    setSubmitting(true);
    try {
      const discount = discountPercent.trim() ? Number(discountPercent) : undefined;
      await addListing({
        service: service.trim(),
        category,
        price: priceNum,
        discountPercent: discount,
        slotTime: `${day}, ${time}`,
        capacity,
      });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't post this slot. Try again.");
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
        <Text style={styles.topTitle}>Add a slot</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.label}>Service</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Gel Manicure"
            placeholderTextColor={colors.textMuted}
            value={service}
            onChangeText={setService}
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.chipRow}>
            {categories.map((c) => (
              <Pressable
                key={c.key}
                style={[styles.chip, category === c.key && styles.chipActive]}
                onPress={() => setCategory(c.key)}
              >
                <Text style={[styles.chipText, category === c.key && styles.chipTextActive]}>{c.key}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Price ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 45"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
          />

          <Text style={styles.label}>Discount % (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 15"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            value={discountPercent}
            onChangeText={setDiscountPercent}
          />

          <Text style={styles.label}>Day</Text>
          <View style={styles.chipRow}>
            {DAYS.map((d) => (
              <Pressable
                key={d}
                style={[styles.dayChip, day === d && styles.chipActive]}
                onPress={() => setDay(d)}
              >
                <Text style={[styles.chipText, day === d && styles.chipTextActive]}>{d}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Time</Text>
          <View style={styles.timeGrid}>
            {timeOptions.map((t) => (
              <Pressable
                key={t}
                style={[styles.timeChip, time === t && styles.chipActive]}
                onPress={() => setTime(t)}
              >
                <Text style={[styles.timeChipText, time === t && styles.chipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>How many people can accept this slot?</Text>
          <View style={styles.stepperRow}>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => adjustCapacity(-1)}
              disabled={capacity <= CAPACITY_MIN}
            >
              <Ionicons
                name="remove"
                size={18}
                color={capacity <= CAPACITY_MIN ? colors.textMuted : colors.black}
              />
            </Pressable>
            <Text style={styles.stepperValue}>{capacity}</Text>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => adjustCapacity(1)}
              disabled={capacity >= CAPACITY_MAX}
            >
              <Ionicons
                name="add"
                size={18}
                color={capacity >= CAPACITY_MAX ? colors.textMuted : colors.black}
              />
            </Pressable>
          </View>
          <Text style={styles.hint}>
            Once this many customers have booked, the slot stops showing up for anyone else.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.submitBtn, (!canSubmit || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          <Text style={styles.submitText}>{submitting ? "Posting…" : "Post this slot"}</Text>
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
  content: { padding: spacing.lg, paddingBottom: 140 },
  errorBox: {
    backgroundColor: "#FBEAE6",
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.warning, fontSize: 12.5, fontWeight: "600" },
  label: { ...typography.caption, marginBottom: 6, marginTop: spacing.md, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.charcoal,
    backgroundColor: colors.white,
  },
  hint: { ...typography.caption, marginTop: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  dayChip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.black, borderColor: colors.black },
  chipText: { fontSize: 13, fontWeight: "700", color: colors.charcoal },
  chipTextActive: { color: colors.white },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    minWidth: "22%",
    alignItems: "center",
  },
  timeChipText: { fontSize: 12.5, fontWeight: "700", color: colors.charcoal },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignSelf: "flex-start",
  },
  stepperBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    minWidth: 40,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: colors.black,
  },
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
  submitBtn: {
    backgroundColor: colors.black,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { color: colors.white, fontWeight: "800", fontSize: 15 },
});

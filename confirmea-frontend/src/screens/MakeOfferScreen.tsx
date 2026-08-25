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
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BusinessRequestsStackParamList } from "../navigation/RootNavigator";
import type { OfferResult } from "../types";

type Props = NativeStackScreenProps<BusinessRequestsStackParamList, "MakeOffer">;

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

export default function MakeOfferScreen({ navigation, route }: Props) {
  const { requestId, customerName, category } = route.params;
  const { token } = useAuth();
  const timeOptions = useMemo(buildTimeOptions, []);

  const [service, setService] = useState("");
  const [price, setPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [day, setDay] = useState<(typeof DAYS)[number]>("Today");
  const [time, setTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<OfferResult | null>(null);

  const priceNum = Number(price);
  const canSubmit =
    service.trim().length > 0 &&
    time !== null &&
    price.trim().length > 0 &&
    !Number.isNaN(priceNum) &&
    priceNum > 0;

  const handleSubmit = async () => {
    if (!canSubmit || !time) return;
    setError(null);
    setSubmitting(true);
    try {
      const discount = discountPercent.trim() ? Number(discountPercent) : undefined;
      const result = await api.post<OfferResult>(
        `/requests/${requestId}/offer`,
        {
          service: service.trim(),
          price: priceNum,
          discountPercent: discount,
          slotTime: `${day}, ${time}`,
        },
        token
      );
      setSent(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send this offer. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.sentWrap}>
          <View style={styles.sentIconWrap}>
            <Ionicons name="checkmark" size={30} color={colors.white} />
          </View>
          <Text style={styles.sentTitle}>Offer sent</Text>
          <Text style={styles.sentBody}>
            {sent.customerName} will get a notification to accept or decline {sent.service} at{" "}
            {sent.slotTime}.
          </Text>
          <Pressable style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Back to requests</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.topTitle}>Make an offer</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.customerCard}>
            <Ionicons name="person-circle-outline" size={22} color={colors.apricotDark} />
            <View style={{ marginLeft: spacing.sm }}>
              <Text style={styles.customerName}>{customerName}</Text>
              <Text style={styles.customerCategory}>Looking for {category}</Text>
            </View>
          </View>

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
          <Text style={styles.hint}>
            This offer is just for {customerName} — it won't show up publicly on Discover.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.submitBtn, (!canSubmit || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          <Text style={styles.submitText}>{submitting ? "Sending…" : "Send offer"}</Text>
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
  customerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  customerName: { fontSize: 15, fontWeight: "800", color: colors.black },
  customerCategory: { ...typography.caption, marginTop: 2 },
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
  hint: { ...typography.caption, marginTop: spacing.md },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
  sentWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  sentIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  sentTitle: { ...typography.heading, fontSize: 20, textAlign: "center" },
  sentBody: { ...typography.body, marginTop: 8, textAlign: "center", color: colors.textMuted },
  doneBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.black,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
  },
  doneBtnText: { color: colors.white, fontWeight: "800", fontSize: 14 },
});

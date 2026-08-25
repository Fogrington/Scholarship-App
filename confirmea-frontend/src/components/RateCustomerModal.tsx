import React, { useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";

interface Props {
  visible: boolean;
  customerName: string;
  outcome: "arrived" | "no-show";
  onSubmit: (rating: number) => Promise<void>;
  onSkip: () => void;
}

export default function RateCustomerModal({ visible, customerName, outcome, onSubmit, onSkip }: Props) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selectedRating === 0) return;
    setSubmitting(true);
    try {
      await onSubmit(selectedRating);
      setSelectedRating(0);
    } catch {
      // Leave the modal open so the business can retry — no separate error banner
      // needed for a lightweight prompt like this.
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    setSelectedRating(0);
    onSkip();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="star" size={22} color={colors.white} />
          </View>

          <Text style={styles.title}>Rate {customerName}</Text>
          <Text style={styles.subtitle}>
            {outcome === "arrived"
              ? "How was this customer's visit?"
              : "Marked as a no-show — rate the customer if you'd like."}
          </Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setSelectedRating(star)} hitSlop={6}>
                <Ionicons
                  name={star <= selectedRating ? "star" : "star-outline"}
                  size={34}
                  color={colors.apricot}
                  style={{ marginHorizontal: 4 }}
                />
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.submitBtn, (selectedRating === 0 || submitting) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={selectedRating === 0 || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitText}>Submit rating</Text>
            )}
          </Pressable>

          <Pressable onPress={handleSkip} style={styles.skipBtn} disabled={submitting}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(26,26,26,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    ...shadow.card,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.apricot,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: { ...typography.heading, fontSize: 19, textAlign: "center" },
  subtitle: { ...typography.body, marginTop: 6, marginBottom: spacing.md, textAlign: "center" },
  starsRow: { flexDirection: "row", marginVertical: spacing.sm },
  submitBtn: {
    width: "100%",
    backgroundColor: colors.black,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.md,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { color: colors.white, fontWeight: "800", fontSize: 15 },
  skipBtn: { marginTop: spacing.sm, paddingVertical: 6 },
  skipText: { color: colors.textMuted, fontWeight: "600", fontSize: 13 },
});

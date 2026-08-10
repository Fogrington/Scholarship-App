import React, { useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import { useReviews } from "../context/ReviewsContext";

export default function ReviewPromptModal() {
  const { pendingReviews, submitReview, skipForNow } = useReviews();
  const [selectedRating, setSelectedRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const current = pendingReviews[0];
  const visible = current !== undefined;

  const handleSubmit = async () => {
    if (!current || selectedRating === 0) return;
    setSubmitting(true);
    try {
      await submitReview(current.bookingId, selectedRating);
      setSelectedRating(0);
    } catch {
      // If the submit fails, just leave the modal open on this booking so they can
      // retry — no need for a separate error banner in a lightweight prompt like this.
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    setSelectedRating(0);
    skipForNow();
  };

  if (!current) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="sparkles" size={22} color={colors.white} />
          </View>

          <Text style={styles.title}>How was your visit?</Text>
          <Text style={styles.subtitle}>
            {current.service} at {current.businessName}
          </Text>
          <Text style={styles.meta}>{current.slotTime}</Text>

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
            <Text style={styles.skipText}>Not now</Text>
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
  subtitle: { ...typography.body, marginTop: 6, textAlign: "center", fontWeight: "600" },
  meta: { ...typography.caption, marginTop: 2, marginBottom: spacing.md, textAlign: "center" },
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

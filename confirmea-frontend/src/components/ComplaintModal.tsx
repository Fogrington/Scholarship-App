import React, { useState } from "react";
import { Modal, View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Props {
  visible: boolean;
  type: "business" | "app";
  businessId?: number;
  businessName?: string;
  onClose: () => void;
}

const BUSINESS_CATEGORIES = ["Service quality", "No-show", "Billing dispute", "Hygiene concern", "Other"];
const APP_CATEGORIES = ["Bug", "Suggestion", "General feedback"];

export default function ComplaintModal({ visible, type, businessId, businessName, onClose }: Props) {
  const { token } = useAuth();
  const categories = type === "business" ? BUSINESS_CATEGORIES : APP_CATEGORIES;
  const [category, setCategory] = useState(categories[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const canSubmit = details.trim().length > 0;

  const handleClose = () => {
    setDetails("");
    setCategory(categories[0]);
    setError(null);
    setSent(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const body =
        type === "business"
          ? { type: "business", businessId, category, details: details.trim() }
          : { type: "app", category, details: details.trim() };
      await api.post("/complaints", body, token);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send this. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={handleClose} />
        <View style={styles.sheet}>
          {sent ? (
            <View style={styles.sentWrap}>
              <View style={styles.sentIconWrap}>
                <Ionicons name="checkmark" size={26} color={colors.white} />
              </View>
              <Text style={styles.title}>
                {type === "business" ? "Complaint sent" : "Thanks for the feedback"}
              </Text>
              <Text style={styles.subtitle}>
                {type === "business"
                  ? "Our team will review it and follow up if needed."
                  : "We read every suggestion — appreciate you taking the time."}
              </Text>
              <Pressable style={styles.submitBtn} onPress={handleClose}>
                <Text style={styles.submitText}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>
                  {type === "business" ? `Report an issue${businessName ? ` — ${businessName}` : ""}` : "Send feedback about Confirmea"}
                </Text>
                <Pressable onPress={handleClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={18} color={colors.black} />
                </Pressable>
              </View>
              <Text style={styles.subtitle}>
                {type === "business"
                  ? "This goes to our team, not directly to the business."
                  : "Bugs, ideas, anything that would make Confirmea better — this goes straight to our team."}
              </Text>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Text style={styles.label}>Category</Text>
              <View style={styles.chipRow}>
                {categories.map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.chip, category === c && styles.chipActive]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Details</Text>
              <TextInput
                style={styles.input}
                placeholder={
                  type === "business" ? "What happened?" : "What would you change or fix?"
                }
                placeholderTextColor={colors.textMuted}
                value={details}
                onChangeText={setDetails}
                multiline
                numberOfLines={4}
              />

              <Pressable
                style={[styles.submitBtn, (!canSubmit || submitting) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit || submitting}
              >
                <Text style={styles.submitText}>{submitting ? "Sending…" : "Send"}</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(26,26,26,0.4)", justifyContent: "flex-end" },
  backdropTap: { flex: 1 },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    ...shadow.card,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { ...typography.heading, fontSize: 18, flex: 1, paddingRight: spacing.sm },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: { ...typography.caption, marginTop: 6, marginBottom: spacing.md, lineHeight: 17 },
  errorBox: {
    backgroundColor: "#FBEAE6",
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.warning, fontSize: 12.5, fontWeight: "600" },
  label: { ...typography.caption, marginBottom: 8, fontWeight: "700" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.md },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.black, borderColor: colors.black },
  chipText: { fontSize: 13, fontWeight: "700", color: colors.charcoal },
  chipTextActive: { color: colors.white },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.charcoal,
    backgroundColor: colors.cream,
    textAlignVertical: "top",
    minHeight: 90,
    marginBottom: spacing.lg,
  },
  submitBtn: {
    backgroundColor: colors.black,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: colors.white, fontWeight: "800", fontSize: 15 },
  sentWrap: { alignItems: "center", paddingVertical: spacing.md },
  sentIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
});

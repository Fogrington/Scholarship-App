import React, { useState } from "react";
import { Modal, View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import { categories, type Category } from "../types";
import { useRequests } from "../context/RequestsContext";
import { ApiError } from "../api/client";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CreateRequestModal({ visible, onClose }: Props) {
  const { createRequest } = useRequests();
  const [category, setCategory] = useState<Category>(categories[0].key);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createRequest(category, note.trim());
      setNote("");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't post your request. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropTap} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>What are you after?</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={colors.black} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            Businesses that offer this will see your request and can reach out with an
            opening — oldest requests get seen first.
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
                key={c.key}
                style={[styles.chip, category === c.key && styles.chipActive]}
                onPress={() => setCategory(c.key)}
              >
                <Text style={[styles.chipText, category === c.key && styles.chipTextActive]}>{c.key}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Anything businesses should know? (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Flexible on timing, need it done before 6pm"
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />

          <Pressable
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitText}>{submitting ? "Posting…" : "Post request"}</Text>
          </Pressable>
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
  title: { ...typography.heading, fontSize: 19 },
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
    minHeight: 72,
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
});

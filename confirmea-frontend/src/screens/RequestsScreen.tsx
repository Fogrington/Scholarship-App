import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import { useRequests } from "../context/RequestsContext";
import CreateRequestModal from "../components/CreateRequestModal";
import ConfirmModal from "../components/ConfirmModal";
import { ApiError } from "../api/client";

const STATUS_COPY: Record<string, { label: string; tone: "apricot" | "success" }> = {
  open: { label: "Waiting for a business", tone: "apricot" },
  offered: { label: "You've got an offer!", tone: "success" },
};

export default function RequestsScreen() {
  const { myRequest, loading, error, withdrawRequest } = useRequests();
  const [createVisible, setCreateVisible] = useState(false);
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleWithdraw = async () => {
    if (!myRequest) return;
    setWithdrawVisible(false);
    setSubmitting(true);
    setActionError(null);
    try {
      await withdrawRequest(myRequest.id);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't take this down. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusInfo = myRequest ? STATUS_COPY[myRequest.status] : null;

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={[typography.heading, styles.title]}>Requests</Text>
      <Text style={styles.subtitle}>
        Can't find an open slot that suits you? Put out a call and let nearby businesses come
        to you.
      </Text>

      {actionError && (
        <View style={styles.actionErrorBox}>
          <Text style={styles.actionErrorText}>{actionError}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.apricotDark} style={{ marginTop: spacing.xl }} />
      ) : error ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : myRequest ? (
        <View style={styles.activeCard}>
          <View style={styles.rowBetween}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{myRequest.category}</Text>
            </View>
            {statusInfo && (
              <View style={[styles.statusPill, statusInfo.tone === "success" && styles.statusPillSuccess]}>
                <Text style={styles.statusPillText}>{statusInfo.label}</Text>
              </View>
            )}
          </View>

          {myRequest.note ? <Text style={styles.note}>"{myRequest.note}"</Text> : null}

          <Text style={styles.hint}>
            {myRequest.status === "open"
              ? "Businesses that offer this will see your request, oldest first."
              : "A business is waiting on your response — check the alert on your next login, or come back here shortly."}
          </Text>

          {myRequest.status === "open" && (
            <Pressable
              style={styles.withdrawBtn}
              onPress={() => setWithdrawVisible(true)}
              disabled={submitting}
            >
              <Text style={styles.withdrawText}>{submitting ? "Taking down…" : "Take down request"}</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="megaphone-outline" size={30} color={colors.apricotDark} />
          </View>
          <Text style={styles.emptyTitle}>No active request</Text>
          <Text style={styles.emptyDescription}>
            Post what you're after and businesses that offer it will come to you with an
            opening.
          </Text>
          <Pressable style={styles.bigBtn} onPress={() => setCreateVisible(true)}>
            <Ionicons name="add-circle" size={22} color={colors.white} />
            <Text style={styles.bigBtnText}>I'm looking for a service</Text>
          </Pressable>
        </View>
      )}

      <CreateRequestModal visible={createVisible} onClose={() => setCreateVisible(false)} />
      <ConfirmModal
        visible={withdrawVisible}
        title="Take down this request?"
        message="Businesses won't be able to see or offer on it anymore."
        confirmLabel="Take it down"
        destructive
        onCancel={() => setWithdrawVisible(false)}
        onConfirm={handleWithdraw}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  title: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, fontSize: 20 },
  subtitle: {
    ...typography.caption,
    paddingHorizontal: spacing.lg,
    marginTop: 6,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  actionErrorBox: {
    backgroundColor: "#FBEAE6",
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  actionErrorText: { color: colors.warning, fontSize: 12.5, fontWeight: "600" },
  emptyState: {
    alignItems: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.apricotLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: { ...typography.heading, fontSize: 18, textAlign: "center" },
  emptyDescription: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    marginBottom: spacing.lg,
  },
  bigBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.black,
    borderRadius: radius.lg,
    paddingVertical: 18,
    paddingHorizontal: spacing.xl,
    width: "100%",
    ...shadow.card,
  },
  bigBtnText: { color: colors.white, fontWeight: "800", fontSize: 16, marginLeft: 10 },
  activeCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadow.card,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  categoryTag: {
    backgroundColor: colors.black,
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  categoryTagText: { color: colors.white, fontSize: 12, fontWeight: "800" },
  statusPill: {
    backgroundColor: colors.apricotLight,
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  statusPillSuccess: { backgroundColor: "#E7F2EB" },
  statusPillText: { fontSize: 12, fontWeight: "800", color: colors.apricotDark },
  note: { ...typography.body, marginTop: spacing.md, fontStyle: "italic", color: colors.charcoal },
  hint: { ...typography.caption, marginTop: spacing.sm, lineHeight: 17 },
  withdrawBtn: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: "center",
  },
  withdrawText: { color: colors.warning, fontWeight: "700", fontSize: 13 },
  empty: { alignItems: "center", marginTop: spacing.xl, opacity: 0.6, paddingHorizontal: spacing.lg },
  emptyText: { ...typography.body, marginTop: spacing.sm, textAlign: "center" },
});

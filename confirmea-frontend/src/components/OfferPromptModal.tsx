import React, { useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import { useRequests } from "../context/RequestsContext";
import { ApiError } from "../api/client";

type Step = "offer" | "declineChoice";

export default function OfferPromptModal() {
  const { pendingOffer, respondToOffer } = useRequests();
  const [step, setStep] = useState<Step>("offer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = pendingOffer !== null;

  const resetAndClose = () => {
    setStep("offer");
    setError(null);
  };

  const handleAccept = async () => {
    if (!pendingOffer) return;
    setSubmitting(true);
    setError(null);
    try {
      await respondToOffer(pendingOffer.bookingId, true);
      resetAndClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't confirm this offer. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineChoice = async (keepRequestOpen: boolean) => {
    if (!pendingOffer) return;
    setSubmitting(true);
    setError(null);
    try {
      await respondToOffer(pendingOffer.bookingId, false, keepRequestOpen);
      resetAndClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update your request. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!pendingOffer) return null;

  const discounted = pendingOffer.discountPercent
    ? Math.round(pendingOffer.price * (1 - pendingOffer.discountPercent / 100))
    : pendingOffer.price;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {step === "offer" ? (
            <>
              <View style={styles.iconWrap}>
                <Ionicons name="gift" size={22} color={colors.white} />
              </View>
              <Text style={styles.title}>You've got an offer!</Text>
              <Text style={styles.subtitle}>
                {pendingOffer.businessName} can fit you in for {pendingOffer.service}
              </Text>

              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={15} color={colors.apricotDark} />
                  <Text style={styles.detailText}>{pendingOffer.slotTime}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="pricetag-outline" size={15} color={colors.apricotDark} />
                  <Text style={styles.detailText}>
                    ${discounted}
                    {pendingOffer.discountPercent ? ` (${pendingOffer.discountPercent}% off $${pendingOffer.price})` : ""}
                    {" · pay in person"}
                  </Text>
                </View>
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <Pressable
                style={[styles.acceptBtn, submitting && styles.btnDisabled]}
                onPress={handleAccept}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.acceptText}>Accept</Text>}
              </Pressable>
              <Pressable
                style={styles.declineBtn}
                onPress={() => setStep("declineChoice")}
                disabled={submitting}
              >
                <Text style={styles.declineText}>Decline</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={[styles.iconWrap, { backgroundColor: colors.charcoal }]}>
                <Ionicons name="help" size={22} color={colors.white} />
              </View>
              <Text style={styles.title}>Keep looking?</Text>
              <Text style={styles.subtitle}>
                You can leave your request open for other businesses to offer, or take it down.
              </Text>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <Pressable
                style={[styles.acceptBtn, submitting && styles.btnDisabled]}
                onPress={() => handleDeclineChoice(true)}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.acceptText}>Keep looking</Text>
                )}
              </Pressable>
              <Pressable
                style={styles.declineBtn}
                onPress={() => handleDeclineChoice(false)}
                disabled={submitting}
              >
                <Text style={styles.declineText}>Take my request down</Text>
              </Pressable>
            </>
          )}
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
  subtitle: { ...typography.body, marginTop: 6, textAlign: "center" },
  detailCard: {
    width: "100%",
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  detailRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  detailText: { ...typography.body, marginLeft: 8, fontWeight: "600" },
  errorText: { color: colors.warning, fontSize: 12.5, fontWeight: "600", marginTop: spacing.md, textAlign: "center" },
  acceptBtn: {
    width: "100%",
    backgroundColor: colors.black,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  btnDisabled: { opacity: 0.5 },
  acceptText: { color: colors.white, fontWeight: "800", fontSize: 15 },
  declineBtn: { marginTop: spacing.sm, paddingVertical: 10 },
  declineText: { color: colors.textMuted, fontWeight: "700", fontSize: 13 },
});

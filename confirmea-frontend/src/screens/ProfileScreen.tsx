import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import ConfirmModal from "../components/ConfirmModal";
import ComplaintModal from "../components/ComplaintModal";

export default function ProfileScreen() {
  const { displayName, role, businessName, token, logout } = useAuth();
  const isBusiness = role === "business";
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [ownRating, setOwnRating] = useState<{ rating: number | null; reviewCount: number } | null>(null);

  // Customers get an Uber-style personal rating from businesses — fetch it here,
  // once, for display. Not worth a whole context for a single read-only value.
  useEffect(() => {
    if (role !== "customer" || !token) return;
    let cancelled = false;
    api
      .get<{ user: { rating?: number | null; reviewCount?: number } }>("/auth/me", token)
      .then((data) => {
        if (cancelled) return;
        if (data.user.reviewCount !== undefined) {
          setOwnRating({ rating: data.user.rating ?? null, reviewCount: data.user.reviewCount });
        }
      })
      .catch(() => {
        // Non-critical — the profile just won't show a rating this session.
      });
    return () => {
      cancelled = true;
    };
  }, [role, token]);

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={[typography.heading, styles.title]}>Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name={isBusiness ? "storefront" : "person"} size={26} color={colors.white} />
        </View>
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          <Text style={typography.subheading}>{isBusiness ? businessName ?? "Your business" : displayName ?? "Guest"}</Text>
          <Text style={typography.caption}>
            {isBusiness ? `Business account · ${displayName ?? ""}` : "Newcastle, NSW"}
          </Text>
          {!isBusiness && (
            <View style={styles.ratingRow}>
              {ownRating && ownRating.rating !== null ? (
                <>
                  <Ionicons name="star" size={13} color={colors.apricotDark} />
                  <Text style={styles.ratingText}>
                    {ownRating.rating} ({ownRating.reviewCount} rating{ownRating.reviewCount === 1 ? "" : "s"} from businesses)
                  </Text>
                </>
              ) : (
                <Text style={styles.ratingText}>No ratings from businesses yet</Text>
              )}
            </View>
          )}
        </View>
      </View>

      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      {isBusiness ? (
        <View style={styles.row}>
          <Ionicons name="business-outline" size={20} color={colors.apricotDark} />
          <Text style={styles.rowLabel}>Business tools live under Slots &amp; Bookings</Text>
        </View>
      ) : (
        <View style={styles.row}>
          <Ionicons name="cash-outline" size={20} color={colors.apricotDark} />
          <Text style={styles.rowLabel}>Payment is in person — no card on file</Text>
        </View>
      )}
      <View style={styles.row}>
        <Ionicons name="notifications-outline" size={20} color={colors.apricotDark} />
        <Text style={styles.rowLabel}>Notifications</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
      {!isBusiness && (
        <Pressable style={styles.row} onPress={() => setFeedbackVisible(true)}>
          <Ionicons name="chatbox-ellipses-outline" size={20} color={colors.apricotDark} />
          <Text style={styles.rowLabel}>Send feedback about Confirmea</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      )}
      <View style={styles.row}>
        <Ionicons name="help-circle-outline" size={20} color={colors.apricotDark} />
        <Text style={styles.rowLabel}>Help & support</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>

      <Pressable style={styles.logoutRow} onPress={() => setConfirmVisible(true)}>
        <Ionicons name="log-out-outline" size={20} color={colors.warning} />
        <Text style={styles.logoutLabel}>Log out</Text>
      </Pressable>

      <ConfirmModal
        visible={confirmVisible}
        title="Log out?"
        message="You'll need to log back in to continue."
        confirmLabel="Log out"
        destructive
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => {
          setConfirmVisible(false);
          logout();
        }}
      />

      <ComplaintModal visible={feedbackVisible} type="app" onClose={() => setFeedbackVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  title: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, marginBottom: spacing.md },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  ratingText: { ...typography.caption, marginLeft: 4 },
  sectionLabel: {
    ...typography.caption,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  rowLabel: { ...typography.body, flex: 1, marginLeft: spacing.md, fontWeight: "600" },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: 14,
  },
  logoutLabel: { color: colors.warning, fontWeight: "700", marginLeft: 8 },
});

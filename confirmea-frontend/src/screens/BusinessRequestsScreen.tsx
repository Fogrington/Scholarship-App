import React, { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatDateTime } from "../utils/formatDateTime";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BusinessRequestsStackParamList } from "../navigation/RootNavigator";
import type { OpenRequest } from "../types";

type Props = NativeStackScreenProps<BusinessRequestsStackParamList, "RequestsList">;

export default function BusinessRequestsScreen({ navigation }: Props) {
  const { businessName, token } = useAuth();
  const [requests, setRequests] = useState<OpenRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      setError(null);

      api
        .get<OpenRequest[]>("/requests/open", token)
        .then((data) => {
          if (!cancelled) setRequests(data);
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load requests.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [token])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Requests</Text>
        <Text style={styles.subtitle}>{businessName ?? "Your business"} — matching your specialty</Text>
      </View>

      {error ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : loading ? (
        <ActivityIndicator color={colors.apricotDark} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate("MakeOffer", {
                  requestId: item.id,
                  customerName: item.customerName,
                  category: item.category,
                })
              }
            >
              <View style={styles.rowBetween}>
                <View style={styles.rowLeft}>
                  {index === 0 && (
                    <View style={styles.firstBadge}>
                      <Text style={styles.firstBadgeText}>Longest waiting</Text>
                    </View>
                  )}
                  <Text style={typography.subheading}>{item.customerName}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>

              {item.note ? <Text style={styles.note}>"{item.note}"</Text> : null}

              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>Posted {formatDateTime(item.createdAt)}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="megaphone-outline" size={28} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                No one's currently looking for {businessName ? "your services" : "this"} — check back soon.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, marginBottom: spacing.md },
  title: { ...typography.heading, fontSize: 20 },
  subtitle: { ...typography.caption, marginTop: 4 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLeft: { flex: 1 },
  firstBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.apricot,
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  firstBadgeText: { color: colors.white, fontSize: 10, fontWeight: "800" },
  note: { ...typography.body, marginTop: 8, fontStyle: "italic", color: colors.charcoal },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  metaText: { ...typography.caption, marginLeft: 6 },
  empty: { alignItems: "center", marginTop: spacing.xl, opacity: 0.6, paddingHorizontal: spacing.lg },
  emptyText: { ...typography.body, marginTop: spacing.sm, textAlign: "center" },
});

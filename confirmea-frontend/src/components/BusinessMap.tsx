import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import BusinessCard from "./BusinessCard";
import type { BusinessWithOffers, Suburb } from "../types";

interface Props {
  businesses: BusinessWithOffers[];
  suburb: Suburb;
  onSelectBusiness: (businessId: number) => void;
}

// This file (no platform suffix) is what Metro bundles for web — it deliberately
// never imports react-native-maps, since that package has no web support and
// Metro would fail to resolve its native-only internals even behind a runtime
// Platform.OS check. The real map lives in BusinessMap.native.tsx, which Metro
// picks automatically for iOS/Android instead of this file.
export default function BusinessMap({ businesses, onSelectBusiness }: Props) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.webNotice}>
        <Ionicons name="phone-portrait-outline" size={18} color={colors.warning} />
        <Text style={styles.webNoticeText}>
          The map isn't available in the web preview — open Confirmea on your phone through
          Expo Go to see business pins on a real map. Here's the same list instead.
        </Text>
      </View>
      <FlatList
        data={businesses}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <BusinessCard business={item} onPress={() => onSelectBusiness(item.id)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="storefront-outline" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>No businesses with open offers near here right now.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  webNotice: {
    flexDirection: "row",
    backgroundColor: "#FCEEE6",
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    alignItems: "flex-start",
    ...shadow.card,
  },
  webNoticeText: { ...typography.caption, marginLeft: spacing.sm, flex: 1, color: colors.warning, lineHeight: 17 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  empty: { alignItems: "center", marginTop: spacing.xl, opacity: 0.6, paddingHorizontal: spacing.lg },
  emptyText: { ...typography.body, marginTop: spacing.sm, textAlign: "center" },
});

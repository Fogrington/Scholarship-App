import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect, useNavigation, type NavigationProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../theme/theme";
import { api } from "../api/client";
import { useLocationSuburb } from "../context/LocationContext";
import BusinessMap from "../components/BusinessMap";
import LocationPickerModal from "../components/LocationPickerModal";
import type { BusinessWithOffers } from "../types";

type LocalParamList = {
  BusinessDetail: { businessId: number };
};

export default function ExploreScreen() {
  const navigation = useNavigation<NavigationProp<LocalParamList>>();
  const { suburb, setSuburb } = useLocationSuburb();
  const [businesses, setBusinesses] = useState<BusinessWithOffers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ lat: String(suburb.lat), lng: String(suburb.lng) });

      api
        .get<BusinessWithOffers[]>(`/businesses/with-offers?${params.toString()}`)
        .then((data) => {
          if (!cancelled) setBusinesses(data);
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load nearby businesses.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [suburb])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Pressable style={styles.locationRow} onPress={() => setLocationPickerVisible(true)}>
          <Ionicons name="location-sharp" size={14} color={colors.apricotDark} />
          <Text style={styles.locationText}>{suburb.name}, NSW</Text>
          <Ionicons name="chevron-down" size={13} color={colors.apricotDark} style={{ marginLeft: 2 }} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.apricotDark} style={{ marginTop: spacing.xl }} />
      ) : error ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : (
        <BusinessMap
          businesses={businesses}
          suburb={suburb}
          onSelectBusiness={(businessId) => navigation.navigate("BusinessDetail", { businessId })}
        />
      )}

      <LocationPickerModal
        visible={locationPickerVisible}
        selected={suburb}
        onSelect={setSuburb}
        onClose={() => setLocationPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.heading, fontSize: 20 },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  locationText: { ...typography.caption, marginLeft: 4, fontWeight: "700", color: colors.apricotDark },
  empty: { alignItems: "center", marginTop: spacing.xl, opacity: 0.6, paddingHorizontal: spacing.lg },
  emptyText: { ...typography.body, marginTop: spacing.sm, textAlign: "center" },
});

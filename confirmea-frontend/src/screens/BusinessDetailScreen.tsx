import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable, FlatList, Image, ActivityIndicator } from "react-native";
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import { api } from "../api/client";
import { useLocationSuburb } from "../context/LocationContext";
import { getCategoryIllustration } from "../data/categoryIllustrations";
import ServiceCard from "../components/ServiceCard";
import type { Listing } from "../types";

// This screen is mounted in both the Home stack and the Explore stack, which have
// slightly different param lists (different first screen) but identical
// BusinessDetail/ListingDetail shapes — using hooks instead of typed screen props
// lets it work in either without duplicating the component.
type LocalParamList = {
  BusinessDetail: { businessId: number };
  ListingDetail: { listing: Listing };
};

interface BusinessDetail {
  id: number;
  name: string;
  category: string;
  address: string;
  rating: number | null;
  reviewCount: number;
}

export default function BusinessDetailScreen() {
  const route = useRoute<RouteProp<LocalParamList, "BusinessDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<LocalParamList>>();
  const { suburb } = useLocationSuburb();
  const { businessId } = route.params;

  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [offers, setOffers] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        businessId: String(businessId),
        lat: String(suburb.lat),
        lng: String(suburb.lng),
      });

      Promise.all([
        api.get<BusinessDetail>(`/businesses/${businessId}`),
        api.get<Listing[]>(`/listings?${params.toString()}`),
      ])
        .then(([businessData, offersData]) => {
          if (cancelled) return;
          setBusiness(businessData);
          setOffers(offersData);
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load this business.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [businessId, suburb])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.black} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.apricotDark} style={{ marginTop: spacing.xl }} />
      ) : error || !business ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>{error ?? "Business not found."}</Text>
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={styles.hero}>
                <Image
                  source={getCategoryIllustration(business.category)}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.headerInfo}>
                <View style={styles.rowBetween}>
                  <Text style={typography.heading}>{business.name}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{business.category}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>{business.address}</Text>
                </View>
                <View style={styles.metaRow}>
                  {business.rating !== null ? (
                    <>
                      <Ionicons name="star" size={14} color={colors.apricotDark} />
                      <Text style={styles.metaText}>
                        {business.rating} ({business.reviewCount} reviews)
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.metaText}>New — no reviews yet</Text>
                  )}
                </View>
              </View>

              <Text style={styles.sectionTitle}>
                {offers.length} open offer{offers.length === 1 ? "" : "s"}
              </Text>
            </>
          }
          renderItem={({ item }) => (
            <ServiceCard listing={item} onPress={() => navigation.navigate("ListingDetail", { listing: item })} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={28} color={colors.textMuted} />
              <Text style={styles.emptyText}>Nothing open right now — check back soon.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  hero: {
    height: 160,
    borderRadius: radius.lg,
    backgroundColor: colors.apricotLight,
    overflow: "hidden",
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  heroImage: { width: "100%", height: "100%" },
  headerInfo: { marginBottom: spacing.md },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  categoryBadge: {
    backgroundColor: colors.black,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: spacing.sm,
  },
  categoryBadgeText: { color: colors.white, fontSize: 11, fontWeight: "800" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  metaText: { ...typography.caption, marginLeft: 6 },
  sectionTitle: { ...typography.subheading, marginBottom: spacing.sm },
  empty: { alignItems: "center", marginTop: spacing.xl, opacity: 0.6, paddingHorizontal: spacing.lg },
  emptyText: { ...typography.body, marginTop: spacing.sm, textAlign: "center" },
});

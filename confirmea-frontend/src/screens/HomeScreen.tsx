import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius } from "../theme/theme";
import { categories, type BusinessWithOffers, type Category } from "../types";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLocationSuburb } from "../context/LocationContext";
import CategoryPill from "../components/CategoryPill";
import BusinessCard from "../components/BusinessCard";
import LocationPickerModal from "../components/LocationPickerModal";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ClientStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<ClientStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const { displayName } = useAuth();
  const { suburb, setSuburb } = useLocationSuburb();
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [search, setSearch] = useState("");
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessWithOffers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refetch every time this screen comes into focus (not just on first mount), and
  // whenever the selected suburb changes — the backend sorts by distance from
  // whichever suburb is picked, closest first.
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

  // Category/search filtering happens client-side against the business's own
  // specialty, not any one listing's category — a business shows up once even if
  // it has several open offers. The server already sorted by distance, and
  // .filter() preserves that order.
  const filtered = useMemo(() => {
    return businesses.filter((b) => {
      const matchesCategory = activeCategory === "All" || b.category === activeCategory;
      const matchesSearch = search.trim().length === 0 || b.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [businesses, activeCategory, search]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey {displayName ?? "there"} 👋</Text>
          <Pressable style={styles.locationRow} onPress={() => setLocationPickerVisible(true)}>
            <Ionicons name="location-sharp" size={14} color={colors.apricotDark} />
            <Text style={styles.locationText}>{suburb.name}, NSW</Text>
            <Ionicons name="chevron-down" size={13} color={colors.apricotDark} style={{ marginLeft: 2 }} />
          </Pressable>
        </View>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color={colors.white} />
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          placeholder="Search businesses"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={["All", ...categories.map((c) => c.key)]}
        keyExtractor={(item) => item}
        style={styles.pillRow}
        contentContainerStyle={styles.pillRowContent}
        renderItem={({ item }) => {
          const cat = categories.find((c) => c.key === item);
          return (
            <CategoryPill
              label={item}
              icon={cat?.icon as any}
              active={activeCategory === item}
              onPress={() => setActiveCategory(item as Category | "All")}
            />
          );
        }}
      />

      {error ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>
            {loading
              ? "Loading businesses…"
              : `${filtered.length} business${filtered.length === 1 ? "" : "es"} near ${suburb.name}`}
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.apricotDark} style={{ marginTop: spacing.xl }} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <BusinessCard
                  business={item}
                  onPress={() => navigation.navigate("BusinessDetail", { businessId: item.id })}
                />
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Ionicons name="storefront-outline" size={28} color={colors.textMuted} />
                  <Text style={styles.emptyText}>No businesses match that search yet.</Text>
                </View>
              }
            />
          )}
        </>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  greeting: { ...typography.heading, fontSize: 20 },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  locationText: { ...typography.caption, marginLeft: 4, fontWeight: "700", color: colors.apricotDark },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { marginLeft: 8, flex: 1, color: colors.charcoal },
  pillRow: { marginTop: spacing.md, height: 44, flexGrow: 0, flexShrink: 0 },
  pillRowContent: { paddingHorizontal: spacing.lg, alignItems: "center" },
  sectionTitle: {
    ...typography.subheading,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  empty: { alignItems: "center", marginTop: spacing.xl, opacity: 0.6, paddingHorizontal: spacing.lg },
  emptyText: { ...typography.body, marginTop: spacing.sm, textAlign: "center" },
});

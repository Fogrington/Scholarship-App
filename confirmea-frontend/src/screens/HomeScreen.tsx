import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius } from "../theme/theme";
import { categories, type Category, type Listing } from "../types";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import CategoryPill from "../components/CategoryPill";
import ServiceCard from "../components/ServiceCard";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ClientStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<ClientStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const { displayName } = useAuth();
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [search, setSearch] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refetch every time this screen comes into focus (not just on first mount) —
  // so a slot that just filled up (here or from another customer) disappears as
  // soon as you come back to Discover, instead of lingering from a stale fetch.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      setError(null);

      api
        .get<Listing[]>("/listings")
        .then((data) => {
          if (!cancelled) setListings(data);
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load nearby slots.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [])
  );

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const matchesCategory = activeCategory === "All" || l.category === activeCategory;
      const matchesSearch =
        search.trim().length === 0 ||
        l.businessName.toLowerCase().includes(search.toLowerCase()) ||
        l.service.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [listings, activeCategory, search]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey {displayName ?? "there"} 👋</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={14} color={colors.apricotDark} />
            <Text style={styles.locationText}>Newcastle, NSW</Text>
          </View>
        </View>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color={colors.white} />
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          placeholder="Search salons or services"
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
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
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
            {loading ? "Loading slots…" : `${filtered.length} slot${filtered.length === 1 ? "" : "s"} open nearby`}
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.apricotDark} style={{ marginTop: spacing.xl }} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <ServiceCard
                  listing={item}
                  onPress={() => navigation.navigate("ListingDetail", { listing: item })}
                />
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Ionicons name="calendar-outline" size={28} color={colors.textMuted} />
                  <Text style={styles.emptyText}>No open slots match that search yet.</Text>
                </View>
              }
            />
          )}
        </>
      )}
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
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  locationText: { ...typography.caption, marginLeft: 4 },
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
  pillRow: { marginTop: spacing.md, flexGrow: 0 },
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

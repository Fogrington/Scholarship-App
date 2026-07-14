import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius } from "../theme/theme";
import { categories, mockListings, Category } from "../data/mockData";
import CategoryPill from "../components/CategoryPill";
import ServiceCard from "../components/ServiceCard";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ClientStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<ClientStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return mockListings.filter((l) => {
      const matchesCategory = activeCategory === "All" || l.category === activeCategory;
      const matchesSearch =
        search.trim().length === 0 ||
        l.businessName.toLowerCase().includes(search.toLowerCase()) ||
        l.service.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey Fletch 👋</Text>
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

      <Text style={styles.sectionTitle}>
        {filtered.length} slot{filtered.length === 1 ? "" : "s"} open nearby
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ServiceCard
            listing={item}
            onPress={() => navigation.navigate("ListingDetail", { listingId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>No open slots match that search yet.</Text>
          </View>
        }
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
  empty: { alignItems: "center", marginTop: spacing.xl, opacity: 0.6 },
  emptyText: { ...typography.body, marginTop: spacing.sm },
});

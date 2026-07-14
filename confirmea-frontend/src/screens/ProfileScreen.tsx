import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ClientTabParamList, RootStackParamList } from "../navigation/RootNavigator";

type Props = BottomTabScreenProps<ClientTabParamList, "ProfileTab">;

export default function ProfileScreen({ navigation }: Props) {
  const rootNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <SafeAreaView style={styles.safe}>
      <Text style={[typography.heading, styles.title]}>Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={26} color={colors.white} />
        </View>
        <View style={{ marginLeft: spacing.md }}>
          <Text style={typography.subheading}>Fletch</Text>
          <Text style={typography.caption}>Newcastle, NSW</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>PROTOTYPE — PREVIEW OTHER INTERFACES</Text>

      <Pressable
        style={styles.row}
        onPress={() => rootNavigation?.navigate("BusinessDashboard")}
      >
        <Ionicons name="storefront-outline" size={20} color={colors.apricotDark} />
        <Text style={styles.rowLabel}>Business dashboard</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Pressable
        style={styles.row}
        onPress={() => rootNavigation?.navigate("Admin")}
      >
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.apricotDark} />
        <Text style={styles.rowLabel}>Admin approvals</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <View style={styles.row}>
        <Ionicons name="card-outline" size={20} color={colors.apricotDark} />
        <Text style={styles.rowLabel}>Payment methods</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
      <View style={styles.row}>
        <Ionicons name="notifications-outline" size={20} color={colors.apricotDark} />
        <Text style={styles.rowLabel}>Notifications</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
      <View style={styles.row}>
        <Ionicons name="help-circle-outline" size={20} color={colors.apricotDark} />
        <Text style={styles.rowLabel}>Help & support</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
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
});

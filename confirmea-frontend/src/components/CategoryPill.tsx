import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../theme/theme";

type Props = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
};

export default function CategoryPill({ label, icon, active, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={15}
          color={active ? colors.white : colors.apricotDark}
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
    borderWidth: 1.5,
  },
  pillActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  pillInactive: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
  labelActive: {
    color: colors.white,
  },
  labelInactive: {
    color: colors.charcoal,
  },
});

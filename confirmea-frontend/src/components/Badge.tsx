import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius } from "../theme/theme";

type Tone = "apricot" | "black" | "success" | "warning";

type Props = {
  text: string;
  tone?: Tone;
};

const toneMap: Record<Tone, { bg: string; fg: string }> = {
  apricot: { bg: colors.apricot, fg: colors.white },
  black: { bg: colors.black, fg: colors.white },
  success: { bg: colors.success, fg: colors.white },
  warning: { bg: colors.warning, fg: colors.white },
};

export default function Badge({ text, tone = "apricot" }: Props) {
  const t = toneMap[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});

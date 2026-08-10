import React from "react";
import { Modal, View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import { NEWCASTLE_SUBURBS, type Suburb } from "../types";

interface Props {
  visible: boolean;
  selected: Suburb;
  onSelect: (suburb: Suburb) => void;
  onClose: () => void;
}

export default function LocationPickerModal({ visible, selected, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose your suburb</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={colors.black} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            We'll sort nearby slots by distance from here — not live GPS tracking, just a
            quick way to bias results toward your side of Newcastle.
          </Text>

          <FlatList
            data={NEWCASTLE_SUBURBS}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => {
              const active = item.name === selected.name;
              return (
                <Pressable
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Ionicons
                    name="location-sharp"
                    size={16}
                    color={active ? colors.apricotDark : colors.textMuted}
                  />
                  <Text style={[styles.rowText, active && styles.rowTextActive]}>{item.name}</Text>
                  {active && <Ionicons name="checkmark" size={18} color={colors.apricotDark} />}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(26,26,26,0.4)", justifyContent: "flex-end" },
  backdropTap: { flex: 1 },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: "75%",
    ...shadow.card,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { ...typography.heading, fontSize: 19 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: { ...typography.caption, marginTop: 6, marginBottom: spacing.md, lineHeight: 17 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  rowActive: { backgroundColor: colors.apricotLight },
  rowText: { ...typography.body, marginLeft: 10, flex: 1 },
  rowTextActive: { fontWeight: "700", color: colors.black },
});

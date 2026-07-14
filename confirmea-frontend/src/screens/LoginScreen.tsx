import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../theme/theme";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");

  const canSubmit = email.trim().length > 0 && password.trim().length > 0;

  const handleSubmit = () => {
    // Prototype only — no real auth backend yet, any credentials work.
    login(email);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logoMark}>
            <Ionicons name="sparkles" size={30} color={colors.white} />
          </View>
          <Text style={styles.brand}>Confirmea</Text>
          <Text style={styles.tagline}>Last-minute hair, beauty & wellness slots nearby</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {mode === "login" ? "Log in" : "Create your account"}
            </Text>

            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <Pressable
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              <Text style={styles.submitText}>
                {mode === "login" ? "Log in" : "Sign up"}
              </Text>
            </Pressable>

            <Pressable
              style={styles.switchModeBtn}
              onPress={() => setMode(mode === "login" ? "signup" : "login")}
            >
              <Text style={styles.switchModeText}>
                {mode === "login"
                  ? "New to Confirmea? Sign up"
                  : "Already have an account? Log in"}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.prototypeNote}>
            Prototype build — any email & password will log you in. Business and admin
            accounts will live in a separate web portal, not this app.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.black },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.apricot,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  brand: { fontSize: 28, fontWeight: "800", color: colors.white },
  tagline: {
    color: colors.apricotLight,
    fontSize: 13,
    marginTop: 6,
    marginBottom: spacing.xl,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  cardTitle: { ...typography.heading, fontSize: 20, marginBottom: spacing.md },
  label: { ...typography.caption, marginBottom: 6, marginTop: spacing.sm },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  input: { marginLeft: 8, flex: 1, color: colors.charcoal },
  submitBtn: {
    backgroundColor: colors.black,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { color: colors.white, fontWeight: "800", fontSize: 15 },
  switchModeBtn: { alignItems: "center", marginTop: spacing.md },
  switchModeText: { color: colors.apricotDark, fontWeight: "700", fontSize: 13 },
  prototypeNote: {
    color: colors.apricotLight,
    fontSize: 11,
    textAlign: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    opacity: 0.8,
  },
});

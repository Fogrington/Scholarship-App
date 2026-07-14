export const colors = {
  apricot: "#F2A65A",
  apricotLight: "#FCE3C8",
  apricotDark: "#D98836",
  black: "#1A1A1A",
  charcoal: "#2E2B28",
  cream: "#FFF8F0",
  white: "#FFFFFF",
  success: "#6FAE7C",
  warning: "#E0704B",
  border: "#EFE1D1",
  textMuted: "#8A8178",
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  heading: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: colors.black,
  },
  subheading: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.charcoal,
  },
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: colors.charcoal,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: colors.textMuted,
  },
};

export const shadow = {
  card: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
};

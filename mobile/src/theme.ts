import { StyleSheet } from "react-native";

// Central palette keeps the green circular-economy theme consistent.
export const colors = {
  green: "#2f7d57",
  greenDark: "#174936",
  greenSoft: "#dff3e8",
  teal: "#138083",
  tealSoft: "#d9f0ee",
  clay: "#b86f45",
  claySoft: "#f8e6da",
  dark: "#24352f",
  muted: "#6f7f76",
  line: "#d9e4dc",
  background: "#f2f7f1",
  card: "#fffdf6",
  white: "#ffffff",
  danger: "#c2413b",
  dangerSoft: "#fae1de",
  amber: "#c98925",
  amberSoft: "#f7ebcf",
  blue: "#2776a6",
  blueSoft: "#dcecf5"
};

export const styles = StyleSheet.create({
  // Shared primitives used by most screens for consistent spacing and shapes.
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 18
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.dark
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    marginTop: 6,
    lineHeight: 22
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: 14,
    shadowColor: colors.greenDark,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.dark,
    fontSize: 15,
    marginTop: 10
  },
  label: {
    color: colors.dark,
    fontWeight: "800",
    marginTop: 14
  },
  button: {
    backgroundColor: colors.green,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14
  },
  buttonText: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 16
  },
  secondaryButton: {
    backgroundColor: colors.tealSoft,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10
  },
  secondaryText: {
    color: colors.teal,
    fontWeight: "900"
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.greenSoft,
    color: colors.greenDark,
    fontWeight: "800",
    overflow: "hidden"
  }
});

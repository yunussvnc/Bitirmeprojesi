import { StyleSheet } from "react-native";
import { spacing } from "@/src/constants/design";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  list: {
    flex: 1,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.base,
    overflow: "visible",
    position: "relative",
    paddingHorizontal: spacing.md,
  },
  title: { fontSize: 26, fontWeight: "700" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerWrap: {
    overflow: "visible",
    zIndex: 20,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  dropdownWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 20,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  dropdownBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 140,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  dropdownMenu: {
    position: "absolute",
    left: "50%",
    transform: [{ translateX: -90 }],
    width: 180,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 31,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: "600",
  },
  topWrap: {
    overflow: "hidden",
  },
  createBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  listContent: {
    gap: spacing.xl,
  },
  listEmpty: { flexGrow: 1 },
  center: { flex: 1, justifyContent: "center", minHeight: 300 },

});

export default styles;

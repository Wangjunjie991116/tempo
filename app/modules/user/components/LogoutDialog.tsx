import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "../../../core/i18n";

export interface LogoutDialogProps {
  /** 是否显示 */
  visible: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 确认退出回调 */
  onConfirm: () => void;
}

/**
 * 退出登录确认弹窗。
 *
 * @example
 * ```tsx
 * <LogoutDialog
 *   visible={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   onConfirm={() => handleLogout()}
 * />
 * ```
 */
export function LogoutDialog({ visible, onClose, onConfirm }: LogoutDialogProps) {
  const { t } = useTranslation(["common"]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="logout-variant" size={28} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>{t("common:logOutTitle")}</Text>
          <Text style={styles.description}>
            {t("common:logOutDesc")}
          </Text>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{t("common:close")}</Text>
          </Pressable>

          <Pressable style={styles.logoutButton} onPress={onConfirm}>
            <Text style={styles.logoutButtonText}>{t("common:logOut")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    width: "100%",
    gap: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
    color: "#151515",
  },
  description: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    color: "#575757",
    textAlign: "center",
  },
  closeButton: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#151515",
    borderRadius: 25,
  },
  closeButtonText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  logoutButton: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#151515",
  },
  logoutButtonText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
    color: "#151515",
  },
});

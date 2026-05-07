import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "../../../core/i18n";
import { USER_STACK } from "../../../core/navigation/routes";
import type { UserStackParamList } from "../../../core/navigation/types";
import { useTempoTheme } from "../../../core/theme";
import { useSession } from "../../../core/session";
import { AccountListItem } from "../components/AccountListItem";
import { LogoutDialog } from "../components/LogoutDialog";

type Props = NativeStackScreenProps<UserStackParamList, typeof USER_STACK.Account>;

/**
 * 账户列表页（Account）。
 *
 * 展示用户信息卡片、Security 与 Account 分组，并支持退出登录。
 */
export default function AccountScreen({ navigation }: Props) {
  const { t } = useTranslation(["common"]);
  const theme = useTempoTheme();
  const { signOut } = useSession();
  const [logoutVisible, setLogoutVisible] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.screenBg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#151515" />
        </Pressable>
        <Text style={styles.headerTitle}>{t("common:account")}</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 用户信息卡片 */}
        <Pressable
          style={styles.profileCard}
          onPress={() => navigation.navigate(USER_STACK.EditProfile)}
        >
          <View style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="account" size={24} color="#A5A5A5" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Wade Warren</Text>
            <Text style={styles.profileEmail}>WadeWarren@gmail.com</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#A5A5A5" />
        </Pressable>

        {/* Personal Info 分组 */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Personal Info</Text>
          <View style={styles.card}>
            <AccountListItem
              variant="nav"
              icon="cog-outline"
              title={t("common:settingsTitle")}
              onPress={() => navigation.navigate(USER_STACK.Settings)}
            />
          </View>
        </View>

        {/* Security 分组 */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Security</Text>
          <View style={styles.card}>
            <AccountListItem
              variant="nav"
              icon="lock-outline"
              title={t("common:changePassword")}
              onPress={() => navigation.navigate(USER_STACK.ChangePassword)}
            />
          </View>
        </View>

        {/* Account 分组 */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Account</Text>
          <View style={styles.card}>
            <AccountListItem
              variant="action"
              title={t("common:logOut")}
              textColor="#E53935"
              onPress={() => setLogoutVisible(true)}
            />
          </View>
        </View>
      </ScrollView>

      <LogoutDialog
        visible={logoutVisible}
        onClose={() => setLogoutVisible(false)}
        onConfirm={async () => {
          setLogoutVisible(false);
          await signOut();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
    color: "#151515",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
    color: "#151515",
  },
  profileEmail: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    color: "#575757",
  },
  group: {
    marginTop: 20,
  },
  groupTitle: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    color: "#A5A5A5",
    textTransform: "uppercase",
    marginBottom: 4,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },
});

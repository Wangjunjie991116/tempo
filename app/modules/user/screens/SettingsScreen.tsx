import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Appbar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import CountryFlag from "react-native-country-flag";
import { useTranslation } from "../../../core/i18n";
import { getAppLanguage, setAppLanguage } from "../../../core/i18n/appLanguage";
import { USER_STACK } from "../../../core/navigation/routes";
import type { UserStackParamList } from "../../../core/navigation/types";
import { useTempoTheme } from "../../../core/theme";
import { AccountListItem } from "../components/AccountListItem";
import { UserBottomSheet, BottomSheetItem } from "../components/UserBottomSheet";
import type { AppLanguage } from "../../../core/i18n";

type Props = NativeStackScreenProps<UserStackParamList, typeof USER_STACK.Settings>;

/**
 * 通用设置页（Settings）。
 *
 * 包含 Notifications、Language、Appearance 三个选项，
 * Language 与 Appearance 点击后唤起底部弹窗。
 */
export default function SettingsScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation(["common"]);
  const theme = useTempoTheme();

  const [languageSheetVisible, setLanguageSheetVisible] = useState(false);
  const [appearanceSheetVisible, setAppearanceSheetVisible] = useState(false);
  const [currentLang, setCurrentLang] = useState<AppLanguage>(
    (getAppLanguage?.() as AppLanguage) ?? i18n.language ?? "en",
  );
  const [appearance, setAppearance] = useState<"light" | "dark">("light");

  const handleLanguageChange = useCallback(
    async (lang: AppLanguage) => {
      await setAppLanguage(lang);
      setCurrentLang(lang);
      setLanguageSheetVisible(false);
    },
    [],
  );

  const languageLabel = currentLang === "zh" ? "中文" : "English";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#F5F5F5" }]}>
      <Appbar.Header mode="small" statusBarHeight={0} style={{ backgroundColor: "#F5F5F5" }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t("common:settingsTitle")} titleStyle={styles.appBarTitle} />
      </Appbar.Header>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.card}>
          {/* Notifications */}
          <AccountListItem
            variant="nav"
            icon="bell-outline"
            title="Notifications"
            onPress={() => {
              // 未来实现
            }}
          />

          <View style={styles.divider} />

          {/* Language */}
          <AccountListItem
            variant="nav"
            icon="earth"
            title="Language"
            value={languageLabel}
            onPress={() => setLanguageSheetVisible(true)}
          />

          <View style={styles.divider} />

          {/* Appearance */}
          <AccountListItem
            variant="nav"
            icon="moon-waning-crescent"
            title="Appearance"
            value="Light"
            onPress={() => setAppearanceSheetVisible(true)}
          />
        </View>
      </View>

      {/* Language BottomSheet */}
      <UserBottomSheet
        visible={languageSheetVisible}
        title="Language"
        onClose={() => setLanguageSheetVisible(false)}
      >
        <BottomSheetItem
          icon={<CountryFlag isoCode="gb" size={22} />}
          title="English"
          selected={currentLang === "en"}
          onPress={() => handleLanguageChange("en")}
        />
        <BottomSheetItem
          icon={<CountryFlag isoCode="cn" size={22} />}
          title="中文"
          selected={currentLang === "zh"}
          onPress={() => handleLanguageChange("zh")}
        />
      </UserBottomSheet>

      {/* Appearance BottomSheet */}
      <UserBottomSheet
        visible={appearanceSheetVisible}
        title="Appearance"
        onClose={() => setAppearanceSheetVisible(false)}
      >
        <BottomSheetItem
          icon={
            <MaterialCommunityIcons
              name="white-balance-sunny"
              size={22}
              color="#151515"
            />
          }
          title="Light"
          selected={appearance === "light"}
          onPress={() => {
            setAppearance("light");
            setAppearanceSheetVisible(false);
          }}
        />
        <BottomSheetItem
          icon={
            <MaterialCommunityIcons
              name="moon-waning-crescent"
              size={22}
              color="#151515"
            />
          }
          title="Dark"
          selected={appearance === "dark"}
          disabled
          onPress={() => {
            // disabled，不响应
          }}
        />
      </UserBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBarTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: "#E8E8E8",
  },
});

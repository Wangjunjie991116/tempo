import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AiFloatingAssistant } from "../../modules/ai";

import FinanceHomeScreen from "../../modules/finance/FinanceHomeScreen";
import { ScheduleStackNavigator } from "../../modules/schedule/navigation/ScheduleStackNavigator";
import UserHomeScreen from "../../modules/user/UserHomeScreen";
import WebTestScreen from "../../modules/user/WebTestScreen";
import { useTranslation } from "../i18n";
import { useTempoTheme } from "../theme";
import { TabFinanceIcon, TabScheduleIcon, TabUserIcon } from "./icons/TabBarIcons";
import { MAIN_TAB, USER_STACK } from "./routes";
import type { MainTabParamList, UserStackParamList } from "./types";

const UserNativeStack = createNativeStackNavigator<UserStackParamList>();

function UserStackNavigator() {
  const { t } = useTranslation(["common"]);
  return (
    <UserNativeStack.Navigator>
      <UserNativeStack.Screen
        name={USER_STACK.UserHome}
        component={UserHomeScreen}
        options={{ title: t("common:userHomeTitle"), headerShown: true }}
      />
      <UserNativeStack.Screen
        name={USER_STACK.UserWebTest}
        component={WebTestScreen}
        options={{ title: t("common:webTestTitle"), headerShown: true }}
      />
    </UserNativeStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const t = useTempoTheme();
  const { t: tr } = useTranslation(["schedule", "common"]);
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: t.brand,
          tabBarInactiveTintColor: t.textMuted,
          tabBarStyle: {
            backgroundColor: t.screenBg,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: t.divider,
            elevation: 0,
            shadowOpacity: 0,
            shadowOffset: { width: 0, height: 0 },
            paddingTop: 6,
            paddingBottom: Math.max(insets.bottom, 10),
            minHeight: 52,
          },
          tabBarLabelStyle: {
            fontFamily: "Manrope_500Medium",
            fontSize: 11,
            marginTop: 2,
          },
          tabBarIcon: ({ color, size, focused }) => {
            const dim = focused ? Math.min(size + 2, 26) : Math.max(size - 1, 20);
            switch (route.name) {
              case MAIN_TAB.Schedule:
                return <TabScheduleIcon color={color} size={dim} />;
              case MAIN_TAB.Finance:
                return <TabFinanceIcon color={color} size={dim} />;
              case MAIN_TAB.User:
                return <TabUserIcon color={color} size={dim} />;
              default:
                return null;
            }
          },
        })}
      >
        <Tab.Screen
          name={MAIN_TAB.Schedule}
          component={ScheduleStackNavigator}
          options={{
            tabBarLabel: tr("schedule:tabTitle"),
            headerTitle: tr("schedule:tabTitle"),
          }}
        />
        <Tab.Screen
          name={MAIN_TAB.Finance}
          component={FinanceHomeScreen}
          options={{
            tabBarLabel: tr("common:tabFinance"),
            headerTitle: tr("common:tabFinance"),
          }}
        />
        <Tab.Screen
          name={MAIN_TAB.User}
          component={UserStackNavigator}
          options={{ tabBarLabel: tr("common:tabUser"), headerShown: false }}
        />
      </Tab.Navigator>
      <AiFloatingAssistant />
    </View>
  );
}

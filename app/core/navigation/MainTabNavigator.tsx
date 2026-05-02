import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FinanceHomeScreen from "../../modules/finance/FinanceHomeScreen";
import { ScheduleStackNavigator } from "../../modules/schedule/navigation/ScheduleStackNavigator";
import UserHomeScreen from "../../modules/user/UserHomeScreen";
import WebTestScreen from "../../modules/user/WebTestScreen";
import { useTempoTheme } from "../theme";
import { TabFinanceIcon, TabScheduleIcon, TabUserIcon } from "./icons/TabBarIcons";
import { MAIN_TAB, USER_STACK } from "./routes";
import type { MainTabParamList, UserStackParamList } from "./types";

const UserNativeStack = createNativeStackNavigator<UserStackParamList>();

function UserStackNavigator() {
  return (
    <UserNativeStack.Navigator>
      <UserNativeStack.Screen
        name={USER_STACK.UserHome}
        component={UserHomeScreen}
        options={{ title: "我", headerShown: true }}
      />
      <UserNativeStack.Screen
        name={USER_STACK.UserWebTest}
        component={WebTestScreen}
        options={{ title: "WebView 测试", headerShown: true }}
      />
    </UserNativeStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const t = useTempoTheme();
  const insets = useSafeAreaInsets();

  return (
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
        options={{ tabBarLabel: "日程", headerTitle: "日程" }}
      />
      <Tab.Screen
        name={MAIN_TAB.Finance}
        component={FinanceHomeScreen}
        options={{ tabBarLabel: "资产", headerTitle: "资产" }}
      />
      <Tab.Screen
        name={MAIN_TAB.User}
        component={UserStackNavigator}
        options={{ tabBarLabel: "我", headerShown: false }}
      />
    </Tab.Navigator>
  );
}

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FinanceHomeScreen from "../../modules/finance/FinanceHomeScreen";
import { ScheduleStackNavigator } from "../../modules/schedule/navigation/ScheduleStackNavigator";
import UserHomeScreen from "../../modules/user/UserHomeScreen";
import WebTestScreen from "../../modules/user/WebTestScreen";
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
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
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

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FinanceHomeScreen from "../../modules/finance/FinanceHomeScreen";
import { ScheduleStackNavigator } from "../../modules/schedule/navigation/ScheduleStackNavigator";
import { UserStackNavigator } from "../../modules/user/navigation/UserStackNavigator";
import { useTempoTheme } from "../theme";
import { MAIN_STACK } from "./routes";
import type { MainStackParamList } from "./types";

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainTabNavigator() {
  const t = useTempoTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name={MAIN_STACK.Schedule}
          component={ScheduleStackNavigator}
        />
        <Stack.Screen
          name={MAIN_STACK.Finance}
          component={FinanceHomeScreen}
        />
        <Stack.Screen
          name={MAIN_STACK.User}
          component={UserStackNavigator}
        />
      </Stack.Navigator>
    </View>
  );
}

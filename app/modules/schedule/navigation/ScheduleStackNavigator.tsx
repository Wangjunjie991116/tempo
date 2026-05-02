import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { SCHEDULE_STACK } from "../../../core/navigation/routes";
import type { ScheduleStackParamList } from "../../../core/navigation/types";
import NotificationInboxScreen from "../screens/NotificationInboxScreen";
import ScheduleHomeScreen from "../screens/ScheduleHomeScreen";

const Stack = createNativeStackNavigator<ScheduleStackParamList>();

export function ScheduleStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={SCHEDULE_STACK.ScheduleHome} component={ScheduleHomeScreen} />
      <Stack.Screen name={SCHEDULE_STACK.NotificationInbox} component={NotificationInboxScreen} />
    </Stack.Navigator>
  );
}

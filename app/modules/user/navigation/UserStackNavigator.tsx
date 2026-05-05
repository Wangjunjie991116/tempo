import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "../../../core/i18n";
import { USER_STACK } from "../../../core/navigation/routes";
import type { UserStackParamList } from "../../../core/navigation/types";
import UserHomeScreen from "../UserHomeScreen";
import WebTestScreen from "../WebTestScreen";

const UserNativeStack = createNativeStackNavigator<UserStackParamList>();

export function UserStackNavigator() {
  const { t } = useTranslation(["common"]);
  return (
    <UserNativeStack.Navigator>
      <UserNativeStack.Screen
        name={USER_STACK.UserHome}
        component={UserHomeScreen}
        options={{ headerShown: false }}
      />
      <UserNativeStack.Screen
        name={USER_STACK.UserWebTest}
        component={WebTestScreen}
        options={{ title: t("common:webTestTitle"), headerShown: true }}
      />
    </UserNativeStack.Navigator>
  );
}

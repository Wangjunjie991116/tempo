import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "../../../core/i18n";
import { USER_STACK } from "../../../core/navigation/routes";
import type { UserStackParamList } from "../../../core/navigation/types";
import UserHomeScreen from "../UserHomeScreen";
import WebTestScreen from "../WebTestScreen";
import AccountScreen from "../screens/AccountScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";

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
      <UserNativeStack.Screen
        name={USER_STACK.Account}
        component={AccountScreen}
        options={{ headerShown: false }}
      />
      <UserNativeStack.Screen
        name={USER_STACK.EditProfile}
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <UserNativeStack.Screen
        name={USER_STACK.Settings}
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
    </UserNativeStack.Navigator>
  );
}

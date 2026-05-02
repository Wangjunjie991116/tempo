import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../../modules/login/LoginScreen";
import { AUTH_STACK } from "./routes";
import type { AuthStackParamList } from "./types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={AUTH_STACK.Login} component={LoginScreen} />
    </Stack.Navigator>
  );
}

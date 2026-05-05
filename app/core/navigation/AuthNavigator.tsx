import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignInScreen from "../../modules/auth/SignInScreen";
import SignUpScreen from "../../modules/auth/SignUpScreen";
import ForgotPasswordScreen from "../../modules/auth/ForgotPasswordScreen";
import ChangePasswordScreen from "../../modules/auth/ChangePasswordScreen";
import { AUTH_STACK } from "./routes";
import type { AuthStackParamList } from "./types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name={AUTH_STACK.Login} component={SignInScreen} />
      <Stack.Screen name={AUTH_STACK.SignUp} component={SignUpScreen} />
      <Stack.Screen
        name={AUTH_STACK.ForgotPassword}
        component={ForgotPasswordScreen}
      />
      <Stack.Screen
        name={AUTH_STACK.ChangePassword}
        component={ChangePasswordScreen}
      />
    </Stack.Navigator>
  );
}

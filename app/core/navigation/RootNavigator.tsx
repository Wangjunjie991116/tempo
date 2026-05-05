import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SplashScreen from "../../modules/splash/SplashScreen";
import OnboardingScreen from "../../modules/onboarding/OnboardingScreen";
import { AuthNavigator } from "./AuthNavigator";
import { MainTabNavigator } from "./MainTabNavigator";
import { ROOT_STACK } from "./routes";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={ROOT_STACK.Splash}
    >
      <Stack.Screen name={ROOT_STACK.Splash} component={SplashScreen} />
      <Stack.Screen name={ROOT_STACK.Onboarding} component={OnboardingScreen} />
      <Stack.Screen name={ROOT_STACK.Auth} component={AuthNavigator} />
      <Stack.Screen name={ROOT_STACK.Main} component={MainTabNavigator} />
    </Stack.Navigator>
  );
}

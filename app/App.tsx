import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { bootstrapAppLanguage } from "./core/i18n";
import { TempoThemeProvider } from "./core/theme";
import { enableAndroidLayoutAnimationExperimental } from "./core/ui/layoutAnimation";
import {
  AuthNavigationSync,
  navigationRef,
  RootNavigator,
  tempoLinking,
} from "./core/navigation";
import { SessionProvider } from "./core/session";
import { ToastProvider } from "./core/ui";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
  });

  useEffect(() => {
    enableAndroidLayoutAnimationExperimental();
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    void (async () => {
      await bootstrapAppLanguage();
      await SplashScreen.hideAsync();
    })();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <TempoThemeProvider>
      <SafeAreaProvider>
        <ToastProvider>
          <SessionProvider>
            <NavigationContainer ref={navigationRef} linking={tempoLinking}>
              <StatusBar style="dark" />
              <RootNavigator />
              <AuthNavigationSync />
            </NavigationContainer>
          </SessionProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </TempoThemeProvider>
  );
}

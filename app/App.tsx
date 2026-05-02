import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  AuthNavigationSync,
  navigationRef,
  RootNavigator,
  tempoLinking,
} from "./core/navigation";
import { SessionProvider } from "./core/session";

export default function App() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <NavigationContainer ref={navigationRef} linking={tempoLinking}>
          <StatusBar style="dark" />
          <RootNavigator />
          <AuthNavigationSync />
        </NavigationContainer>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

import type { NavigatorScreenParams } from "@react-navigation/native";
import { AUTH_STACK, MAIN_TAB, ROOT_STACK, USER_STACK } from "./routes";

export type UserStackParamList = {
  [USER_STACK.UserHome]: undefined;
  [USER_STACK.UserWebTest]: undefined;
};

export type MainTabParamList = {
  [MAIN_TAB.Schedule]: undefined;
  [MAIN_TAB.Finance]: undefined;
  [MAIN_TAB.User]: NavigatorScreenParams<UserStackParamList>;
};

export type AuthStackParamList = {
  [AUTH_STACK.Login]: undefined;
};

export type RootStackParamList = {
  [ROOT_STACK.Splash]: undefined;
  [ROOT_STACK.Auth]: NavigatorScreenParams<AuthStackParamList>;
  [ROOT_STACK.Main]: NavigatorScreenParams<MainTabParamList>;
};

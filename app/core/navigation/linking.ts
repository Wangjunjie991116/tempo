import type { LinkingOptions } from "@react-navigation/native";
import {
  AUTH_STACK,
  LINK_PATHS,
  MAIN_TAB,
  ROOT_STACK,
  USER_STACK,
} from "./routes";
import type { RootStackParamList } from "./types";

export const tempoLinking: LinkingOptions<RootStackParamList> = {
  prefixes: ["tempo://", "https://tempo.app"],
  config: {
    screens: {
      [ROOT_STACK.Splash]: LINK_PATHS.splash,
      [ROOT_STACK.Auth]: {
        path: LINK_PATHS.auth,
        screens: {
          [AUTH_STACK.Login]: "",
        },
      },
      [ROOT_STACK.Main]: {
        path: LINK_PATHS.main,
        screens: {
          [MAIN_TAB.Schedule]: LINK_PATHS.schedule,
          [MAIN_TAB.Finance]: LINK_PATHS.finance,
          [MAIN_TAB.User]: {
            path: LINK_PATHS.user,
            screens: {
              [USER_STACK.UserHome]: "",
              [USER_STACK.UserWebTest]: LINK_PATHS.userWebTest,
            },
          },
        },
      },
    },
  },
};

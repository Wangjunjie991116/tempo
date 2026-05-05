import type { LinkingOptions } from "@react-navigation/native";
import {
  AUTH_STACK,
  LINK_PATHS,
  MAIN_TAB,
  ROOT_STACK,
  SCHEDULE_STACK,
  USER_STACK,
} from "./routes";
import type { RootStackParamList } from "./types";

/**
 * Deep Link / Universal Link 配置：`tempo://` 与 `https://tempo.app` 前缀映射到根栈与各 Tab 路径。
 *
 * @example
 * - 日程首页：`tempo://app/schedule`、`https://tempo.app/app/schedule`
 * - 通知收件箱：`.../schedule/notifications`
 */
export const tempoLinking: LinkingOptions<RootStackParamList> = {
  prefixes: ["tempo://", "https://tempo.app"],
  config: {
    screens: {
      [ROOT_STACK.Splash]: LINK_PATHS.splash,
      [ROOT_STACK.Onboarding]: "onboarding",
      [ROOT_STACK.Auth]: {
        path: LINK_PATHS.auth,
        screens: {
          [AUTH_STACK.Login]: "",
          [AUTH_STACK.SignUp]: "signup",
          [AUTH_STACK.ForgotPassword]: "forgot-password",
          [AUTH_STACK.ChangePassword]: "change-password",
        },
      },
      [ROOT_STACK.Main]: {
        path: LINK_PATHS.main,
        screens: {
          [MAIN_TAB.Schedule]: {
            path: LINK_PATHS.schedule,
            screens: {
              [SCHEDULE_STACK.ScheduleHome]: "",
              [SCHEDULE_STACK.NotificationInbox]: "notifications",
            },
          },
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

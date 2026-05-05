/**
 * 导航路由 **字符串常量** 与 Deep Link 路径段（`LINK_PATHS`），供 Navigator `name` / `linking.config` 使用。
 */
export const ROOT_STACK = {
  Splash: "Splash",
  Onboarding: "Onboarding",
  Auth: "Auth",
  Main: "Main",
} as const;

export const AUTH_STACK = {
  Login: "Login",
  SignUp: "SignUp",
  ForgotPassword: "ForgotPassword",
  ChangePassword: "ChangePassword",
} as const;

export const MAIN_TAB = {
  Schedule: "ScheduleTab",
  Finance: "FinanceTab",
  User: "UserTab",
} as const;

export const SCHEDULE_STACK = {
  ScheduleHome: "ScheduleHome",
  NotificationInbox: "NotificationInbox",
} as const;

export const USER_STACK = {
  UserHome: "UserHome",
  UserWebTest: "UserWebTest",
} as const;

export const LINK_PATHS = {
  splash: "splash",
  auth: "auth",
  main: "app",
  schedule: "schedule",
  finance: "finance",
  user: "user",
  userWebTest: "web-test",
} as const;

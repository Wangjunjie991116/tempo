export const ROOT_STACK = {
  Splash: "Splash",
  Auth: "Auth",
  Main: "Main",
} as const;

export const AUTH_STACK = {
  Login: "Login",
} as const;

export const MAIN_TAB = {
  Schedule: "ScheduleTab",
  Finance: "FinanceTab",
  User: "UserTab",
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

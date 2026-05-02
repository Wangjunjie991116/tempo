# Tempo App — 原生壳 + `modules/*` + User 内 WebView 测试入口

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `app` 从「全屏 WebView + 开屏遮罩」演进为 **React Navigation 主导的原生应用**：底部 Tab（日程 / 资产 / 我），`core/navigation` 集中维护路由名与 `linking`；**当前 Web 仅作为调试用途**，放在 **`modules/user`** 中经「测试」入口进入全屏 WebView（沿用现有 `EXPO_PUBLIC_WEB_BASE_URL` / `extra` 与 `__TEMPO_CONFIG__` 注入逻辑）。开发期局域网地址可由仓库根目录 **`pnpm sync:lan-env`** 写入 **`app/.env.dev`**。

**Architecture:** 单仓竖切：`app/modules/*` 禁止互引；`app/core/navigation` 为路由与 URL scheme 唯一真源；`app/core/session` 提供最小登录态（首版可用占位按钮完成门禁演示）。开屏可保留为根栈首屏，结束后 `replace` 到 Auth 或 Main。主导航为 **Native Stack（根） + Bottom Tabs（Main）**；`用户` Tab 内使用 **嵌套 Native Stack**，以便从「我」Push 到 WebView 测试页并支持返回。

**Tech Stack:** Expo SDK 54、`react-native` 0.81、`@react-navigation/native`、`@react-navigation/native-stack`、`@react-navigation/bottom-tabs`、`react-native-screens`（由 `expo install` 对齐版本）、既有 `react-native-safe-area-context`、`react-native-webview`。

**约定路径前缀：** 下文「`app/`」均指仓库内 **`/Users/didi/Documents/project/private/tempo/app/`**（即 Expo 子工程根目录）。

---

## 文件地图（创建 / 修改职责）

| 路径 | 职责 |
|------|------|
| **Create** `app/core/navigation/routes.ts` | 导出路由名常量（避免魔法字符串）、导出 `linking` 用的 path 片段常量。 |
| **Create** `app/core/navigation/types.ts` | `RootStackParamList`、`MainTabParamList`、各 Tab 内 `StackParamList`（User 含 WebTest）。 |
| **Create** `app/core/navigation/linking.ts` | `linking` 配置：`prefixes`（`tempo://` + 占位 `https://tempo.app`）+ `config` 映射到上述路由名。 |
| **Create** `app/core/navigation/index.ts` | 统一 re-export（壳只从这里引用公共导航 API）。 |
| **Create** `app/core/navigation/RootNavigator.tsx` | 根 `NativeStackNavigator`：`Splash` / `Auth` / `Main`（**不含** `NavigationContainer`；容器与 `linking` 仅在 `App.tsx`）。 |
| **Create** `app/core/session/SessionContext.tsx` | `SessionProvider`、`useSession()`：`isAuthenticated`、`signIn()`、`signOut()`（首版内存状态即可）。 |
| **Create** `app/core/session/index.ts` | re-export。 |
| **Create** `app/modules/splash/SplashScreen.tsx` | 从当前 `App.tsx` 迁移开屏 UI；结束 `onFinish` 由父级传入或 `navigation.replace`。 |
| **Create** `app/modules/login/LoginScreen.tsx` | 占位 UI +「进入应用」调用 `signIn()` 后 `navigation.replace('Main')`。 |
| **Create** `app/modules/schedule/ScheduleHomeScreen.tsx` | 占位首页（文案标明 RN 日程占位）。 |
| **Create** `app/modules/finance/FinanceHomeScreen.tsx` | 占位首页（文案标明 RN 资产占位）。 |
| **Create** `app/modules/user/UserHomeScreen.tsx` | 「我」首页：列表或按钮含 **「WebView 测试」**，`navigation.navigate('UserWebTest')`。 |
| **Create** `app/modules/user/WebTestScreen.tsx` | 全屏 WebView：复用现 `App.tsx` 中 `WEB_URL`、`API_URL`、`injected`、localhost 提示（可抽成小 hook `useTempoWebConfig()` 放在 `app/core/config` 若愿意去重，首版允许轻微重复以少动文件）。 |
| **Create** `app/navigation/MainTabNavigator.tsx`（可选放 `core/navigation/`） | 三个 Tab：`Schedule` / `Finance` / `User`；`User` 为嵌套 stack。 |
| **Modify** `app/App.tsx` | 仅保留：`SafeAreaProvider`、`SessionProvider`、`RootNavigator`（或 `NavigationContainer` 若你更愿意放在 `App.tsx` — 计划默认放在 `RootNavigator` 内）、`StatusBar`；删除全屏 WebView 与内联开屏（迁移到模块）。 |
| **Modify** `app/package.json` | 增加 React Navigation 与 `react-native-screens` 依赖（版本以 `expo install` 为准）。 |

---

## Self-check（对照 `2026-05-02-native-modules-tab-navigation-design.md`）

- **modules 竖切 + user 收纳 Web 测试**：`WebTestScreen` 仅在 `modules/user`，其它模块无 WebView。
- **路由集中**：所有 `name` 与对外 deep link path 均源自 `routes.ts` / `linking.ts`。
- **Tab 文案**：日程、资产、我。
- **不强依赖 web 业务**：无「迁移整站路由到 RN」步骤。

---

### Task 1: 安装导航相关依赖（Expo 对齐版本）

**Files:**
- Modify: `app/package.json`
- Modify: `pnpm-lock.yaml`（仓库根执行 install）

- [ ] **Step 1:** 在仓库根执行（确保改写 `app` 依赖）：

```bash
cd /Users/didi/Documents/project/private/tempo/app && npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens
```

- [ ] **Step 2:** 在仓库根执行 lockfile 更新：

```bash
cd /Users/didi/Documents/project/private/tempo && pnpm install
```

- [ ] **Step 3:** 本地 smoke（可选，期望能启动不出现 red screen）：

```bash
cd /Users/didi/Documents/project/private/tempo/app && pnpm exec tsc --noEmit
```

Expected: 若尚未改 `App.tsx` 可能仍通过；若有类型错误在后续任务修。

- [ ] **Step 4: Commit**

```bash
cd /Users/didi/Documents/project/private/tempo && git add app/package.json pnpm-lock.yaml && git commit -m "chore(app): add react-navigation and react-native-screens"
```

---

### Task 2: 路由常量与导航类型

**Files:**
- Create: `app/core/navigation/routes.ts`
- Create: `app/core/navigation/types.ts`

- [ ] **Step 1:** 写入 `app/core/navigation/routes.ts`：

```typescript
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

/** Deep link path segments（不含 scheme / host），与 React Navigation linking.config 对齐 */
export const LINK_PATHS = {
  splash: "splash",
  auth: "auth",
  main: "app",
  schedule: "schedule",
  finance: "finance",
  user: "user",
  userWebTest: "web-test",
} as const;
```

- [ ] **Step 2:** 写入 `app/core/navigation/types.ts`：

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
cd /Users/didi/Documents/project/private/tempo && git add app/core/navigation/routes.ts app/core/navigation/types.ts && git commit -m "feat(app): add centralized navigation route names and types"
```

---

### Task 3: `linking` 单点配置

**Files:**
- Create: `app/core/navigation/linking.ts`

- [ ] **Step 1:** 写入 `app/core/navigation/linking.ts`：

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
cd /Users/didi/Documents/project/private/tempo && git add app/core/navigation/linking.ts && git commit -m "feat(app): centralize URL prefixes and linking config"
```

---

### Task 4: 最小 Session（门禁演示）

**Files:**
- Create: `app/core/session/SessionContext.tsx`
- Create: `app/core/session/index.ts`

- [ ] **Step 1:** 写入 `app/core/session/SessionContext.tsx`：

```typescript
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SessionValue = {
  isAuthenticated: boolean;
  signIn: () => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(false);

  const signIn = useCallback(() => setAuthenticated(true), []);
  const signOut = useCallback(() => setAuthenticated(false), []);

  const value = useMemo(
    () => ({ isAuthenticated, signIn, signOut }),
    [isAuthenticated, signIn, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
```

- [ ] **Step 2:** 写入 `app/core/session/index.ts`：

```typescript
export { SessionProvider, useSession } from "./SessionContext";
```

- [ ] **Step 3: Commit**

```bash
cd /Users/didi/Documents/project/private/tempo && git add app/core/session && git commit -m "feat(app): add minimal session context for auth gate"
```

---

### Task 5: 开屏 / 登录 / 占位 Tab 页面

**Files:**
- Create: `app/modules/splash/SplashScreen.tsx`
- Create: `app/modules/login/LoginScreen.tsx`
- Create: `app/modules/schedule/ScheduleHomeScreen.tsx`
- Create: `app/modules/finance/FinanceHomeScreen.tsx`

- [ ] **Step 1:** 将 **当前 `App.tsx` 内开屏 overlay** 的视觉与定时逻辑（`SPLASH_VISIBLE_MS`、`SPLASH_FADE_MS`、`Animated`、渐变与图标等）迁移到 `app/modules/splash/SplashScreen.tsx`，接口示例：

```typescript
import { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ROOT_STACK } from "../../core/navigation/routes";
import type { RootStackParamList } from "../../core/navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROOT_STACK.Splash>;

// 屏幕内 useEffect：动画结束后 navigation.replace(...) 由父组件传入的 listener 处理 —
// 更简单：在 useEffect 末尾根据 props 调用 navigation.replace（见 Task 7 中统一逻辑）
```

实现要点：动画 `finished` 后调用 `navigation.replace(下一步)` — 下一步由 Task 7 的 `SplashScreen` 包装逻辑决定（见 Task 7 代码）。

- [ ] **Step 2:** 写入 `app/modules/login/LoginScreen.tsx`（占位 + 门禁）：**仅**调用 `signIn()`，**不要**在本文件内 `navigation.navigate('Main')`——由 Task 7 中 `RootNavigator` 的 `useEffect` 在监听到 `isAuthenticated === true` 后 `reset` 到 `Main`。

```typescript
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSession } from "../../core/session";
import { AUTH_STACK } from "../../core/navigation/routes";
import type { AuthStackParamList } from "../../core/navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, typeof AUTH_STACK.Login>;

export default function LoginScreen(_props: Props) {
  const { signIn } = useSession();
  return (
    <View style={styles.root}>
      <Text style={styles.title}>登录（RN 占位）</Text>
      <Pressable style={styles.btn} onPress={signIn}>
        <Text style={styles.btnText}>进入应用（演示）</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 20, marginBottom: 16 },
  btn: { paddingVertical: 12, paddingHorizontal: 20, backgroundColor: "#1a223d", borderRadius: 8 },
  btnText: { color: "#fff", fontSize: 16 },
});
```

- [ ] **Step 3:** `ScheduleHomeScreen.tsx` / `FinanceHomeScreen.tsx`：各一页 `flex:1` 居中 `Text`（「日程 · RN 占位」「资产 · RN 占位」）。

- [ ] **Step 4: Commit**

```bash
cd /Users/didi/Documents/project/private/tempo && git add app/modules/splash app/modules/login app/modules/schedule app/modules/finance && git commit -m "feat(app): add splash, login placeholder, and tab home placeholders"
```

---

### Task 6: `modules/user` — 「我」+ WebView 测试页

**Files:**
- Create: `app/modules/user/UserHomeScreen.tsx`
- Create: `app/modules/user/WebTestScreen.tsx`

- [ ] **Step 1:** `UserHomeScreen.tsx`：`Pressable`「WebView 测试」→ `navigation.navigate(USER_STACK.UserWebTest)`；另可加「退出登录」调用 `signOut()`（RootNavigator 应退回 Auth — 同 Task 7 effect）。

- [ ] **Step 2:** `WebTestScreen.tsx`：从 **`App.tsx` 复制** `WEB_URL` / `API_URL` 解析逻辑、`injected` 字符串、`showLocalhostHint` 与 `WebView` props（`injectedJavaScriptBeforeContentLoaded` 等），布局为全屏 WebView + 可选顶部 `SafeArea` 返回按钮（header 可用 `User` 嵌套 stack 的 `screenOptions` 统一配置）。

- [ ] **Step 3: Commit**

```bash
cd /Users/didi/Documents/project/private/tempo && git add app/modules/user && git commit -m "feat(app): add user tab with WebView test screen"
```

---

### Task 7: MainTabNavigator + RootNavigator + 登录态与 Splash 衔接

**Files:**
- Create: `app/core/navigation/MainTabNavigator.tsx`
- Create: `app/core/navigation/RootNavigator.tsx`
- Create: `app/core/navigation/index.ts`
- Modify: `app/modules/login/LoginScreen.tsx`（通常无需再改；若仍含 `navigation.navigate` 则删掉）
- Modify: `app/modules/splash/SplashScreen.tsx`（结束后跳转）

- [ ] **Step 1:** `MainTabNavigator.tsx`：  
  - `createBottomTabNavigator`，三 Tab `name` 用 `MAIN_TAB.*`，`tabBarLabel` 分别为 **`日程` / `资产` / `我`**。  
  - `User`：`createNativeStackNavigator`， screens：`UserHome`、`UserWebTest`（header 对 WebTest 显示返回）。

- [ ] **Step 2:** `RootNavigator.tsx`：  
  - **仅** `createNativeStackNavigator`：`Splash` | `Auth`（内嵌 `Login` 的 stack 或单屏） | `Main`（`MainTabNavigator`）。  
  - **Splash 结束**：`navigation.replace`：若 `!isAuthenticated` → `Auth`；否则 → `Main`。  
  - **`useEffect` 监听 `isAuthenticated`**：当变为 `true` 且当前在 `Auth` 流程时 `navigation.reset` 到 `Main`；当变为 `false` 时 `reset` 到 `Auth`（不回到 Splash，避免重复品宣）。  
  - **不要**在本文件内再放 `NavigationContainer`（已在 `App.tsx`）。

- [ ] **Step 3:** `app/core/navigation/index.ts`：

```typescript
export { tempoLinking } from "./linking";
export * from "./routes";
export type * from "./types";
export { RootNavigator } from "./RootNavigator";
```

- [ ] **Step 4:** 运行类型检查：

```bash
cd /Users/didi/Documents/project/private/tempo/app && pnpm exec tsc --noEmit
```

Expected: 无错误（若有，修正 `RootStackParamList` 与 `navigate` 泛型）。

- [ ] **Step 5: Commit**

```bash
cd /Users/didi/Documents/project/private/tempo && git add app/core/navigation app/modules/login app/modules/splash && git commit -m "feat(app): compose root stack, tabs, and auth navigation effects"
```

---

### Task 8: 精简 `App.tsx` 为壳入口

**Files:**
- Modify: `app/App.tsx`

- [ ] **Step 1:** `App.tsx` 只保留：

```tsx
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator, tempoLinking } from "./core/navigation";
import { SessionProvider } from "./core/session";

export default function App() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <NavigationContainer linking={tempoLinking}>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
```

**注意：** `NavigationContainer` **只在** `App.tsx`；`RootNavigator` **只含** `Stack.Navigator`，便于测试时包裹同一容器。

- [ ] **Step 2:** 删除原 `App.tsx` 中 WebView、banner、localhost `Text`（已迁至 `WebTestScreen`）。

- [ ] **Step 3:**

```bash
cd /Users/didi/Documents/project/private/tempo/app && pnpm exec tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
cd /Users/didi/Documents/project/private/tempo && git add app/App.tsx && git commit -m "refactor(app): App shell delegates to navigation modules"
```

---

### Task 9: 手动验收清单（无需自动化测试）

- [ ] **Step 1:** 启动：`cd app && pnpm start`，打开 iOS Simulator 或 Android Emulator。

- [ ] **Step 2:** 验证流：**开屏** → **登录页** → 点「进入应用」→ **底部三 Tab** 显示中文标签。

- [ ] **Step 3:** 在 **我** Tab 点 **WebView 测试**：应加载与改造前相同的 URL；控制台若 `localhost` 应有真机提示（与旧逻辑一致）。

- [ ] **Step 4:** 在 **我** 页若实现「退出登录」：应回到登录页。

- [ ] **Step 5（可选）：** 用 Safari / `xcrun simctl openurl booted 'tempo://app/user/web-test'` 验证 deep link（路径以你 `linking` 为准，若首次未配置 universal link 忽略失败则仅记作后续项）。

- [ ] **Step 6: Commit**（若仅有文档/无代码，可跳过；若修正 bug 则正常提交）

---

## Plan 自审

1. **Spec / 用户需求覆盖：** `modules/user` 内 Web 测试入口、RN 为核心、路由集中、三 Tab、英文目录 — 已映射到 Task 5–9。  
2. **占位符扫描：** Task 5 Login 中曾含实现备注，已在文内指到 Task 7 的最终形态（`signIn` + Root `useEffect`）。执行时以 Task 7 为准删掉临时代码。  
3. **类型一致：** 路由名全部来自 `routes.ts`，`types.ts` 与 `linking.ts` 同步。

---

## 执行交接

**计划已保存到** `docs/superpowers/plans/2026-05-02-native-shell-modules-web-test.md`。

**可选执行方式：**

1. **Subagent-Driven（推荐）** — 每任务独立子代理，任务间人工过一眼。  
2. **本会话连续执行** — 按 Task 1→9 在同一环境改代码、每 Task 后 `tsc` / 真机 smoke。

你更希望采用哪一种？若不需要选型，可直接说 **「按计划在 app 里开始实现」**，我可以从 Task 1 起逐项落代码。

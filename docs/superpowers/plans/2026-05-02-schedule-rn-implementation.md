# Tempo 日程板块（RN）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Expo `app/` 中交付与设计稿高还原的日程 Tab（日期条 + Upcoming / Finished + 自绘卡片与时间轴）、铃铛进入的通知收件箱（Segment + Paper List + 空状态）、本地持久化日程数据（Release 无内置 Mock seed）、Manrope + light 主题 token、`i18n` 默认英文、卡片点击 Paper Snackbar「敬请期待」，并加入适度微交互。

**Architecture:** `Schedule` Tab 内嵌 Native Stack；`core/theme` 提供语义 token 与 Paper `MD3LightTheme` 桥接；`core/i18n` 三命名空间；`modules/schedule/repo` 对 AsyncStorage 持久化；UI 核心用手写组件 + `react-native-svg`，Paper 用于 Appbar / List / Snackbar / SegmentedButtons；字体经 `expo-font` + `@expo-google-fonts/manrope` 在根组件就绪后挂载导航树。

**Tech Stack:** Expo SDK 54、RN 0.81、`@react-navigation/native-stack`、react-native-paper、react-native-svg、`@react-native-async-storage/async-storage`、i18next、react-i18next、expo-localization、expo-font、@expo-google-fonts/manrope、jest-expo + @testing-library/react-native（仅用于仓储/序列化测试）。

**设计规格来源:** `docs/superpowers/specs/2026-05-02-schedule-rn-design.md`

---

## 文件结构（创建 / 修改一览）

| 路径 | 职责 |
|------|------|
| **Create** `app/core/theme/tokens.ts` | Figma light 原始色值、间距、圆角、字号阶梯 |
| **Create** `app/core/theme/semantic.ts` | 语义别名 → 原始 token |
| **Create** `app/core/theme/paperTheme.ts` | `MD3LightTheme` 覆盖（colors、fonts） |
| **Create** `app/core/theme/TempoThemeProvider.tsx` | Context：`useTempoTheme()` |
| **Create** `app/core/theme/index.ts` | 对外 re-export |
| **Create** `app/core/i18n/config.ts` | `i18next.init`，`lng: 'en'`，`fallbackLng: 'en'` |
| **Create** `app/core/i18n/locales/en/common.json` | 通用文案 |
| **Create** `app/core/i18n/locales/en/schedule.json` | 日程、问候、区块标题、Toast |
| **Create** `app/core/i18n/locales/en/notifications.json` | Segment、空状态、列表 |
| **Create** `app/core/i18n/index.ts` | 初始化 + `useTranslation` 再导出（按需） |
| **Create** `app/core/storage/asyncJson.ts` | （可选）`readJson` / `writeJson`；首版可省略 |
| **Create** `app/modules/schedule/repo/types.ts` | `ScheduleItem`、`ScheduleTag`、`ScheduleListState` |
| **Create** `app/modules/schedule/repo/seed.ts` | 英文 seed 数据 |
| **Create** `app/modules/schedule/repo/scheduleStorage.ts` | Key `tempo.schedule.v1`、读写、首次 seed |
| **Create** `app/modules/schedule/repo/ScheduleRepository.ts` | 接口 + `createScheduleRepository()` |
| **Create** `app/modules/schedule/repo/__tests__/scheduleStorage.test.ts` | 序列化与 seed 逻辑单测 |
| **Create** `app/jest.config.js` | `jest-expo` preset |
| **Modify** `app/package.json` | dependencies、scripts `test` |
| **Create** `app/modules/schedule/components/DateStrip.tsx` | 横向周选择 + 微交互 |
| **Create** `app/modules/schedule/components/ScheduleTagBadge.tsx` | Design Review / Workshop / Brainstorming 色 |
| **Create** `app/modules/schedule/components/ScheduleCard.tsx` | 自绘卡片 + Pressable 反馈 |
| **Create** `app/modules/schedule/components/ScheduleSectionHeader.tsx` | Upcoming / Finished 标题行 |
| **Create** `app/modules/schedule/components/TimelineRail.tsx` | 左侧竖线 + 月份节点 |
| **Create** `app/modules/schedule/components/icons/*.tsx` | 铃铛、chevron 等 SVG（按需拆分） |
| **Create** `app/modules/schedule/components/NotificationEmptyState.tsx` | 空状态插画区 + 文案 |
| **Create** `app/modules/schedule/hooks/useScheduleData.ts` | 读 repo、按选中日期刷新 |
| **Create** `app/modules/schedule/hooks/useNotificationFeed.ts` | 两段 Mock 列表数据 |
| **Create** `app/modules/schedule/screens/ScheduleHomeScreen.tsx` | 组合头部、DateStrip、列表、Snackbar |
| **Create** `app/modules/schedule/screens/NotificationInboxScreen.tsx` | Appbar、SegmentedButtons、Paper List |
| **Create** `app/modules/schedule/navigation/ScheduleStackNavigator.tsx` | Stack 定义 |
| **Modify** `app/core/navigation/routes.ts` | `SCHEDULE_STACK` 常量 |
| **Modify** `app/core/navigation/types.ts` | `ScheduleStackParamList`、`MainTabParamList` 嵌套 |
| **Modify** `app/core/navigation/MainTabNavigator.tsx` | Schedule Tab 挂 Stack |
| **Modify** `app/core/navigation/linking.ts` |（可选）`schedule/notifications` |
| **Modify** `app/App.tsx` | `useFonts`、Provider 嵌套顺序 |
| **Delete / 弃用** | 原根目录 `ScheduleHomeScreen.tsx` 单文件可删并迁至 `screens/`（计划：直接 **Replace** `modules/schedule/ScheduleHomeScreen.tsx` 为 re-export 或删除并更新 import） |

---

### Task 1: 依赖与 Jest 基线

**Files:**

- Modify: `app/package.json`
- Create: `app/jest.config.js`

- [x] **Step 1: 安装运行时依赖**

在项目根执行（pnpm workspace）：

```bash
cd /Users/wangjunjie/Documents/Work/Personal/tempo
pnpm --filter app add react-native-paper react-native-svg @react-native-async-storage/async-storage i18next react-i18next expo-localization expo-font @expo-google-fonts/manrope
pnpm --filter app add -D jest-expo @testing-library/react-native @types/jest
```

- [x] **Step 2: 增加 `test` 脚本**

在 `app/package.json` 的 `scripts` 中加入：

```json
"test": "jest --watchAll=false --passWithNoTests"
```

- [x] **Step 3: 创建 `app/jest.config.js`**

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  testMatch: ["**/__tests__/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/"],
  clearMocks: true,
};
```

- [x] **Step 4: 验证 Jest 可运行（尚无测试时应 0 suites 或退出 0）**

```bash
cd /Users/wangjunjie/Documents/Work/Personal/tempo/app && pnpm exec jest --watchAll=false
```

**Expected:** 进程退出码 `0`（无测试文件时可能提示 no tests found，可接受）。

- [x] **Step 5: Commit**

```bash
git add app/package.json app/jest.config.js pnpm-lock.yaml
git commit -m "chore(app): add schedule feature deps and jest-expo"
```

---

### Task 2: 设计令牌与 TempoThemeProvider

**Files:**

- Create: `app/core/theme/tokens.ts`
- Create: `app/core/theme/semantic.ts`
- Create: `app/core/theme/paperTheme.ts`
- Create: `app/core/theme/TempoThemeProvider.tsx`
- Create: `app/core/theme/index.ts`

- [x] **Step 1: 编写 `tokens.ts`（对齐 Figma light；数值可按 MCP 变量精调）**

```ts
/** Primitive design tokens — light only; dark reserved in types later. */
export const tempoPrimitives = {
  color: {
    backgroundTertiary: "#f5f5f5",
    primaryText: "#151515",
    placeholderText: "#a5a5a5",
    brand500: "#6065e6",
    success500: "#17b26a",
    success50: "#ecfdf3",
    error500: "#f04438",
    error50: "#fef3f2",
    cardUpcomingTint: "#dfe0fa",
    cardDoneTint: "#e8f5e9",
    white: "#ffffff",
    divider: "#e8e8e8",
  },
  space: { xs: 4, sm: 8, md: 16, lg: 20, xl: 24 },
  radius: { sm: 8, md: 16, pill: 25, round: 100 },
  fontSize: { tiny: 12, small: 14, body: 16, title: 18, hero: 22 },
  lineHeight: { tiny: 16, small: 22, body: 24, title: 26 },
} as const;
```

- [x] **Step 2: 编写 `semantic.ts`**

```ts
import { tempoPrimitives } from "./tokens";

export function buildSemanticLight() {
  const p = tempoPrimitives;
  return {
    screenBg: p.color.backgroundTertiary,
    textPrimary: p.color.primaryText,
    textMuted: p.color.placeholderText,
    brand: p.color.brand500,
    divider: p.color.divider,
    scheduleCardUpcoming: p.color.cardUpcomingTint,
    scheduleCardDone: p.color.cardDoneTint,
    badge: {
      designReview: { bg: p.color.cardUpcomingTint, fg: p.color.brand500 },
      workshop: { bg: p.color.success50, fg: p.color.success500 },
      brainstorm: { bg: p.color.error50, fg: p.color.error500 },
    },
    space: p.space,
    radius: p.radius,
    fontSize: p.fontSize,
    lineHeight: p.lineHeight,
  };
}

export type TempoSemantic = ReturnType<typeof buildSemanticLight>;
```

- [x] **Step 3: 编写 `paperTheme.ts`**

```ts
import { MD3LightTheme, configureFonts } from "react-native-paper";
import type { TempoSemantic } from "./semantic";

const fontConfig = {
  bodyLarge: { fontFamily: "Manrope_400Regular", fontWeight: "400" as const },
  bodyMedium: { fontFamily: "Manrope_500Medium", fontWeight: "500" as const },
  bodySmall: { fontFamily: "Manrope_400Regular", fontWeight: "400" as const },
  titleMedium: { fontFamily: "Manrope_600SemiBold", fontWeight: "600" as const },
  titleLarge: { fontFamily: "Manrope_600SemiBold", fontWeight: "600" as const },
  labelLarge: { fontFamily: "Manrope_600SemiBold", fontWeight: "600" as const },
};

export function buildPaperTheme(semantic: TempoSemantic) {
  const base = MD3LightTheme;
  return {
    ...base,
    fonts: configureFonts({ config: fontConfig }),
    colors: {
      ...base.colors,
      primary: semantic.brand,
      background: semantic.screenBg,
      surface: semantic.screenBg,
      onSurface: semantic.textPrimary,
      outline: semantic.divider,
    },
    roundness: semantic.radius.md,
  };
}
```

- [x] **Step 4: 编写 `TempoThemeProvider.tsx`**

```tsx
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Provider as PaperProvider } from "react-native-paper";
import { buildSemanticLight } from "./semantic";
import { buildPaperTheme } from "./paperTheme";
import type { TempoSemantic } from "./semantic";

const TempoSemanticContext = createContext<TempoSemantic | null>(null);

export function TempoThemeProvider({ children }: { children: ReactNode }) {
  const semantic = useMemo(() => buildSemanticLight(), []);
  const paperTheme = useMemo(() => buildPaperTheme(semantic), [semantic]);
  return (
    <TempoSemanticContext.Provider value={semantic}>
      <PaperProvider theme={paperTheme}>{children}</PaperProvider>
    </TempoSemanticContext.Provider>
  );
}

export function useTempoTheme(): TempoSemantic {
  const v = useContext(TempoSemanticContext);
  if (!v) throw new Error("useTempoTheme must be used within TempoThemeProvider");
  return v;
}
```

- [x] **Step 5: `app/core/theme/index.ts` re-export**

```ts
export { TempoThemeProvider, useTempoTheme } from "./TempoThemeProvider";
export { buildSemanticLight } from "./semantic";
export type { TempoSemantic } from "./semantic";
export { tempoPrimitives } from "./tokens";
```

- [x] **Step 6: Commit**

```bash
git add app/core/theme
git commit -m "feat(app): add light design tokens and Paper theme bridge"
```

---

### Task 3: i18n（默认英文）

**Files:**

- Create: `app/core/i18n/config.ts`
- Create: `app/core/i18n/locales/en/common.json`
- Create: `app/core/i18n/locales/en/schedule.json`
- Create: `app/core/i18n/locales/en/notifications.json`
- Create: `app/core/i18n/index.ts`

- [x] **Step 1: 英文 JSON 文案骨架**

`app/core/i18n/locales/en/common.json`:

```json
{
  "appName": "Tempo"
}
```

`app/core/i18n/locales/en/schedule.json`:

```json
{
  "tabTitle": "Schedule",
  "greetingHi": "Hi, {{name}}",
  "goodMorning": "Good morning.",
  "sectionUpcoming": "Upcoming ({{count}})",
  "sectionFinished": "Finished ({{count}})",
  "detailSoon": "Coming soon.",
  "monthShortDec": "Dec"
}
```

`app/core/i18n/locales/en/notifications.json`:

```json
{
  "inboxTitle": "Notifications",
  "segmentActivity": "Activity",
  "segmentSystem": "System",
  "emptyTitle": "No notifications yet",
  "emptySubtitle": "You're all caught up.",
  "listMockTitle": "Sample notification"
}
```

- [x] **Step 2: `config.ts` 初始化**

```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import common from "./locales/en/common.json";
import schedule from "./locales/en/schedule.json";
import notifications from "./locales/en/notifications.json";

export const resources = {
  en: { common, schedule, notifications },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  defaultNS: "common",
  ns: ["common", "schedule", "notifications"],
});

export function getDeviceLocaleTag(): string {
  return Localization.getLocales()[0]?.languageTag ?? "en";
}

export default i18n;
```

- [x] **Step 3: `index.ts`**

```ts
import "./config";
export { default as i18n } from "i18next";
export { useTranslation } from "react-i18next";
```

- [x] **Step 4: 在 `App.tsx` 顶部副作用导入 i18n（在 Provider 之前）**

在 `import { SessionProvider }` 上一行增加：

```ts
import "./core/i18n";
```

- [x] **Step 5: Commit**

```bash
git add app/core/i18n app/App.tsx
git commit -m "feat(app): add i18n with English default"
```

---

### Task 4: Manrope 字体与 Provider 顺序

**Files:**

- Modify: `app/App.tsx`

- [x] **Step 1: 使用 `expo-google-fonts` 加载字体**

在 `App.tsx` 中：

```tsx
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
} from "@expo-google-fonts/manrope";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { TempoThemeProvider } from "./core/theme";
import "./core/i18n";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  const [loaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
  });

  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <TempoThemeProvider>
      <SafeAreaProvider>
        <SessionProvider>
          <NavigationContainer ref={navigationRef} linking={tempoLinking}>
            <StatusBar style="dark" />
            <RootNavigator />
            <AuthNavigationSync />
          </NavigationContainer>
        </SessionProvider>
      </SafeAreaProvider>
    </TempoThemeProvider>
  );
}
```

（保留原有 import，删除重复 `SafeAreaProvider` 包裹若冲突 — **最终应仅一层 `SafeAreaProvider`**。）

- [x] **Step 2: 安装 `expo-splash-screen`（若模板未包含）**

```bash
pnpm --filter app add expo-splash-screen
```

- [x] **Step 3: 真机冷启动目测**

```bash
pnpm --filter app start
```

**Expected:** 闪屏直至字体就绪后进入主导航，无红色报错。

- [x] **Step 4: Commit**

```bash
git add app/App.tsx app/package.json pnpm-lock.yaml
git commit -m "feat(app): load Manrope and wrap TempoThemeProvider"
```

---

### Task 5: AsyncStorage + 仓储（TDD）

**Files:**

- Create: `app/modules/schedule/repo/types.ts`
- Create: `app/modules/schedule/repo/seed.ts`
- Create: `app/modules/schedule/repo/scheduleStorage.ts`
- Create: `app/modules/schedule/repo/ScheduleRepository.ts`
- Create: `app/modules/schedule/repo/__tests__/scheduleStorage.test.ts`

- [x] **Step 1: 写失败测试 — 合并 seed 逻辑**

`app/modules/schedule/repo/__tests__/scheduleStorage.test.ts`:

```ts
import { mergeWithSeedIfEmpty } from "../scheduleStorage";

describe("mergeWithSeedIfEmpty", () => {
  const seed = [
    { id: "b", title: "B", tag: "workshop" as const, startAt: "", endAt: "", status: "upcoming" as const, attendeeCount: 0 },
  ];

  it("returns existing when non-empty array", () => {
    const existing = [
      { id: "a", title: "A", tag: "workshop" as const, startAt: "", endAt: "", status: "upcoming" as const, attendeeCount: 0 },
    ];
    expect(mergeWithSeedIfEmpty(existing, seed)).toEqual(existing);
  });

  it("returns seed when empty array", () => {
    expect(mergeWithSeedIfEmpty([], seed)).toEqual(seed);
  });
});
```

- [x] **Step 2: 运行测试 — Expected: FAIL（`mergeWithSeedIfEmpty` 未导出）**

```bash
cd /Users/wangjunjie/Documents/Work/Personal/tempo/app && pnpm exec jest scheduleStorage.test.ts --watchAll=false
```

- [x] **Step 3: 实现类型与 seed**

`app/modules/schedule/repo/types.ts`:

```ts
export type ScheduleTag = "design_review" | "workshop" | "brainstorm";

export interface ScheduleItem {
  id: string;
  title: string;
  tag: ScheduleTag;
  /** ISO 8601 */
  startAt: string;
  endAt: string;
  /** upcoming | finished */
  status: "upcoming" | "finished";
  attendeeCount: number;
  attendeeOverflow?: number;
}
```

`app/modules/schedule/repo/seed.ts`:

```ts
import type { ScheduleItem } from "./types";

export const SCHEDULE_SEED_EN: ScheduleItem[] = [
  {
    id: "1",
    title: "Project Design Discussion",
    tag: "design_review",
    startAt: "2024-12-03T09:00:00.000Z",
    endAt: "2024-12-03T09:45:00.000Z",
    status: "upcoming",
    attendeeCount: 3,
    attendeeOverflow: 6,
  },
  {
    id: "2",
    title: "Leadership Training 101",
    tag: "workshop",
    startAt: "2024-12-03T10:00:00.000Z",
    endAt: "2024-12-03T11:30:00.000Z",
    status: "finished",
    attendeeCount: 3,
    attendeeOverflow: 6,
  },
];
```

`app/modules/schedule/repo/scheduleStorage.ts`:

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ScheduleItem } from "./types";
import { SCHEDULE_SEED_EN } from "./seed";

export const SCHEDULE_STORAGE_KEY = "tempo.schedule.v1";

export function mergeWithSeedIfEmpty(existing: ScheduleItem[], seed: ScheduleItem[]): ScheduleItem[] {
  if (existing.length > 0) return existing;
  return seed;
}

export async function loadScheduleItems(): Promise<ScheduleItem[]> {
  const raw = await AsyncStorage.getItem(SCHEDULE_STORAGE_KEY);
  const parsed: ScheduleItem[] = raw ? JSON.parse(raw) : [];
  const merged = mergeWithSeedIfEmpty(parsed, SCHEDULE_SEED_EN);
  if (parsed.length === 0 && merged.length > 0) {
    await saveScheduleItems(merged);
  }
  return merged;
}

export async function saveScheduleItems(items: ScheduleItem[]): Promise<void> {
  await AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(items));
}
```

- [x] **Step 4: 再跑测试 — Expected: PASS**

```bash
pnpm exec jest scheduleStorage.test.ts --watchAll=false
```

- [x] **Step 5: `ScheduleRepository.ts` 门面**

```ts
import type { ScheduleItem } from "./types";
import { loadScheduleItems } from "./scheduleStorage";

function sameLocalDay(iso: string, anchor: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === anchor.getFullYear() &&
    d.getMonth() === anchor.getMonth() &&
    d.getDate() === anchor.getDate()
  );
}

export function createScheduleRepository() {
  return {
    async getAll(): Promise<ScheduleItem[]> {
      return loadScheduleItems();
    },
    async listByDay(day: Date): Promise<ScheduleItem[]> {
      const all = await loadScheduleItems();
      return all.filter((i) => i.status === "upcoming" && sameLocalDay(i.startAt, day));
    },
    async listFinished(): Promise<ScheduleItem[]> {
      const all = await loadScheduleItems();
      return all.filter((i) => i.status === "finished");
    },
  };
}

export type ScheduleRepository = ReturnType<typeof createScheduleRepository>;
```

- [x] **Step 6: Commit**

```bash
git add app/modules/schedule/repo
git commit -m "feat(app): add schedule local storage and repository"
```

（若日后抽取通用 JSON 读写，再新增 `app/core/storage/asyncJson.ts`。）

---

### Task 6: Schedule Stack 导航

**Files:**

- Create: `app/modules/schedule/navigation/ScheduleStackNavigator.tsx`
- Modify: `app/core/navigation/routes.ts`
- Modify: `app/core/navigation/types.ts`
- Modify: `app/core/navigation/MainTabNavigator.tsx`
- Modify: `app/modules/schedule/screens/ScheduleHomeScreen.tsx`（从旧路径迁入，见 Task 7）

- [x] **Step 1: 增加路由常量 `app/core/navigation/routes.ts`**

```ts
export const SCHEDULE_STACK = {
  ScheduleHome: "ScheduleHome",
  NotificationInbox: "NotificationInbox",
} as const;
```

（文件内 `MAIN_TAB` 等保持不变。）

- [x] **Step 2: 更新 `app/core/navigation/types.ts`（完整替换为下文，保留与现有 `Root` / `Auth` 一致）**

```ts
import type { NavigatorScreenParams } from "@react-navigation/native";
import { AUTH_STACK, MAIN_TAB, ROOT_STACK, SCHEDULE_STACK, USER_STACK } from "./routes";

export type ScheduleStackParamList = {
  [SCHEDULE_STACK.ScheduleHome]: undefined;
  [SCHEDULE_STACK.NotificationInbox]: undefined;
};

export type UserStackParamList = {
  [USER_STACK.UserHome]: undefined;
  [USER_STACK.UserWebTest]: undefined;
};

export type MainTabParamList = {
  [MAIN_TAB.Schedule]: NavigatorScreenParams<ScheduleStackParamList>;
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

- [x] **Step 3: 创建 `app/modules/schedule/navigation/ScheduleStackNavigator.tsx`**

（自 `app/modules/schedule/navigation/` 到 `core` 为 **三截** `../../../core`.）

```tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SCHEDULE_STACK } from "../../../core/navigation/routes";
import type { ScheduleStackParamList } from "../../../core/navigation/types";
import ScheduleHomeScreen from "../screens/ScheduleHomeScreen";
import NotificationInboxScreen from "../screens/NotificationInboxScreen";

const Stack = createNativeStackNavigator<ScheduleStackParamList>();

export function ScheduleStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={SCHEDULE_STACK.ScheduleHome} component={ScheduleHomeScreen} />
      <Stack.Screen
        name={SCHEDULE_STACK.NotificationInbox}
        component={NotificationInboxScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
```

- [x] **Step 4: `MainTabNavigator.tsx` 将 Schedule 替换为 Stack**

```tsx
import { ScheduleStackNavigator } from "../../modules/schedule/navigation/ScheduleStackNavigator";

// ...
<Tab.Screen
  name={MAIN_TAB.Schedule}
  component={ScheduleStackNavigator}
  options={{ tabBarLabel: "日程", headerTitle: "日程" }}
/>
```

（`tabBarLabel` 后续可改 `useTranslation`；首版可保留中文或同步改 i18n。）

- [x] **Step 5: Typecheck**

```bash
cd /Users/wangjunjie/Documents/Work/Personal/tempo/app && pnpm exec tsc --noEmit
```

**Expected:** 无错（若 Screen 尚未创建会报错 — **顺序上应先 Task 7 最小 Screen 占位**，或本步先用空组件占位）。实施时可 **先创建 Task 7 的占位 Screen** 再跑 `tsc`。

- [x] **Step 6: Commit**

```bash
git add app/core/navigation app/modules/schedule/navigation
git commit -m "feat(app): nest schedule native stack under tab"
```

---

### Task 7: 日程屏幕与组件（MVP 拼合）

**Files:**

- Create: `app/modules/schedule/screens/ScheduleHomeScreen.tsx`
- Create: `app/modules/schedule/screens/NotificationInboxScreen.tsx`（可与 Task 8 合并）
- Create: `app/modules/schedule/components/*`（见下）
- Delete: `app/modules/schedule/ScheduleHomeScreen.tsx`（若仍存在则删除并修正所有 import）

- [x] **Step 1: 实现 `ScheduleHomeScreen` — 头部 + `DateStrip` + `FlatList` 分区**

要点：

- `useTempoTheme()` 取色；`useTranslation(['schedule'])`；
- 铃铛 `Pressable` → `navigation.navigate(SCHEDULE_STACK.NotificationInbox)`；
- `useState` 选中日期；`useScheduleData`（自建 hook）调用 `createScheduleRepository()`；
- 卡片 `onPress` → `Snackbar.visible` 显示 `t('schedule:detailSoon')`；
- `LayoutAnimation` 或 `Pressable` 的 `style={({ pressed}) => ({ opacity: pressed ? 0.92 : 1 })}` 作微交互。

（具体 JSX 较长，实施时代码评审遵循 Figma 与 `semantic` 间距。）

- [x] **Step 2: `DateStrip.tsx`**

- 生成当前周 7 天；选中项 `borderColor: theme.brand`；
- 横向 `ScrollView`；`contentContainerStyle` padding 与稿一致。

- [x] **Step 3: `ScheduleCard.tsx` + `ScheduleTagBadge.tsx`**

- 禁止 Paper Card；自绘 `View` 圆角 `theme.radius.md`；
- Tag 映射 `design_review` → Design Review 等英文（文案可走 i18n 或写死在 `en`）。

- [x] **Step 4: Commit（大块可拆两次 commit：components / screen）**

```bash
git add app/modules/schedule
git commit -m "feat(app): schedule home UI with local data and snackbar"
```

---

### Task 8: 通知收件箱（Paper + Segment）

**Files:**

- `app/modules/schedule/screens/NotificationInboxScreen.tsx`
- `app/modules/schedule/components/NotificationEmptyState.tsx`
- `app/modules/schedule/hooks/useNotificationFeed.ts`

- [x] **Step 1: `NotificationInboxScreen` 使用 `Appbar.Header` + `Appbar.BackAction`**

- `navigation.goBack()`；
- `SegmentedButtons`（`react-native-paper`）两值：`activity` | `system`，对应 i18n `segmentActivity` / `segmentSystem`；
- 列表：`List.Section` + `List.Item` + `Divider`；
- Mock 数据：`useNotificationFeed(segment)` 返回数组；空数组渲染 `NotificationEmptyState`。

- [x] **Step 2: 空状态组件**

- SVG 插图或简化矢量圆+图标；英文标题/副标题走 `notifications` 命名空间。

- [x] **Step 3: Commit**

```bash
git add app/modules/schedule/screens/NotificationInboxScreen.tsx app/modules/schedule/components/NotificationEmptyState.tsx
git commit -m "feat(app): notification inbox with Paper and segments"
```

---

### Task 9: 微交互与还原度抛光

**Files:**

- Modify: `app/modules/schedule/components/DateStrip.tsx`
- Modify: `app/modules/schedule/components/ScheduleCard.tsx`

- [x] **Step 1: 日期切换** — `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` 于选中变更时（Android 需 `UIManager.setLayoutAnimationEnabledExperimental` 一次性开启）。

- [x] **Step 2: 卡片** — 轻 `scale` 可用手写 `Animated` 或维持 `opacity` 按压；**不引入 Reanimated** 除非 Step 1 不足。

- [x] **Step 3: 对照 Figma** — MCP `get_design_context` 拉 `8111:3433`、`8204:3164`、`8111:3850`、`8111:3912`、`8111:3945` 核对间距与字号。

- [x] **Step 4: Commit**

```bash
git commit -am "polish(app): schedule micro-interactions and spacing"
```

---

### Task 10: 可选链接与文档

**Files:**

- Modify: `app/core/navigation/linking.ts`

- [x] **Step 1: 增加 path（若 `MainTab` linking 已支持嵌套）**

```ts
schedule: {
  path: "schedule",
  screens: {
    ScheduleHome: "",
    NotificationInbox: "notifications",
  },
},
```

（具体键名须与 `routes.ts`、react-navigation **config** 一致；若与现有 `LINK_PATHS` 冲突则调整。）

- [x] **Step 2: README 一句** — 在仓库 `README.md` 或 `app/README` 增加「日程数据存 AsyncStorage key `tempo.schedule.v1`」（可选，**仅当团队需要**）。

- [x] **Step 3: Commit**

```bash
git commit -am "docs(app): deep link for schedule notifications"
```

---

## Spec coverage（自检）

| Spec 章节 | 对应 Task |
|-----------|-----------|
| 设计令牌 light | Task 2 |
| Manrope | Task 4 |
| Paper 边界 | Task 2、8 |
| i18n 默认 en | Task 3 |
| 本地存储 + Mock | Task 5 |
| Schedule Stack + 通知 Segment | Task 6、8 |
| 日程 UI 自绘 | Task 7 |
| Snackbar 敬请期待 | Task 7 |
| 空状态 | Task 8 |
| 微交互 | Task 9 |
| linking 可选 | Task 10 |

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-02-schedule-rn-implementation.md`. Two execution options:**

1. **Subagent-Driven（推荐）** — 每个 Task 派生子代理，Task 间人工 Review，迭代快。  
2. **Inline Execution** — 本会话用 executing-plans 按检查点批量执行。

**你想用哪一种？**

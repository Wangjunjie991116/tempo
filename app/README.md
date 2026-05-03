# Tempo App（轻程 · Expo）

基于 **Expo SDK 54** 的 React Native 客户端：底部 Tab 含 **日程 / 财务 / 用户**，日程栈内含列表与通知收件箱；**独立 `modules/ai`** 悬浮语音入口由 **`MainTabNavigator`** 宿主挂载（与日程等业务解耦）。**主题与 Manrope 字体**、`i18next` 文案、`AsyncStorage` 日程仓储、**WebView** 加载本地/Vite 前端（配置见 `core/config`）。开发时使用仓库根目录 `pnpm dev:app` 或在 `app/` 下 `pnpm start`。

---

## 目录与文件概要

说明：`| 文件 |` 后为 **20 字以内**中文概要（尽量 **≤10 字**）。

```
app/
├── package.json              # 依赖与脚本
├── app.json                  # Expo 静态清单
├── app.config.ts             # Expo 动态配置
├── tsconfig.json             # TypeScript 选项
├── jest.config.js            # Jest 单测配置
├── index.ts                  # Expo 入口注册
├── App.tsx                   # 应用根组件
├── .gitignore                # Git 忽略规则
├── assets/
│   ├── tempo-icon.png        # 应用图标
│   ├── splash-icon.png       # 闪屏图
│   ├── icon.png              # 通用图标
│   ├── adaptive-icon.png     # Android 自适应图标
│   └── favicon.png           # Web favicon
├── languages/
│   ├── en.json               # 应用英文名等元数据
│   └── zh-Hans.json          # 应用中文名等元数据
├── core/
│   ├── config/
│   │   └── tempoWebConfig.ts # Web API 解析
│   ├── i18n/
│   │   ├── config.ts         # i18next 初始化
│   │   ├── index.ts          # i18n 模块导出
│   │   └── locales/en/
│   │       ├── ai.json       # AI 助手文案命名空间
│   │       ├── common.json   # 通用文案键值
│   │       ├── schedule.json # 日程文案键值
│   │       └── notifications.json # 通知文案
│   │   └── locales/zh/       # 与 en 同结构的 zh 资源（含 ai.json）
│   ├── navigation/
│   │   ├── routes.ts         # 路由名字符串常量
│   │   ├── types.ts          # 导航 ParamList 类型
│   │   ├── linking.ts        # 深度链接配置
│   │   ├── navigationRef.ts  # 根容器导航引用
│   │   ├── RootNavigator.tsx # 根路由容器
│   │   ├── AuthNavigator.tsx # 登录栈
│   │   ├── AuthNavigationSync.tsx # 会话驱动跳转
│   │   ├── MainTabNavigator.tsx # 底部 Tab + 全局 AI 浮层宿主
│   │   ├── icons/
│   │   │   └── TabBarIcons.tsx # Tab 日程/资产/我
│   │   └── index.ts          # 导航模块导出
│   ├── session/
│   │   ├── SessionContext.tsx # 登录态 Context
│   │   └── index.ts          # session 导出
│   ├── theme/
│   │   ├── tokens.ts         # 设计原始 token
│   │   ├── semantic.ts       # 语义色与间距
│   │   ├── paperTheme.ts     # Paper MD3 主题
│   │   ├── TempoThemeProvider.tsx # 主题 Provider
│   │   └── index.ts          # 主题模块导出
│   └── ui/
│       └── layoutAnimation.ts # 列表布局过渡动画
├── modules/
│   ├── ai/
│   │   ├── index.ts          # AI 模块聚合导出
│   │   └── components/
│   │       └── AiFloatingAssistant.tsx # 悬浮机器人与语音对话面板
│   ├── splash/
│   │   └── SplashScreen.tsx # 启动闪屏页
│   ├── login/
│   │   └── LoginScreen.tsx   # 登录占位页
│   ├── finance/
│   │   └── FinanceHomeScreen.tsx # 财务 Tab 占位
│   ├── user/
│   │   ├── UserHomeScreen.tsx # 用户 Tab 主页占位
│   │   └── WebTestScreen.tsx # WebView 联调页
│   └── schedule/
│       ├── navigation/
│       │   └── ScheduleStackNavigator.tsx # 日程栈路由
│       ├── screens/
│       │   ├── ScheduleHomeScreen.tsx # 日程首页横滑按日
│       │   └── NotificationInboxScreen.tsx # 通知收件箱
│       ├── components/
│       │   ├── DateStrip.tsx             # 横向日期条
│       │   ├── ScheduleDayPage.tsx       # 单日竖向列表
│       │   ├── ScheduleTimelineRail.tsx  # 左侧时间轴（卡片列外）
│       │   ├── ScheduleCard.tsx          # 日程卡片单元
│       │   ├── ScheduleSectionHeader.tsx # 分区标题行
│       │   ├── NotificationEmptyState.tsx # 通知分段空状态
│       │   └── icons/
│       │       ├── BellIcon.tsx          # 铃铛图标
│       │       ├── CalendarDotsIcon.tsx  # 卡片 CalendarDots 矢量
│       │       ├── TimelineFinishedGlyph.tsx # 时间轴完成 CheckCircle
│       │       └── ChevronRightIcon.tsx  # 右箭头图标
│       ├── hooks/
│       │   ├── useScheduleAllItems.ts    # 加载全量日程
│       │   ├── useScheduleData.ts        # 按选中曰加载
│       │   └── useNotificationFeed.ts    # 通知列表Mock
│       ├── utils/
│       │   ├── calendarRange.ts          # 日历区间与日键
│       │   └── formatScheduleCardTimeRange.ts # 卡片时段文案格式
│       └── repo/
│           ├── types.ts                  # ScheduleItem 模型
│           ├── seed.ts                   # 内置演示 JSON
│           ├── scheduleStorage.ts        # 本地存储读写
│           ├── schedulePartition.ts      # 按本地日分区
│           ├── ScheduleRepository.ts     # 仓储工厂
│           └── __tests__/
│               ├── schedulePartition.test.ts # 分区逻辑单测
│               ├── scheduleStorage.load.test.ts # 存储单测
│               └── scheduleStorage.test.ts # 种子结构单测
```

---

## 常用命令

在 **`app/`** 目录：

- `pnpm start` — 启动 Expo Dev Tools
- `pnpm run ios`、`pnpm run android`、`pnpm run web`
- **`pnpm run prebuild`** → **`pnpm run ios:run` / `android:run`** — 如需本机构建含 `@react-native-voice/voice` 的原生客户端（详见下节）；日常仅改 JS 可继续配合 `pnpm start`
- `pnpm test` — 运行 Jest（日程仓储相关）

依赖版本请优先使用 **`pnpm exec expo install <包名>`**，与 Expo SDK 对齐。

---

## 语音识别与原生客户端

悬浮助手依赖 **`@react-native-voice/voice`**。**标准 Expo Go 不包含该原生模块**；要使用语音能力，需在 **`app/`** 执行 `pnpm run prebuild` 后用 `pnpm run ios:run` 或 `pnpm run android:run`（或 Xcode / Android Studio 打开生成的工程）。本机 CocoaPods / 证书环境问题需自行在当前开发环境排解。

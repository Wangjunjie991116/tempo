# App 日程本地存储与 Mock 展示链路

## 1. AsyncStorage 里有哪些键

| 键 | 用途 |
|----|------|
| **`tempo.schedule.v3`** | 当前唯一数据源：`ScheduleItem[]` 的 JSON 数组（Release / Dev 共用桶名）。 |
| `tempo.schedule.v1` / `tempo.schedule.v2` | 历史版本；开发启动 bootstrap 时会删掉（`removeItem` 并行清除），避免读到旧数据。 |
| `tempo.schedule.devBootstrapVersion` | **仅 __DEV__**：标记「是否已做过一次性清空」；升级该字符串可再次强制清空。 |

## 2. 从存储到页面的数据流

```text
ScheduleHomeScreen
  └─ useScheduleData(selectedDay)
        └─ createScheduleRepository().listByDay(day)      → upcoming（startAt 落在选中「本地日」）
        └─ createScheduleRepository().listFinishedByDay(day) → finished（endAt 落在该日；无 endAt 则用 startAt）
              └─ loadScheduleItems()
                    ├─ [__DEV__ 首次] ensureDevScheduleBootstrap()
                    │     └─ 并行 removeItem(v1, v2, v3) + 写入 bootstrap 版本标记
                    ├─ AsyncStorage.getItem("tempo.schedule.v3")
                    ├─ [__DEV__ 或 EXPO_PUBLIC_SCHEDULE_DEV_SEED=1]
                    │     └─ mergeDevSeedIntoParsed：去掉 id 以 seed- 开头的旧 Mock，再追加当日 buildScheduleSeed()
                    └─ 返回合并后的数组
```

列表 **不会** 直接渲染整个数组：只渲染 **选中那一天** 过滤后的 `upcoming` / `finished`。Mock 的 6 条必须在 **「今天」本地日历日** 上才有时间字段，否则会全部被过滤掉。

## 3. 页面上看不到 Mock 的常见原因

1. **不是开发注入模式**：Release 且未设置 `EXPO_PUBLIC_SCHEDULE_DEV_SEED=1` 时，**不会**合并 seed，数组为空则列表为空（符合产品规格）。  
2. **选中日期不是「今天」**：种子锚定 **设备当前本地日**；若日期条选到了别的天，那一天可能没有条目。  
3. **旧数据占用桶**：在 bootstrap 之前，若 `v2`/`v3` 里已有不含当日数据的条目，可能被误以为「有数据」却不显示；现已通过 **dev bootstrap 一次性清空** + **仅合并 seed-*** 减轻问题。  
4. **模拟器/真机系统日期**不是你以为的那一天（例如改了系统时间）。  
5. **缓存的旧 JS Bundle**：改存储逻辑后需重装 App 或 **`expo start --clear`**，确保跑到最新代码。

## 4. Expo Go（系统日期已正确，例如 2026-05-02）

- 连 **Metro 开发服务器** 时一般为 **`__DEV__ === true`**，会走开发 bootstrap + Mock；与是否「真机日期正确」独立，日期只影响 **seed 锚定哪一天**。  
- **仍看不到数据时**：  
  1. 终端执行 **`pnpm --filter app start:clear`**（或 `expo start --clear`），Expo Go 里 **Reload**。  
  2. **完全杀掉 Expo Go** 再重新扫码打开本项目（避免旧 JS 实例）。  
  3. 仍不行：在手机系统设置里 **清除 Expo Go 应用数据**（会清空 Expo Go 内所有项目的 AsyncStorage，慎用）。  
  4. 代码侧已 bump **`DEV_SCHEDULE_BOOTSTRAP_VERSION`** 时，下一次冷启动会在 __DEV__ 下再次删掉 `v1/v2/v3` 并重灌 Mock。

---

## 5. 强制再清空一次（开发）

把 `app/modules/schedule/repo/scheduleStorage.ts` 里的常量 **`DEV_SCHEDULE_BOOTSTRAP_VERSION`** 改一个新字符串（例如加个后缀），保存后冷启动 App；**仅 __DEV__** 下会再次并行清空上述日程键并重新写入 Mock。

---

## 6. 在 Expo Go 里查看「本地有没有存上」（AsyncStorage）

AsyncStorage **没有**内置可视化界面，可用下面几种方式：

### 6.1 看 Metro 终端日志（推荐，仓库已接入）

1. 电脑上 **`pnpm dev:app` / `expo start`**，保持该终端在前台。  
2. 手机 **Expo Go** 打开本项目，进入 **日程** Tab（会触发 `loadScheduleItems`）。  
3. 在该终端里搜索 **`[Tempo][schedule-storage]`**。  
4. 典型输出：  
   - `mergeSeed=true/false`、`bootstrapMarker=…`  
   - `matching keys (…): tempo.schedule.v3, tempo.schedule.devBootstrapVersion, …`  
   - **`tempo.schedule.v3 => array length=6`** 表示桶里已有 6 条记录。

若 **`array length=0`** 且 **`mergeSeed=false`**：当前未走开发注入（需查为何 `__DEV__` 为 false）。  
若 **`length=6`** 但页面仍空：问题多在 **按选中曰过滤** 或 UI，而不是没写入存储。

### 6.2 临时手写一行调试

在 **`__DEV__`** 下的 `useEffect` 中：

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.includes("tempo.schedule"));
console.log("tempo.schedule keys", keys, await AsyncStorage.multiGet(keys));
```

日志同样在 **Metro 终端**。

### 6.3 第三方工具（可选）

React Native Debugger、Flipper 等可查看 AsyncStorage；接 Expo Go 往往较繁琐，优先用 **§6.1**。

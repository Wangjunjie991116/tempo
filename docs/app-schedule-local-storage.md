# App 日程本地存储

## 1. 键名

| 键 | 用途 |
|----|------|
| **`tempo.schedule`** | 持久化 `ScheduleItem[]`（JSON 字符串）；唯一键。 |

## 2. 读写逻辑

1. **`loadScheduleItems()`**（`app/modules/schedule/repo/scheduleStorage.ts`）
2. **读取**：直接从 `tempo.schedule` 读取用户本地数据并解析为 `ScheduleItem[]`。若键不存在、解析失败或非法，返回空数组。
3. **`saveScheduleItems`**：覆盖写入当前键，持久化用户修改后的日程数据。
4. **并发控制**：`loadInflight` 保证同一会话内多次并发调用共享同一 Promise，避免交叉读写。

> **`startAt` / `endAt`** 在 JSON 中为 **Unix 毫秒（number）**；读库若遇到旧数据里的 **ISO 字符串**，`parseStoredItems` 会先转成毫秒再归一化为 `ScheduleItem`。

## 3. 与列表展示的关系

首页按 **选中「本地日历日」** 过滤（时刻均由毫秒戳转本地 `Date` 再取日历日）：

- **Upcoming**：`startAt` 落在选中日。
- **Finished**：`endAt > 0` 且落在选中日；否则视为未填结束时刻，按 **`startAt`** 所在日归档。

卡片副标题时段格式（无星期）：同日 `YYYY/M/D HH:mm - HH:mm`；跨日两侧均写完整日期（见 `formatScheduleCardTimeRange.ts`）。

## 4. Expo SDK 与 AsyncStorage 版本

日志若出现 **`AsyncStorageError: Native module is null, cannot access legacy storage`**：多为 **`@react-native-async-storage/async-storage` 3.x** 与当前 **Expo SDK 54 / Expo Go** 原生侧不匹配（v3 默认走 TurboModule / legacy 路径，未就绪时模块为 null）。

**处理方式：** 在 **`app/`** 目录执行 **`pnpm exec expo install @react-native-async-storage/async-storage`**，由 Expo 固定为与 SDK 一致的版本（当前为 **2.2.x**）。更新依赖后请 **`expo start --clear`** 并重新打开 App（若曾生成过原生工程，按需 **`expo run:ios` / `run:android`** 重装）。

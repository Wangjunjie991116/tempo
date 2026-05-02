# App 日程本地存储（内置默认 JSON）

## 1. 键名

| 键 | 用途 |
|----|------|
| **`tempo.schedule`** | 持久化 `ScheduleItem[]`（JSON 字符串）；唯一键。 |

## 2. 读写逻辑

1. **`loadScheduleItems()`**（`app/modules/schedule/repo/scheduleStorage.ts`）  
2. **每次 App 进程启动后第一次调用**：**不判断**库里是否已有数据，一律将 **`DEFAULT_SCHEDULE_ITEMS`**（`seed.ts`，固定 6 条，锚定 **2026-05-02 UTC**）**克隆后写入**上述键并返回（同时删除残留的旧键 **`tempo.schedule.v3`**）。  
3. **同一会话内后续调用**：读取上述键；若解析失败、非数组或长度为 0，则再次写入默认克隆并返回；否则返回当前数组。  
4. **`saveScheduleItems`**：覆盖写入当前键（本会话内仍会持久化；**下次冷启动**仍会被步骤 2 重置为默认数据）。

> **`startAt` / `endAt`** 在 JSON 中为 **Unix 毫秒（number）**；读库若遇到旧数据里的 **ISO 字符串**，`parseStoredItems` 会先转成毫秒再归一化为 `ScheduleItem`。

## 3. 与列表展示的关系

首页按 **选中「本地日历日」** 过滤（时刻均由毫秒戳转本地 `Date` 再取日历日）：

- **Upcoming**：`startAt` 落在选中日。  
- **Finished**：`endAt > 0` 且落在选中日；否则视为未填结束时刻，按 **`startAt`** 所在日归档。

卡片副标题时段格式（无星期）：同日 `YYYY/M/D HH:mm - HH:mm`；跨日两侧均写完整日期（见 `formatScheduleCardTimeRange.ts`）。

内置演示数据锚在 **2026-05-02（UTC 语义下的毫秒）**：若设备本地日不是该日，请在 **日期条** 滑到 **2026 年 5 月 2 日** 才能一次看到 4 条未完成 + 2 条已完成。

## 4. 修改默认数据

编辑 **`app/modules/schedule/repo/seed.ts`** 中的 **`DEFAULT_SCHEDULE_ITEMS`**。下次冷启动第一次加载日程时会自动写入新版本默认数据。

## 5. Expo SDK 与 AsyncStorage 版本

日志若出现 **`AsyncStorageError: Native module is null, cannot access legacy storage`**：多为 **`@react-native-async-storage/async-storage` 3.x** 与当前 **Expo SDK 54 / Expo Go** 原生侧不匹配（v3 默认走 TurboModule / legacy 路径，未就绪时模块为 null）。

**处理方式：** 在 **`app/`** 目录执行 **`pnpm exec expo install @react-native-async-storage/async-storage`**，由 Expo 固定为与 SDK 一致的版本（当前为 **2.2.x**）。更新依赖后请 **`expo start --clear`** 并重新打开 App（若曾生成过原生工程，按需 **`expo run:ios` / `run:android`** 重装）。

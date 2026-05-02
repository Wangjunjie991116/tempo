# App 日程本地存储（内置默认 JSON）

## 1. 键名

| 键 | 用途 |
|----|------|
| **`tempo.schedule.v3`** | 持久化 `ScheduleItem[]`（JSON 字符串）。 |

## 2. 读写逻辑

1. **`loadScheduleItems()`**（`app/modules/schedule/repo/scheduleStorage.ts`）读取上述键。  
2. 若 **不存在、解析失败或非数组、或数组长度为 0**：将代码内 **`DEFAULT_SCHEDULE_ITEMS`**（`seed.ts`，固定 6 条，锚定 **2026-05-02 UTC**）**克隆后写入** AsyncStorage，并返回该数组。  
3. 否则返回已存储数组（用户后续可通过仓储接口改写并由 **`saveScheduleItems`** 落盘）。

## 3. 与列表展示的关系

首页按 **选中「本地日历日」** 过滤：

- **Upcoming**：`startAt` 落在选中日。  
- **Finished**：`endAt` 落在选中日（无 `endAt` 则用 `startAt`）。

内置数据的 ISO 时间锚在 **2026-05-02**：若打开 App 当天不是这一天，请在 **日期条** 滑到 **2026 年 5 月 2 日** 才能一次看到 4 条未完成 + 2 条已完成。

## 4. 修改默认数据

编辑 **`app/modules/schedule/repo/seed.ts`** 中的 **`DEFAULT_SCHEDULE_ITEMS`**。若要强制重新写入默认数据，删除 App 数据或清空 AsyncStorage 中 **`tempo.schedule.v3`** 后重启。

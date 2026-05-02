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

## 4. 强制再清空一次（开发）

把 `app/modules/schedule/repo/scheduleStorage.ts` 里的常量 **`DEV_SCHEDULE_BOOTSTRAP_VERSION`** 改一个新字符串（例如加个后缀），保存后冷启动 App；**仅 __DEV__** 下会再次执行 `multiRemove` 清空上述日程键并重新写入 Mock。

/**
 * 需在导入 scheduleStorage 之前注册 mock。
 */
const memory: Record<string, string> = {};

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: (key: string) => Promise.resolve(memory[key] ?? null),
    setItem: (key: string, value: string) => {
      memory[key] = value;
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      delete memory[key];
      return Promise.resolve();
    },
  },
}));

function requireStorage(): typeof import("../scheduleStorage") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- resetModules 后需同步重新加载模块
  return require("../scheduleStorage");
}

describe("scheduleStorage load", () => {
  beforeEach(() => {
    jest.resetModules();
    Object.keys(memory).forEach((k) => {
      delete memory[k];
    });
  });

  it("returns empty array when key is missing", async () => {
    const { loadScheduleItems } = requireStorage();
    const items = await loadScheduleItems();
    expect(items).toHaveLength(0);
  });

  it("reads existing stored payload", async () => {
    const { loadScheduleItems, SCHEDULE_STORAGE_KEY } = requireStorage();
    const stored = [
      {
        id: "1",
        title: "Existing Meeting",
        tag: "workshop",
        startAt: Date.parse("2026-05-04T09:00:00.000Z"),
        endAt: Date.parse("2026-05-04T10:00:00.000Z"),
        status: "upcoming",
        attendeeCount: 3,
      },
    ];
    memory[SCHEDULE_STORAGE_KEY] = JSON.stringify(stored);
    const items = await loadScheduleItems();
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Existing Meeting");
  });

  it("second load in same process reads storage (e.g. after saveScheduleItems)", async () => {
    const { loadScheduleItems, saveScheduleItems } = requireStorage();
    await saveScheduleItems([
      {
        id: "1",
        title: "Saved Item",
        tag: "brainstorm",
        startAt: Date.now(),
        endAt: 0,
        status: "upcoming",
        attendeeCount: 1,
      },
    ]);
    const second = await loadScheduleItems();
    expect(second).toHaveLength(1);
    expect(second[0].title).toBe("Saved Item");
  });

  it("concurrent loads share one promise", async () => {
    const { loadScheduleItems, saveScheduleItems } = requireStorage();
    await saveScheduleItems([
      {
        id: "1",
        title: "Concurrent",
        tag: "design_review",
        startAt: Date.now(),
        endAt: 0,
        status: "upcoming",
        attendeeCount: 2,
      },
    ]);
    const [a, b] = await Promise.all([loadScheduleItems(), loadScheduleItems()]);
    expect(a.length).toBe(1);
    expect(b.length).toBe(1);
    expect(a[0].title).toBe("Concurrent");
  });

  it("saveScheduleItems uses canonical key", async () => {
    const { saveScheduleItems, SCHEDULE_STORAGE_KEY } = requireStorage();
    await saveScheduleItems([]);
    expect(memory[SCHEDULE_STORAGE_KEY]).toBe("[]");
  });
});

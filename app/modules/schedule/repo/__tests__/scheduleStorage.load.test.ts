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

import { DEFAULT_SCHEDULE_ITEMS } from "../seed";

function requireStorage(): typeof import("../scheduleStorage") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- resetModules 后需同步重新加载模块
  return require("../scheduleStorage");
}

describe("scheduleStorage load + startup overwrite", () => {
  beforeEach(() => {
    jest.resetModules();
    Object.keys(memory).forEach((k) => {
      delete memory[k];
    });
  });

  it("on first load writes DEFAULT_SCHEDULE_ITEMS even when key missing", async () => {
    const { loadScheduleItems, SCHEDULE_STORAGE_KEY } = requireStorage();
    const items = await loadScheduleItems();
    expect(items).toHaveLength(DEFAULT_SCHEDULE_ITEMS.length);
    expect(JSON.parse(memory[SCHEDULE_STORAGE_KEY])).toHaveLength(DEFAULT_SCHEDULE_ITEMS.length);
  });

  it("on first load overwrites existing stored payload with defaults", async () => {
    const { loadScheduleItems, SCHEDULE_STORAGE_KEY } = requireStorage();
    memory[SCHEDULE_STORAGE_KEY] = JSON.stringify([DEFAULT_SCHEDULE_ITEMS[0]]);
    const items = await loadScheduleItems();
    expect(items).toHaveLength(DEFAULT_SCHEDULE_ITEMS.length);
    expect(JSON.parse(memory[SCHEDULE_STORAGE_KEY])).toHaveLength(DEFAULT_SCHEDULE_ITEMS.length);
  });

  it("removes legacy v3 key on first load", async () => {
    const { loadScheduleItems } = requireStorage();
    const legacyKey = "tempo.schedule.v3";
    memory[legacyKey] = JSON.stringify([DEFAULT_SCHEDULE_ITEMS[0]]);
    await loadScheduleItems();
    expect(memory[legacyKey]).toBeUndefined();
  });

  it("second load in same process reads storage (e.g. after saveScheduleItems)", async () => {
    const { loadScheduleItems, saveScheduleItems } = requireStorage();
    await loadScheduleItems();
    await saveScheduleItems([DEFAULT_SCHEDULE_ITEMS[0]]);
    const second = await loadScheduleItems();
    expect(second).toHaveLength(1);
  });

  it("concurrent first loads share one promise and yield defaults", async () => {
    const { loadScheduleItems, SCHEDULE_STORAGE_KEY } = requireStorage();
    const [a, b] = await Promise.all([loadScheduleItems(), loadScheduleItems()]);
    expect(a.length).toBe(DEFAULT_SCHEDULE_ITEMS.length);
    expect(b.length).toBe(DEFAULT_SCHEDULE_ITEMS.length);
    expect(JSON.parse(memory[SCHEDULE_STORAGE_KEY])).toHaveLength(DEFAULT_SCHEDULE_ITEMS.length);
  });

  it("saveScheduleItems uses canonical key", async () => {
    const { saveScheduleItems, SCHEDULE_STORAGE_KEY } = requireStorage();
    await saveScheduleItems([]);
    expect(memory[SCHEDULE_STORAGE_KEY]).toBe("[]");
  });
});

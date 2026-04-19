import { describe, it, expect } from "vitest";
import { getDate, getMonday, SPORTS } from "./useTraining";

describe("useTraining utilities", () => {
  describe("getDate", () => {
    it("returns today's date with offset 0", () => {
      const today = new Date().toISOString().split("T")[0];
      expect(getDate(0)).toBe(today);
    });

    it("returns tomorrow's date with offset 1", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(getDate(1)).toBe(tomorrow.toISOString().split("T")[0]);
    });

    it("returns yesterday's date with offset -1", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(getDate(-1)).toBe(yesterday.toISOString().split("T")[0]);
    });

    it("returns date in YYYY-MM-DD format", () => {
      const result = getDate(0);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("getMonday", () => {
    it("returns date in YYYY-MM-DD format", () => {
      const result = getMonday();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("returns a Monday", () => {
      const monday = getMonday();
      const [y, m, d] = monday.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      expect(date.getDay()).toBe(1);
    });
  });

  describe("SPORTS", () => {
    it("maps sport keys to German labels", () => {
      expect(SPORTS.running).toBe("LAUFEN");
      expect(SPORTS.cycling).toBe("RADFAHREN");
      expect(SPORTS.swimming).toBe("SCHWIMMEN");
      expect(SPORTS.rest).toBe("PAUSE");
    });
  });
});

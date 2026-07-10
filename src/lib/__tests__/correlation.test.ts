import { describe, expect, it } from "vitest";
import { correlation, dailyReturnsByDate } from "../correlation";
import { getDemoSeries } from "../demo/series";

function seriesMap(values: number[]): Map<string, number> {
  const m = new Map<string, number>();
  values.forEach((v, i) => m.set(`2025-${String(Math.floor(i / 28) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`, v));
  return m;
}

describe("correlation", () => {
  it("serie identiche → 1", () => {
    const v = Array.from({ length: 120 }, (_, i) => Math.sin(i) + 0.01 * i);
    expect(correlation(seriesMap(v), seriesMap(v))).toBeCloseTo(1);
  });
  it("serie opposte → -1", () => {
    const v = Array.from({ length: 120 }, (_, i) => Math.sin(i) + 0.01 * i);
    expect(correlation(seriesMap(v), seriesMap(v.map((x) => -x)))).toBeCloseTo(-1);
  });
  it("dati insufficienti → null", () => {
    expect(correlation(seriesMap([1, 2, 3]), seriesMap([1, 2, 3]))).toBeNull();
  });
});

describe("correlazioni demo (modello a fattori)", () => {
  const rets = (s: string) => dailyReturnsByDate(getDemoSeries(s)!.bars);
  it("i semiconduttori sono più correlati tra loro che con i difensivi", () => {
    const semis = correlation(rets("NVDA"), rets("AVGO"))!;
    const cross = correlation(rets("NVDA"), rets("KO"))!;
    expect(semis).toBeGreaterThan(0.3);
    expect(semis).toBeGreaterThan(cross + 0.15);
  });
});

import { describe, expect, it } from "vitest";
import {
  annualizedReturn, maxDrawdown, rsi, seriesCagr, sma, trailingReturn,
} from "../indicators";
import type { PriceBar } from "../types";

function bars(closes: number[]): PriceBar[] {
  return closes.map((c, i) => ({
    date: new Date(Date.UTC(2020, 0, 1 + i)).toISOString().slice(0, 10),
    open: c, high: c, low: c, close: c, volume: 1000,
  }));
}

describe("sma", () => {
  it("calcola la media sulla finestra e null prima", () => {
    const out = sma([1, 2, 3, 4, 5], 3);
    expect(out[0]).toBeNull();
    expect(out[1]).toBeNull();
    expect(out[2]).toBeCloseTo(2);
    expect(out[4]).toBeCloseTo(4);
  });
});

describe("rsi", () => {
  it("resta tra 0 e 100 ed è alto in un trend rialzista", () => {
    const closes = Array.from({ length: 60 }, (_, i) => 100 + i);
    const out = rsi(closes);
    const last = out[out.length - 1]!;
    expect(last).toBeGreaterThan(70);
    expect(last).toBeLessThanOrEqual(100);
  });
  it("restituisce null con dati insufficienti", () => {
    expect(rsi([1, 2, 3]).every((v) => v == null)).toBe(true);
  });
});

describe("trailingReturn", () => {
  it("calcola il rendimento percentuale", () => {
    expect(trailingReturn(bars([100, 110]), 1)).toBeCloseTo(10);
  });
  it("null se la storia non basta", () => {
    expect(trailingReturn(bars([100]), 5)).toBeNull();
  });
});

describe("maxDrawdown", () => {
  it("trova il drawdown massimo e il recupero", () => {
    const closes = [
      ...Array.from({ length: 30 }, () => 100),
      ...Array.from({ length: 10 }, () => 50),   // -50%
      ...Array.from({ length: 10 }, () => 120),  // recupero
    ];
    const dd = maxDrawdown(bars(closes))!;
    expect(dd.maxDrawdownPct).toBeCloseTo(-50);
    expect(dd.recoveryMonths).not.toBeNull();
  });
});

describe("seriesCagr", () => {
  it("calcola la crescita composta", () => {
    // 100 -> 121 in 2 passi = 10% annuo
    expect(seriesCagr([100, 110, 121])).toBeCloseTo(10, 1);
  });
  it("null con valori non positivi", () => {
    expect(seriesCagr([-5, 100])).toBeNull();
  });
});

describe("annualizedReturn", () => {
  it("annualizza correttamente", () => {
    const closes = Array.from({ length: 253 }, (_, i) => 100 * Math.pow(1.2, i / 252));
    expect(annualizedReturn(bars(closes), 1)).toBeCloseTo(20, 0);
  });
});

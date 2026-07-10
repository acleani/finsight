import { describe, expect, it } from "vitest";
import { computeScores, profileWeights, scoreHealth, verdictLabel } from "../scoring";
import { FUNDAMENTALS } from "../demo/companies";
import { getDemoSeries } from "../demo/series";

describe("scoreHealth", () => {
  it("con fondamentali completi copre tutto il peso", () => {
    const bd = scoreHealth(FUNDAMENTALS.AAPL);
    expect(bd.score).toBeGreaterThan(0);
    expect(bd.coverage).toBe(1);
    expect(bd.missing).toHaveLength(0);
  });
  it("i dati mancanti non valgono zero: peso ridistribuito e dichiarato", () => {
    const bd = scoreHealth(FUNDAMENTALS["ISP.MI"]); // banca: niente EBITDA/coverage
    expect(bd.missing.length).toBeGreaterThan(0);
    expect(bd.coverage).toBeLessThan(1);
    expect(bd.score).not.toBeNull(); // calcolato sui soli componenti disponibili
  });
  it("senza fondamentali il punteggio è null, non zero", () => {
    const bd = scoreHealth(null);
    expect(bd.score).toBeNull();
  });
});

describe("computeScores", () => {
  it("produce tutte le dimensioni e una confidenza 0-100", () => {
    const s = computeScores(FUNDAMENTALS.MSFT, getDemoSeries("MSFT")!.bars);
    for (const dim of [s.health, s.quality, s.growth, s.valuation, s.momentum, s.risk]) {
      expect(dim.score).toBeGreaterThanOrEqual(0);
      expect(dim.score).toBeLessThanOrEqual(100);
    }
    expect(s.dataConfidence).toBeGreaterThan(50);
    expect(s.overall.score).not.toBeNull();
  });
});

describe("profileWeights", () => {
  it("il profilo prudente pesa la solidità più della crescita", () => {
    const w = profileWeights({
      horizon: "long", riskTolerance: "conservative",
      markets: [], styles: [], excludedSectors: [],
    });
    expect(w.health).toBeGreaterThan(w.growth);
  });
  it("il profilo aggressivo pesa la crescita più della solidità", () => {
    const w = profileWeights({
      horizon: "short", riskTolerance: "aggressive",
      markets: [], styles: [], excludedSectors: [],
    });
    expect(w.growth).toBeGreaterThan(w.health);
  });
  it("i pesi sommano a 1", () => {
    const w = profileWeights(null);
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1);
  });
});

describe("verdictLabel", () => {
  it("mappa i punteggi alle etichette", () => {
    expect(verdictLabel(80)).toBe("Molto interessante");
    expect(verdictLabel(50)).toBe("Neutrale");
    expect(verdictLabel(10)).toBe("Alto rischio");
    expect(verdictLabel(null)).toBe("Dati insufficienti");
  });
});

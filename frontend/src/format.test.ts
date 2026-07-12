import { describe, expect, it } from "vitest";
import { fmtPL, fmtUSD } from "./format";

describe("fmtUSD", () => {
  it("formats a positive number with two decimals and a thousands separator", () => {
    expect(fmtUSD(1234.5)).toBe("$1,234.50");
  });

  it("formats zero", () => {
    expect(fmtUSD(0)).toBe("$0.00");
  });

  it("formats a negative number with a leading minus", () => {
    expect(fmtUSD(-42.1)).toBe("-$42.10");
  });

  it("treats non-finite values as zero", () => {
    expect(fmtUSD(NaN)).toBe("$0.00");
  });
});

describe("fmtPL", () => {
  it("prefixes a positive value with a plus sign", () => {
    expect(fmtPL(2304.9)).toBe("+$2,304.90");
  });

  it("prefixes zero with a plus sign", () => {
    expect(fmtPL(0)).toBe("+$0.00");
  });

  it("prefixes a negative value with a minus sign", () => {
    expect(fmtPL(-500)).toBe("-$500.00");
  });
});

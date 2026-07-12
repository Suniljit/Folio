import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatCards } from "./StatCards";

describe("StatCards", () => {
  it("renders formatted totals", () => {
    render(
      <StatCards totals={{ market_value: 6306.4, total_cost: 4001.5, unrealized_pl: 2304.9 }} />,
    );

    expect(screen.getByText("$6,306.40")).toBeInTheDocument();
    expect(screen.getByText("$4,001.50")).toBeInTheDocument();
    expect(screen.getByText("+$2,304.90")).toBeInTheDocument();
  });

  it("applies the positive style when P/L is non-negative", () => {
    render(render_props(0));
    expect(screen.getByText("+$0.00").className).toContain("positive");
  });

  it("applies the negative style when P/L is negative", () => {
    render(render_props(-1));
    expect(screen.getByText("-$1.00").className).toContain("negative");
  });
});

function render_props(unrealized_pl: number) {
  return <StatCards totals={{ market_value: 0, total_cost: 0, unrealized_pl }} />;
}

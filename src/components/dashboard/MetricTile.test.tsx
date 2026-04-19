import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricTile } from "./MetricTile";

describe("MetricTile", () => {
  it("renders label", () => {
    render(<MetricTile label="HRV" value={42} />);
    expect(screen.getByText("HRV")).toBeInTheDocument();
  });

  it("renders value", () => {
    render(<MetricTile label="HRV" value={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders unit when provided", () => {
    render(<MetricTile label="HRV" value={42} unit="ms" />);
    expect(screen.getByText("ms")).toBeInTheDocument();
  });

  it("does not render unit when not provided", () => {
    render(<MetricTile label="HRV" value={42} />);
    expect(screen.queryByText("ms")).not.toBeInTheDocument();
  });

  it("renders trend when provided", () => {
    render(
      <MetricTile label="HRV" value={42} trend="▲ 5%" trendColor="text-blue" />
    );
    expect(screen.getByText("▲ 5%")).toBeInTheDocument();
  });

  it("renders string values", () => {
    render(<MetricTile label="Score" value="—" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

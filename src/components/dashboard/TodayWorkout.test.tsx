import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { TodayWorkout } from "./TodayWorkout";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const renderDefault = (overrides?: Parameters<typeof TodayWorkout>[0]) =>
  render(<TodayWorkout sport="running" type="Easy Run" duration={45} {...overrides} />);

describe("TodayWorkout", () => {
  it("renders sport type in uppercase", () => {
    renderDefault();
    expect(screen.getByText("EASY RUN")).toBeInTheDocument();
  });

  it("renders duration", () => {
    renderDefault();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("MIN")).toBeInTheDocument();
  });

  it("renders sport icon", () => {
    const { container } = renderDefault();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders intensity zone when provided", () => {
    render(<TodayWorkout sport="running" type="Easy Run" duration={45} intensityZone={2} />);
    expect(screen.getByText(/ZONE 2/)).toBeInTheDocument();
  });

  it("renders heart rate range when provided", () => {
    render(<TodayWorkout sport="running" type="Easy Run" duration={45} targetHrMin={140} targetHrMax={155} />);
    expect(screen.getByText(/140–155 BPM/)).toBeInTheDocument();
  });

  it("renders detail link", () => {
    renderDefault();
    const link = screen.getByText(/Details anzeigen/);
    expect(link).toHaveAttribute("href", "/training");
  });

  it("does not render duration when null", () => {
    render(<TodayWorkout sport="rest" type="Ruhetag" duration={null} />);
    expect(screen.queryByText("MIN")).not.toBeInTheDocument();
  });

  it("uses fallback icon for unknown sport", () => {
    const { container } = render(
      <TodayWorkout sport="unknown" type="Test" duration={30} />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

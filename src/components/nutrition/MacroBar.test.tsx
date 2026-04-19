import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MacroBar } from "./MacroBar";

describe("MacroBar", () => {
  it("renders the stacked bar segments", () => {
    const { container } = render(<MacroBar protein={30} carbs={50} fat={20} />);
    const barContainer = container.querySelector(".flex.h-\\[3px\\]");
    expect(barContainer).toBeInTheDocument();
    const segments = barContainer?.children;
    expect(segments?.length).toBe(3);
  });

  it("renders labels by default", () => {
    render(<MacroBar protein={30} carbs={50} fat={20} />);
    expect(screen.getByText("Protein")).toBeInTheDocument();
    expect(screen.getByText("Carbs")).toBeInTheDocument();
    expect(screen.getByText("Fett")).toBeInTheDocument();
  });

  it("renders gram values", () => {
    render(<MacroBar protein={30} carbs={50} fat={20} />);
    expect(screen.getByText("30g")).toBeInTheDocument();
    expect(screen.getByText("50g")).toBeInTheDocument();
    expect(screen.getByText("20g")).toBeInTheDocument();
  });

  it("hides labels when showLabels is false", () => {
    render(<MacroBar protein={30} carbs={50} fat={20} showLabels={false} />);
    expect(screen.queryByText("Protein")).not.toBeInTheDocument();
  });

  it("handles zero values without crashing", () => {
    render(<MacroBar protein={0} carbs={0} fat={0} />);
    expect(screen.getByText("Protein")).toBeInTheDocument();
  });

  it("calculates proportional widths", () => {
    const { container } = render(
      <MacroBar protein={25} carbs={50} fat={25} />
    );
    const segments = container.querySelectorAll("[style]");
    const firstSegment = segments[0] as HTMLElement;
    expect(firstSegment.style.width).toBe("25%");
  });
});

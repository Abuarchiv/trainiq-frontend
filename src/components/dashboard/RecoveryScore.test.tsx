import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecoveryScore } from "./RecoveryScore";

describe("RecoveryScore", () => {
  it("renders the score value", () => {
    render(<RecoveryScore score={78} />);
    expect(screen.getByText("78")).toBeInTheDocument();
  });

  it('renders "von 100" label', () => {
    render(<RecoveryScore score={78} />);
    expect(screen.getByText("von 100")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(<RecoveryScore score={78} label="BEREIT" />);
    expect(screen.getByText("● BEREIT")).toBeInTheDocument();
  });

  it("shows positive message for high score", () => {
    render(<RecoveryScore score={85} dataAvailable />);
    expect(
      screen.getByText(/Intensives Training möglich/)
    ).toBeInTheDocument();
  });

  it("shows caution message for medium score", () => {
    render(<RecoveryScore score={50} dataAvailable />);
    expect(
      screen.getByText(/Halte die Intensität kontrolliert/)
    ).toBeInTheDocument();
  });

  it("shows recovery message for low score", () => {
    render(<RecoveryScore score={20} dataAvailable />);
    expect(
      screen.getByText(/Erholung wird empfohlen/)
    ).toBeInTheDocument();
  });

  it("shows setup message for zero score", () => {
    render(<RecoveryScore score={0} />);
    expect(
      screen.getByText(/Verbinde eine Uhr/)
    ).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<RecoveryScore score={0} loading />);
    expect(
      screen.getByText(/Analysiere Biometrie/)
    ).toBeInTheDocument();
  });

  it("renders the progress bar", () => {
    const { container } = render(<RecoveryScore score={78} />);
    const bar = container.querySelector(".bar-track");
    expect(bar).toBeInTheDocument();
  });
});

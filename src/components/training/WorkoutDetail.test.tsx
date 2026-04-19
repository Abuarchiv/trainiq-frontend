import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkoutDetail } from "./WorkoutDetail";
import { TrainingPlan } from "@/lib/types";
import userEvent from "@testing-library/user-event";

const basePlan: TrainingPlan = {
  id: "1",
  user_id: "u1",
  date: "2026-03-29",
  sport: "running",
  workout_type: "Easy Run",
  duration_min: 45,
  intensity_zone: 2,
  target_hr_min: 140,
  target_hr_max: 155,
  description: "Lockeres Tempo, Zone 2.",
  coach_reasoning: "HRV war gut.",
  status: "planned",
  created_at: "2026-03-29T00:00:00Z",
};

describe("WorkoutDetail", () => {
  it("renders workout type in uppercase", () => {
    render(<WorkoutDetail plan={basePlan} />);
    expect(screen.getByText("EASY RUN")).toBeInTheDocument();
  });

  it("renders sport label with zone", () => {
    render(<WorkoutDetail plan={basePlan} />);
    expect(screen.getByText(/LAUFEN/)).toBeInTheDocument();
  });

  it("renders duration", () => {
    render(<WorkoutDetail plan={basePlan} />);
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("MIN")).toBeInTheDocument();
  });

  it("renders intensity zone", () => {
    render(<WorkoutDetail plan={basePlan} />);
    expect(screen.getByText("ZONE 2")).toBeInTheDocument();
  });

  it("renders heart rate range", () => {
    render(<WorkoutDetail plan={basePlan} />);
    expect(screen.getByText("140–155 BPM")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<WorkoutDetail plan={basePlan} />);
    expect(screen.getByText("Lockeres Tempo, Zone 2.")).toBeInTheDocument();
  });

  it("renders coach reasoning", () => {
    render(<WorkoutDetail plan={basePlan} />);
    expect(screen.getByText(/Coach Begründung/)).toBeInTheDocument();
    expect(screen.getByText(/HRV war gut/)).toBeInTheDocument();
  });

  it("renders complete and skip buttons when callbacks provided", () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();
    render(<WorkoutDetail plan={basePlan} onComplete={onComplete} onSkip={onSkip} />);
    expect(screen.getByText(/Erledigt/)).toBeInTheDocument();
    expect(screen.getByText(/Überspringen/)).toBeInTheDocument();
  });

  it("does not render buttons for completed workouts", () => {
    const completedPlan = { ...basePlan, status: "completed" as const };
    render(<WorkoutDetail plan={completedPlan} onComplete={vi.fn()} />);
    expect(screen.queryByText(/Überspringen/)).not.toBeInTheDocument();
    expect(screen.getByText(/✓ Erledigt/)).toBeInTheDocument();
  });

  it("calls onComplete when button is clicked", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<WorkoutDetail plan={basePlan} onComplete={onComplete} onSkip={vi.fn()} />);
    await user.click(screen.getByText(/Erledigt/));
    expect(onComplete).toHaveBeenCalledWith("1");
  });

  it("calls onSkip when button is clicked", async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    render(<WorkoutDetail plan={basePlan} onComplete={vi.fn()} onSkip={onSkip} />);
    await user.click(screen.getByText(/Überspringen/));
    expect(onSkip).toHaveBeenCalledWith("1");
  });

  it("renders sport icon", () => {
    const { container } = render(<WorkoutDetail plan={basePlan} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders rest plan without duration section", () => {
    const restPlan = { ...basePlan, sport: "rest", duration_min: null, intensity_zone: null, target_hr_min: null, target_hr_max: null };
    render(<WorkoutDetail plan={restPlan} />);
    expect(screen.queryByText("MIN")).not.toBeInTheDocument();
    expect(screen.queryByText("ZONE")).not.toBeInTheDocument();
  });
});

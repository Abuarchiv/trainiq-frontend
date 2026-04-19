import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FoodUpload } from "./FoodUpload";

describe("FoodUpload", () => {
  it("renders the upload button", () => {
    const onUpload = vi.fn();
    render(<FoodUpload onUpload={onUpload} />);
    expect(screen.getByText("Foto hinzufügen")).toBeInTheDocument();
  });

  it("renders camera icon", () => {
    const onUpload = vi.fn();
    const { container } = render(<FoodUpload onUpload={onUpload} />);
    const cameraIcon = container.querySelector("svg");
    expect(cameraIcon).toBeInTheDocument();
  });

  it("has a hidden file input", () => {
    const onUpload = vi.fn();
    const { container } = render(<FoodUpload onUpload={onUpload} />);
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass("hidden");
  });

  it("accepts image files only", () => {
    const onUpload = vi.fn();
    const { container } = render(<FoodUpload onUpload={onUpload} />);
    const input = container.querySelector('input[type="file"]');
    expect(input).toHaveAttribute("accept", "image/*");
  });

  it("is disabled when disabled prop is true", () => {
    const onUpload = vi.fn();
    render(<FoodUpload onUpload={onUpload} disabled />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("is not disabled by default", () => {
    const onUpload = vi.fn();
    render(<FoodUpload onUpload={onUpload} />);
    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
  });
});

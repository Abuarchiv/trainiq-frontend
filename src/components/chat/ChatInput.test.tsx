import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatInput } from "./ChatInput";
import userEvent from "@testing-library/user-event";

describe("ChatInput", () => {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
    onSend: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the input field", () => {
    render(<ChatInput {...defaultProps} />);
    expect(screen.getByPlaceholderText("Nachricht...")).toBeInTheDocument();
  });

  it("displays the current value", () => {
    render(<ChatInput {...defaultProps} value="Hallo" />);
    expect(screen.getByDisplayValue("Hallo")).toBeInTheDocument();
  });

  it("calls onChange when typing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ChatInput {...defaultProps} onChange={onChange} />);
    await user.type(screen.getByPlaceholderText("Nachricht..."), "a");
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("calls onSend when Enter is pressed", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput {...defaultProps} onSend={onSend} />);
    await user.type(screen.getByPlaceholderText("Nachricht..."), "{Enter}");
    expect(onSend).toHaveBeenCalled();
  });

  it("disables input when disabled prop is true", () => {
    render(<ChatInput {...defaultProps} disabled />);
    expect(screen.getByPlaceholderText("Nachricht...")).toBeDisabled();
  });

  it("shows camera button when onImage is provided", () => {
    const onImage = vi.fn();
    render(<ChatInput {...defaultProps} onImage={onImage} />);
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it("does not show camera button when onImage is not provided", () => {
    render(<ChatInput {...defaultProps} />);
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).not.toBeInTheDocument();
  });

  it("shows character count near limit", () => {
    const longText = "a".repeat(950);
    render(<ChatInput {...defaultProps} value={longText} maxLength={1000} />);
    expect(screen.getByText("50")).toBeInTheDocument();
  });
});

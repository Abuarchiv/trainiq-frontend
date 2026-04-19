import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageBubble } from "./MessageBubble";

describe("MessageBubble", () => {
  it("renders user message content", () => {
    render(<MessageBubble role="user" content="Hallo Coach" />);
    expect(screen.getByText("Hallo Coach")).toBeInTheDocument();
  });

  it("renders assistant message content", () => {
    render(<MessageBubble role="assistant" content="Hallo User" />);
    expect(screen.getByText("Hallo User")).toBeInTheDocument();
  });

  it("shows coach avatar for assistant messages", () => {
    render(<MessageBubble role="assistant" content="Test" />);
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("does not show avatar for user messages", () => {
    render(<MessageBubble role="user" content="Test" />);
    expect(screen.queryByText("C")).not.toBeInTheDocument();
  });

  it("renders formatted time when created_at is provided", () => {
    render(
      <MessageBubble
        role="user"
        content="Test"
        created_at="2026-01-15T10:30:00Z"
      />
    );
    expect(screen.getByText("11:30")).toBeInTheDocument();
  });

  it("does not render time when created_at is not provided", () => {
    const { container } = render(
      <MessageBubble role="user" content="Test" />
    );
    const timeSpan = container.querySelector(".text-xs.text-textDim.font-sans.mt-1");
    expect(timeSpan).toBeNull();
  });

  it("renders bold markdown in assistant messages", () => {
    render(
      <MessageBubble role="assistant" content="Das ist **wichtig**" />
    );
    const boldEl = screen.getByText("wichtig");
    expect(boldEl).toBeInTheDocument();
    expect(boldEl.tagName).toBe("STRONG");
  });
});

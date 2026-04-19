import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DOMPurify from "dompurify";

// Mock für next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock für useCoach Hook
vi.mock("@/hooks/useCoach", () => ({
  useCoach: () => ({
    messages: [],
    loading: false,
    historyLoading: false,
    isError: false,
    sendMessage: vi.fn(),
    sendImage: vi.fn(),
    guestLimits: {
      isGuest: false,
      messagesRemaining: 10,
      photosRemaining: 2,
    },
  }),
}));

// Mock für api
vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Chat XSS Protection", () => {
  describe("formatContent", () => {
    const formatContent = (text: string) => {
      const formatted = text.replace(/\*\*(.+?)\*\*/g, '<span class="font-pixel text-blue" style="font-size:18px">$1</span>');
      return DOMPurify.sanitize(formatted, {
        ALLOWED_TAGS: ['span', 'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['class', 'style'],
      });
    };

    it("sollte normale Text-Formatierung erlauben", () => {
      const input = "**Hallo Welt**";
      const result = formatContent(input);
      expect(result).toContain('<span class="font-pixel text-blue"');
      expect(result).toContain("Hallo Welt");
    });

    it("sollte XSS-Angriffe mit Script-Tags blockieren", () => {
      const input = '<script>alert("XSS")</script>';
      const result = formatContent(input);
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert");
    });

    it("sollte XSS-Angriffe mit onclick-Attributen blockieren", () => {
      const input = '<span onclick="alert(\'XSS\')">Klick mich</span>';
      const result = formatContent(input);
      expect(result).not.toContain("onclick");
    });

    it("sollte XSS-Angriffe mit img onerror blockieren", () => {
      const input = '<img src="x" onerror="alert(\'XSS\')">';
      const result = formatContent(input);
      expect(result).not.toContain("<img");
      expect(result).not.toContain("onerror");
    });

    it("sollte XSS-Angriffe mit javascript: URLs blockieren", () => {
      const input = '<a href="javascript:alert(\'XSS\')">Klick</a>';
      const result = formatContent(input);
      expect(result).not.toContain("javascript:");
    });

    it("sollte Multiple Formatierungen korrekt handhaben", () => {
      const input = "**Text1** und **Text2**";
      const result = formatContent(input);
      expect(result).toContain("Text1");
      expect(result).toContain("Text2");
      expect(result.match(/<span/g)?.length).toBe(2);
    });

    it("sollte Leerzeichen und Sonderzeichen korrekt handhaben", () => {
      const input = "**Text mit Leerzeichen & Sonderzeichen!**";
      const result = formatContent(input);
      expect(result).toContain("Text mit Leerzeichen");
      expect(result).toContain("Sonderzeichen!");
      expect(result).toContain("&amp;");
    });
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./auth";

// Reset store and localStorage before each test
beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ token: null, user: null, isChecked: false });
});

describe("useAuthStore", () => {
  describe("initial state", () => {
    it("starts with null token, null user, and isChecked=false", () => {
      const { token, user, isChecked } = useAuthStore.getState();
      expect(token).toBeNull();
      expect(user).toBeNull();
      expect(isChecked).toBe(false);
    });
  });

  describe("setAuth", () => {
    it("stores token and user in state and localStorage", () => {
      const user = { id: "1", email: "test@example.com", name: "Test" };
      useAuthStore.getState().setAuth("my-token", user);

      const state = useAuthStore.getState();
      expect(state.token).toBe("my-token");
      expect(state.user).toEqual(user);
      expect(localStorage.getItem("token")).toBe("my-token");
      expect(JSON.parse(localStorage.getItem("user")!)).toEqual(user);
    });
  });

  describe("logout", () => {
    it("clears token, user from state and localStorage", () => {
      const user = { id: "1", email: "test@example.com", name: "Test" };
      useAuthStore.getState().setAuth("my-token", user);
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
    });
  });

  describe("init", () => {
    it("sets isChecked=true even when localStorage is empty", () => {
      useAuthStore.getState().init();
      expect(useAuthStore.getState().isChecked).toBe(true);
    });

    it("restores token and user from localStorage and sets isChecked=true", () => {
      const user = { id: "42", email: "a@b.com", name: "Alice" };
      localStorage.setItem("token", "restored-token");
      localStorage.setItem("user", JSON.stringify(user));

      useAuthStore.getState().init();

      const state = useAuthStore.getState();
      expect(state.token).toBe("restored-token");
      expect(state.user).toEqual(user);
      expect(state.isChecked).toBe(true);
    });

    it("clears corrupt user JSON from localStorage and sets isChecked=true", () => {
      localStorage.setItem("token", "some-token");
      localStorage.setItem("user", "{ this is not json }}}");

      useAuthStore.getState().init();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isChecked).toBe(true);
      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
    });

    it("does not restore when token is missing but user is present", () => {
      localStorage.setItem("user", JSON.stringify({ id: "1", email: "x@y.com", name: "X" }));

      useAuthStore.getState().init();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.isChecked).toBe(true);
    });
  });
});

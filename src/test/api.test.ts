import { describe, it, expect, beforeEach } from "vitest";
import { getToken, setToken, removeToken } from "@/services/api";

const TOKEN_KEY = "sca_token";

describe("api.ts — Token management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("getToken returns null when no token is stored", () => {
    expect(getToken()).toBeNull();
  });

  it("setToken stores a token in localStorage", () => {
    setToken("test-jwt-token-123");
    expect(localStorage.getItem(TOKEN_KEY)).toBe("test-jwt-token-123");
  });

  it("getToken returns the stored token", () => {
    setToken("my-test-token");
    expect(getToken()).toBe("my-test-token");
  });

  it("removeToken clears the token from localStorage", () => {
    setToken("remove-me");
    removeToken();
    expect(getToken()).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("setToken overwrites a previous token", () => {
    setToken("first-token");
    setToken("second-token");
    expect(getToken()).toBe("second-token");
  });
});

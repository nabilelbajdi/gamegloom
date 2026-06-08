import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useIsMobile from "./useIsMobile";

// Installs a controllable window.matchMedia mock. Call mql._set(bool) to simulate a change.
function installMatchMedia(initialMatches) {
  let matches = initialMatches;
  const listeners = new Set();
  const mql = {
    get matches() { return matches; },
    media: "(max-width: 767px)",
    addEventListener: (_event, cb) => listeners.add(cb),
    removeEventListener: (_event, cb) => listeners.delete(cb),
    _set(value) { matches = value; listeners.forEach((cb) => cb({ matches: value })); },
  };
  window.matchMedia = vi.fn().mockReturnValue(mql);
  return mql;
}

describe("useIsMobile", () => {
  it("returns true when the viewport matches the mobile query", () => {
    installMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("returns false when the viewport does not match", () => {
    installMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("updates when the media query changes (resize/rotate)", () => {
    const mql = installMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
    act(() => mql._set(true));
    expect(result.current).toBe(true);
  });
});

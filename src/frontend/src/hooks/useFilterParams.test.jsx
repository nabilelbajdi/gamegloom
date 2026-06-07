import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import useFilterParams from "./useFilterParams";

const SCHEMA = {
  filters: ["genres", "themes", "platforms", "gameModes", "playerPerspectives", "contentTypes", "minRating"],
  sort: { values: ["rating_high", "release_new", "name_asc"], default: "rating_high" },
};

// Builds a renderHook wrapper that mounts the hook under a MemoryRouter at initialUrl.
function wrapperFor(initialUrl) {
  // eslint-disable-next-line react/prop-types, react/display-name
  return ({ children }) => <MemoryRouter initialEntries={[initialUrl]}>{children}</MemoryRouter>;
}

// Exposes the hook API plus the live URL query params, for asserting on URL shape.
function useHarness(schema) {
  const api = useFilterParams(schema);
  const params = new URLSearchParams(useLocation().search);
  return { ...api, params };
}

describe("useFilterParams — read", () => {
  it("parses multi-select filters from comma-joined params", () => {
    const { result } = renderHook(() => useFilterParams(SCHEMA), {
      wrapper: wrapperFor("/games?genres=rpg,indie&platforms=pc"),
    });
    expect(result.current.filters.genres).toEqual(["rpg", "indie"]);
    expect(result.current.filters.platforms).toEqual(["pc"]);
    expect(result.current.filters.themes).toEqual([]);
  });

  it("parses minRating as a number and ignores zero/invalid", () => {
    const { result: r1 } = renderHook(() => useFilterParams(SCHEMA), {
      wrapper: wrapperFor("/games?minRating=4"),
    });
    expect(r1.current.filters.minRating).toBe(4);

    const { result: r2 } = renderHook(() => useFilterParams(SCHEMA), {
      wrapper: wrapperFor("/games?minRating=banana"),
    });
    expect(r2.current.filters.minRating).toBe(0);
  });

  it("falls back to the default sort when the URL sort is missing or invalid", () => {
    const { result: missing } = renderHook(() => useFilterParams(SCHEMA), {
      wrapper: wrapperFor("/games"),
    });
    expect(missing.current.sortOption).toBe("rating_high");

    const { result: invalid } = renderHook(() => useFilterParams(SCHEMA), {
      wrapper: wrapperFor("/games?sort=banana"),
    });
    expect(invalid.current.sortOption).toBe("rating_high");
  });

  it("reads a valid sort value from the URL", () => {
    const { result } = renderHook(() => useFilterParams(SCHEMA), {
      wrapper: wrapperFor("/games?sort=name_asc"),
    });
    expect(result.current.sortOption).toBe("name_asc");
  });
});

describe("useFilterParams — write", () => {
  it("applyFilters writes selected filters to the URL and omits empties", () => {
    const { result } = renderHook(() => useFilterParams(SCHEMA), {
      wrapper: wrapperFor("/games"),
    });
    act(() => result.current.applyFilters({ genres: ["rpg", "indie"], minRating: 4 }));
    expect(result.current.filters.genres).toEqual(["rpg", "indie"]);
    expect(result.current.filters.minRating).toBe(4);
    expect(result.current.filters.themes).toEqual([]);
  });

  it("setSort writes a non-default sort but omits the default", () => {
    const { result } = renderHook(() => useFilterParams(SCHEMA), {
      wrapper: wrapperFor("/games"),
    });
    act(() => result.current.setSort("name_asc"));
    expect(result.current.sortOption).toBe("name_asc");
    act(() => result.current.setSort("rating_high")); // default -> removed
    expect(result.current.sortOption).toBe("rating_high");
  });

  it("clearAll removes all filter params and resets sort to default", () => {
    const { result } = renderHook(() => useFilterParams(SCHEMA), {
      wrapper: wrapperFor("/games?genres=rpg&minRating=4&sort=name_asc"),
    });
    act(() => result.current.clearAll());
    expect(result.current.filters.genres).toEqual([]);
    expect(result.current.filters.minRating).toBe(0);
    expect(result.current.sortOption).toBe("rating_high");
  });

  it("preserves identity params (e.g. query) that the hook does not own", () => {
    const { result } = renderHook(() => useFilterParams(SCHEMA), {
      wrapper: wrapperFor("/search?query=zelda&category=all"),
    });
    act(() => result.current.applyFilters({ genres: ["rpg"] }));
    expect(result.current.filters.genres).toEqual(["rpg"]);
    act(() => result.current.clearAll());
    expect(result.current.filters.genres).toEqual([]);
  });
});

describe("useFilterParams — URL shape", () => {
  it("encodes selected filters into the query string and omits untouched keys", () => {
    const { result } = renderHook(() => useHarness(SCHEMA), {
      wrapper: wrapperFor("/games"),
    });
    act(() => result.current.applyFilters({ genres: ["rpg", "indie"], minRating: 4 }));
    expect(result.current.params.get("genres")).toBe("rpg,indie");
    expect(result.current.params.get("minRating")).toBe("4");
    expect(result.current.params.has("themes")).toBe(false);
    expect(result.current.params.has("platforms")).toBe(false);
  });

  it("omits minRating and the default sort entirely from the URL", () => {
    const { result } = renderHook(() => useHarness(SCHEMA), {
      wrapper: wrapperFor("/games?minRating=4&sort=name_asc"),
    });
    act(() => result.current.applyFilters({ minRating: 0 }));
    expect(result.current.params.has("minRating")).toBe(false);
    act(() => result.current.setSort("rating_high")); // default -> no param at all
    expect(result.current.params.has("sort")).toBe(false);
  });

  it("clearAll strips every filter param from the URL", () => {
    const { result } = renderHook(() => useHarness(SCHEMA), {
      wrapper: wrapperFor("/games?genres=rpg&minRating=4&sort=name_asc"),
    });
    act(() => result.current.clearAll());
    expect(result.current.params.has("genres")).toBe(false);
    expect(result.current.params.has("minRating")).toBe(false);
    expect(result.current.params.has("sort")).toBe(false);
  });

  it("leaves identity params (query/category) intact through writes and clearAll", () => {
    const { result } = renderHook(() => useHarness(SCHEMA), {
      wrapper: wrapperFor("/search?query=zelda&category=all"),
    });
    act(() => result.current.applyFilters({ genres: ["rpg"] }));
    expect(result.current.params.get("query")).toBe("zelda");
    expect(result.current.params.get("category")).toBe("all");
    expect(result.current.params.get("genres")).toBe("rpg");
    act(() => result.current.clearAll());
    expect(result.current.params.get("query")).toBe("zelda");
    expect(result.current.params.get("category")).toBe("all");
    expect(result.current.params.has("genres")).toBe(false);
  });
});

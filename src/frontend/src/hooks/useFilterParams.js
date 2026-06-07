import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

// Multi-select filter keys are stored as comma-joined URL params.
// minRating is a number; sort is a single string value.
const ARRAY_KEYS = [
  "genres",
  "themes",
  "platforms",
  "gameModes",
  "playerPerspectives",
  "contentTypes",
];

function emptyFilters(allowed) {
  const out = {};
  for (const key of allowed) {
    out[key] = key === "minRating" ? 0 : [];
  }
  return out;
}

/**
 * Owns the URL <-> filter/sort state contract for a list page.
 *
 * @param {Object} schema
 * @param {string[]} schema.filters - which filter keys this page supports
 * @param {{ values: string[], default: string }} schema.sort - valid sort values + default
 * @returns {{ filters, sortOption, applyFilters, setSort, clearAll }}
 */
export default function useFilterParams(schema) {
  const { filters: allowed, sort } = schema;
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const out = {};
    for (const key of allowed) {
      if (key === "minRating") {
        const raw = parseInt(searchParams.get("minRating"), 10);
        out.minRating = Number.isFinite(raw) && raw > 0 ? raw : 0;
      } else {
        const raw = searchParams.get(key);
        out[key] = raw ? raw.split(",").filter(Boolean) : [];
      }
    }
    return out;
  }, [searchParams, allowed]);

  const sortOption = useMemo(() => {
    const raw = searchParams.get("sort");
    return sort.values.includes(raw) ? raw : sort.default;
  }, [searchParams, sort]);

  const commit = useCallback(
    (nextFilters, nextSort) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev); // preserve identity params (query/category/tab)
          for (const key of allowed) {
            if (key === "minRating") {
              if (nextFilters.minRating > 0) next.set("minRating", String(nextFilters.minRating));
              else next.delete("minRating");
            } else if (ARRAY_KEYS.includes(key)) {
              const arr = nextFilters[key] || [];
              if (arr.length) next.set(key, arr.join(","));
              else next.delete(key);
            }
          }
          if (nextSort && nextSort !== sort.default) next.set("sort", nextSort);
          else next.delete("sort");
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams, allowed, sort.default]
  );

  const applyFilters = useCallback(
    (partial) => commit({ ...filters, ...partial }, sortOption),
    [commit, filters, sortOption]
  );

  const setSort = useCallback((nextSort) => commit(filters, nextSort), [commit, filters]);

  const clearAll = useCallback(
    () => commit(emptyFilters(allowed), sort.default),
    [commit, allowed, sort.default]
  );

  return { filters, sortOption, applyFilters, setSort, clearAll };
}

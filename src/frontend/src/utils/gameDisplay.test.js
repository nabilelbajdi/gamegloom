import { describe, it, expect } from "vitest";
import { getHighResImage, pickHeroArt, shortenPlatform, shortPlatforms } from "./gameDisplay";

const igdb = (token, file) => `https://images.igdb.com/igdb/image/upload/${token}/${file}.jpg`;

describe("getHighResImage", () => {
  it("upgrades IGDB size tokens to t_1080p", () => {
    expect(getHighResImage(igdb("t_thumb", "abc"))).toBe(igdb("t_1080p", "abc"));
    expect(getHighResImage(igdb("t_cover_big", "abc"))).toBe(igdb("t_1080p", "abc"));
    expect(getHighResImage(igdb("t_screenshot_med", "abc"))).toBe(igdb("t_1080p", "abc"));
  });

  it("leaves an already-1080p url alone", () => {
    expect(getHighResImage(igdb("t_1080p", "abc"))).toBe(igdb("t_1080p", "abc"));
  });

  it("returns non-IGDB urls unchanged", () => {
    expect(getHighResImage("https://example.com/a.jpg")).toBe("https://example.com/a.jpg");
  });

  it("handles null and undefined", () => {
    expect(getHighResImage(null)).toBe(null);
    expect(getHighResImage(undefined)).toBe(undefined);
  });
});

describe("pickHeroArt", () => {
  const art = igdb("t_thumb", "art");
  const shot = igdb("t_thumb", "shot");

  it("prefers the first artwork, upgraded to 1080p", () => {
    expect(pickHeroArt({ artworks: [art], screenshots: [shot] })).toBe(igdb("t_1080p", "art"));
  });

  it("falls back to the first screenshot", () => {
    expect(pickHeroArt({ artworks: [], screenshots: [shot] })).toBe(igdb("t_1080p", "shot"));
  });

  it("is stable across calls rather than picking at random", () => {
    const game = { screenshots: [igdb("t_thumb", "a"), igdb("t_thumb", "b"), igdb("t_thumb", "c")] };
    const picks = new Set([pickHeroArt(game), pickHeroArt(game), pickHeroArt(game)]);
    expect(picks.size).toBe(1);
  });

  it("returns null when no art or screenshots exist", () => {
    expect(pickHeroArt({ artworks: [], screenshots: [] })).toBe(null);
    expect(pickHeroArt({})).toBe(null);
    expect(pickHeroArt(null)).toBe(null);
  });
});

describe("shortenPlatform", () => {
  it("shortens known platforms", () => {
    expect(shortenPlatform("PC (Microsoft Windows)")).toBe("PC");
    expect(shortenPlatform("PlayStation 5")).toBe("PS5");
    expect(shortenPlatform("Nintendo Switch")).toBe("Switch");
  });

  it("trims surrounding whitespace before matching", () => {
    expect(shortenPlatform("  PlayStation 4  ")).toBe("PS4");
  });

  it("passes unknown platforms through unchanged", () => {
    expect(shortenPlatform("Xbox Series X|S")).toBe("Xbox Series X|S");
  });
});

describe("shortPlatforms", () => {
  it("shortens and alphabetises a comma-separated list", () => {
    expect(shortPlatforms("PlayStation 5, PC (Microsoft Windows), Nintendo Switch"))
      .toBe("PC, PS5, Switch");
  });

  it("keeps unknown platforms in the sorted output", () => {
    expect(shortPlatforms("Xbox Series X|S, PlayStation 5")).toBe("PS5, Xbox Series X|S");
  });

  it("handles a single platform with no separator", () => {
    expect(shortPlatforms("Nintendo Switch")).toBe("Switch");
  });

  it("handles null, undefined and empty input", () => {
    expect(shortPlatforms(null)).toBe("");
    expect(shortPlatforms(undefined)).toBe("");
    expect(shortPlatforms("")).toBe("");
  });
});

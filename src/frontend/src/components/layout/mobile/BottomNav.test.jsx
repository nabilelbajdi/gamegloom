import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BottomNav from "./BottomNav";

describe("BottomNav", () => {
  it("renders the four tabs with correct destinations", () => {
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /discover/i })).toHaveAttribute("href", "/discover");
    expect(screen.getByRole("link", { name: /library/i })).toHaveAttribute("href", "/library");
    expect(screen.getByRole("link", { name: /you/i })).toHaveAttribute("href", "/profile");
  });
});

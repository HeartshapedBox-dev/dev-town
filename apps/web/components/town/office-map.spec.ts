import { buildOfficeLayout, getBlockingFurniture } from "./office-map";

describe("buildOfficeLayout", () => {
  it("keeps the spawn corner open in the office preset", () => {
    const layout = buildOfficeLayout(12, 11);

    expect(layout.width).toBe(12);
    expect(layout.height).toBe(11);
    expect(getBlockingFurniture(layout, 0, 0)).toBeNull();
    expect(getBlockingFurniture(layout, 0, 1)).toBeNull();
    expect(getBlockingFurniture(layout, 1, 0)).toBeNull();
    expect(getBlockingFurniture(layout, 1, 1)).toBeNull();
  });

  it("places the main furniture away from the spawn area", () => {
    const layout = buildOfficeLayout(12, 11);

    expect(layout.furniture.some((item) => item.blocksMovement && item.x < 2 && item.y < 2)).toBe(false);
  });
});

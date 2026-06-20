import { directionArrow, isFacingEachOther } from "./facing";

describe("facing helpers", () => {
  it.each([
    {
      label: "(8,10) RIGHT vs (9,10) LEFT",
      left: {
        id: "session-a",
        displayName: "Tester A",
        avatarColor: "#2563eb",
        roomId: "room-1",
        positionX: 8,
        positionY: 10,
        direction: "RIGHT",
        status: "ONLINE",
      } as const,
      right: {
        id: "session-b",
        displayName: "Tester B",
        avatarColor: "#dc2626",
        roomId: "room-1",
        positionX: 9,
        positionY: 10,
        direction: "LEFT",
        status: "ONLINE",
      } as const,
    },
    {
      label: "(8,11) RIGHT vs (9,11) LEFT",
      left: {
        id: "session-c",
        displayName: "Tester C",
        avatarColor: "#16a34a",
        roomId: "room-1",
        positionX: 8,
        positionY: 11,
        direction: "RIGHT",
        status: "ONLINE",
      } as const,
      right: {
        id: "session-d",
        displayName: "Tester D",
        avatarColor: "#ea580c",
        roomId: "room-1",
        positionX: 9,
        positionY: 11,
        direction: "LEFT",
        status: "ONLINE",
      } as const,
    },
  ])("returns true when two sessions face each other on adjacent tiles $label", ({ left, right }) => {
    expect(isFacingEachOther(left, right)).toBe(true);
  });

  it("returns the matching arrow for each direction", () => {
    expect(directionArrow("UP")).toBe("↑");
    expect(directionArrow("DOWN")).toBe("↓");
    expect(directionArrow("LEFT")).toBe("←");
    expect(directionArrow("RIGHT")).toBe("→");
  });
});

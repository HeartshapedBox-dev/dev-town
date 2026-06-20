import { OFFICE_ROOM_PRESET, ROOM_PRESETS } from "./room-presets";

describe("room presets", () => {
  it("exposes the office preset as a 12x11 fixed room", () => {
    expect(ROOM_PRESETS).toHaveLength(1);
    expect(OFFICE_ROOM_PRESET).toEqual({
      id: "office",
      label: "사무실",
      width: 12,
      height: 11,
    });
  });
});

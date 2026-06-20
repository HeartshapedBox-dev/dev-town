import { getCharacterPositionStyle } from "./character-position";

describe("getCharacterPositionStyle", () => {
  it("converts 0-base tile coordinates into percent offsets", () => {
    expect(
      getCharacterPositionStyle(
        {
          positionX: 9,
          positionY: 5,
        },
        {
          width: 20,
          height: 12,
        },
      ),
    ).toEqual({
      left: "47.5%",
      top: "45.83333333333333%",
      transform: "translate(calc(-50% + 0px), calc(-72% + 0px))",
    });
  });
});

import { getCharacterPositionStyle, getVisibleCharacterPosition } from "./character-position";

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

  it("clamps off-board coordinates into the visible map area", () => {
    expect(
      getVisibleCharacterPosition(
        {
          positionX: 12,
          positionY: 5,
        },
        {
          width: 12,
          height: 6,
        },
      ),
    ).toEqual({
      positionX: 11,
      positionY: 5,
    });

    expect(
      getCharacterPositionStyle(
        {
          positionX: 12,
          positionY: 5,
        },
        {
          width: 12,
          height: 6,
        },
      ),
    ).toEqual({
      left: "95.83333333333334%",
      top: "91.66666666666666%",
      transform: "translate(calc(-50% + 0px), calc(-72% + 0px))",
    });

    expect(
      getVisibleCharacterPosition(
        {
          positionX: 12,
          positionY: 10,
        },
        {
          width: 12,
          height: 11,
        },
      ),
    ).toEqual({
      positionX: 11,
      positionY: 10,
    });
  });
});

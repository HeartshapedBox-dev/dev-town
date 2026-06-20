import type { DeveloperSession, Room } from "../../lib/types";

type PositionCandidate = Pick<DeveloperSession, "positionX" | "positionY">;
type PositionRoom = Pick<Room, "width" | "height">;

type PositionOffset = {
  x?: number;
  y?: number;
};

export function getCharacterPositionStyle(
  candidate: PositionCandidate,
  room: PositionRoom,
  offset: PositionOffset = {},
) {
  const x = offset.x ?? 0;
  const y = offset.y ?? 0;

  return {
    left: `${((candidate.positionX + 0.5) / room.width) * 100}%`,
    top: `${((candidate.positionY + 0.5) / room.height) * 100}%`,
    transform: `translate(calc(-50% + ${x}px), calc(-72% + ${y}px))`,
  };
}

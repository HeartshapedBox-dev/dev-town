import type { DeveloperSession, Room } from "../../lib/types";

type PositionCandidate = Pick<DeveloperSession, "positionX" | "positionY">;
type PositionRoom = Pick<Room, "width" | "height">;

type PositionOffset = {
  x?: number;
  y?: number;
};

export function getVisibleCharacterPosition(candidate: PositionCandidate, room: PositionRoom) {
  return {
    positionX: clamp(candidate.positionX, 0, Math.max(room.width - 1, 0)),
    positionY: clamp(candidate.positionY, 0, Math.max(room.height - 1, 0)),
  };
}

export function getCharacterPositionStyle(
  candidate: PositionCandidate,
  room: PositionRoom,
  offset: PositionOffset = {},
) {
  const x = offset.x ?? 0;
  const y = offset.y ?? 0;
  const visiblePosition = getVisibleCharacterPosition(candidate, room);

  return {
    left: `${((visiblePosition.positionX + 0.5) / Math.max(room.width, 1)) * 100}%`,
    top: `${((visiblePosition.positionY + 0.5) / Math.max(room.height, 1)) * 100}%`,
    transform: `translate(calc(-50% + ${x}px), calc(-72% + ${y}px))`,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

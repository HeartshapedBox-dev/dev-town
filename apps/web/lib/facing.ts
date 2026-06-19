import type { DeveloperSession } from "./types";

export function isFacingEachOther(a: DeveloperSession, b: DeveloperSession) {
  if (a.roomId !== b.roomId || a.id === b.id) {
    return false;
  }

  return pointsTo(a, b.positionX, b.positionY) && pointsTo(b, a.positionX, a.positionY);
}

export function directionArrow(direction: DeveloperSession["direction"]) {
  switch (direction) {
    case "UP":
      return "↑";
    case "DOWN":
      return "↓";
    case "LEFT":
      return "←";
    case "RIGHT":
      return "→";
  }
}

function pointsTo(session: DeveloperSession, targetX: number, targetY: number) {
  const expected = {
    UP: [session.positionX, session.positionY - 1],
    DOWN: [session.positionX, session.positionY + 1],
    LEFT: [session.positionX - 1, session.positionY],
    RIGHT: [session.positionX + 1, session.positionY],
  } as const;

  const [x, y] = expected[session.direction];
  return x === targetX && y === targetY;
}

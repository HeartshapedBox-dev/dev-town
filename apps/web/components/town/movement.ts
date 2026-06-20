"use client";

import type { DeveloperSession, Direction, Room } from "../../lib/types";
import type { OfficeLayout } from "./office-map";
import {
  getBlockedMoveMessage,
  getBlockedRoomBoundaryMessage,
  getBlockedSessionMoveMessage,
  getBlockingItem,
  getBlockingSession,
} from "./collision";

export type UpdatePositionInput = {
  roomId: string;
  positionX: number;
  positionY: number;
  direction: Direction;
};

const MOVE_DELTAS: Record<Direction, { x: number; y: number }> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export type MoveSocketPayload = UpdatePositionInput & {
  sessionId: string;
};

export type MovePlan =
  | {
      blocked: true;
      message: string;
    }
  | {
      blocked: false;
      session: DeveloperSession;
      updatePosition: UpdatePositionInput;
      socketPayload: MoveSocketPayload;
    };

export function createMoveCommand(
  session: DeveloperSession,
  direction: Direction,
  room: Pick<Room, "id" | "width" | "height">,
): MoveSocketPayload {
  const nextPosition = getNextPosition(session, direction);

  return {
    sessionId: session.id,
    roomId: room.id,
    positionX: clamp(nextPosition.positionX, 0, Math.max(room.width - 1, 0)),
    positionY: clamp(nextPosition.positionY, 0, Math.max(room.height - 1, 0)),
    direction,
  };
}

export function createMovePlan(
  session: DeveloperSession,
  room: Room,
  direction: Direction,
  layout: OfficeLayout | null,
  sessions: DeveloperSession[] = [],
): MovePlan {
  const targetPosition = getNextPosition(session, direction);
  const command = createMoveCommand(session, direction, room);

  if (!isWithinRoomBounds(targetPosition.positionX, targetPosition.positionY, room)) {
    return {
      blocked: true,
      message: getBlockedRoomBoundaryMessage(direction, targetPosition.positionX, targetPosition.positionY),
    };
  }

  const blockingSession = getBlockingSession(sessions, session.id, targetPosition.positionX, targetPosition.positionY);
  if (blockingSession) {
    return {
      blocked: true,
      message: getBlockedSessionMoveMessage(),
    };
  }

  const blockingItem = layout ? getBlockingItem(layout, targetPosition.positionX, targetPosition.positionY) : null;

  if (blockingItem) {
    return {
      blocked: true,
      message: getBlockedMoveMessage(blockingItem),
    };
  }

  return {
    blocked: false,
    session: {
      ...session,
      roomId: command.roomId,
      positionX: targetPosition.positionX,
      positionY: targetPosition.positionY,
      direction: command.direction,
    },
    updatePosition: {
      roomId: command.roomId,
      positionX: targetPosition.positionX,
      positionY: targetPosition.positionY,
      direction: command.direction,
    },
    socketPayload: command,
  };
}

function getNextPosition(session: Pick<DeveloperSession, "positionX" | "positionY">, direction: Direction) {
  const delta = MOVE_DELTAS[direction];

  return {
    positionX: session.positionX + delta.x,
    positionY: session.positionY + delta.y,
  };
}

function isWithinRoomBounds(positionX: number, positionY: number, room: Pick<Room, "width" | "height">) {
  return positionX >= 0 && positionY >= 0 && positionX < room.width && positionY < room.height;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

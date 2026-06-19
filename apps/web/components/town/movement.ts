"use client";

import type { DeveloperSession, Direction, Room } from "../../lib/types";
import type { OfficeLayout } from "./office-map";
import { getBlockedMoveMessage, getBlockingItem } from "./collision";

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
  const delta = MOVE_DELTAS[direction];

  return {
    sessionId: session.id,
    roomId: room.id,
    positionX: clamp(session.positionX + delta.x, 0, room.width - 1),
    positionY: clamp(session.positionY + delta.y, 0, room.height - 1),
    direction,
  };
}

export function createMovePlan(
  session: DeveloperSession,
  room: Room,
  direction: Direction,
  layout: OfficeLayout | null,
): MovePlan {
  const command = createMoveCommand(session, direction, room);
  const blockingItem = layout ? getBlockingItem(layout, command.positionX, command.positionY) : null;

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
      positionX: command.positionX,
      positionY: command.positionY,
      direction: command.direction,
    },
    updatePosition: {
      roomId: command.roomId,
      positionX: command.positionX,
      positionY: command.positionY,
      direction: command.direction,
    },
    socketPayload: command,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

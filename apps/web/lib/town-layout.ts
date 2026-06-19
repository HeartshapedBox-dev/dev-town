import type { Room } from "./types";

export type OfficeObjectKind =
  | "reception"
  | "desk"
  | "chair"
  | "wall"
  | "meetingRoom"
  | "plant"
  | "cabinet"
  | "whiteboard"
  | "door"
  | "lounge";

export type OfficeObject = {
  id: string;
  kind: OfficeObjectKind;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  blocked: boolean;
};

export function createTownOfficeObjects(room: Pick<Room, "width" | "height">) {
  const width = Math.max(room.width, 4);
  const height = Math.max(room.height, 4);

  const meetingRoomX = clamp(Math.floor(width * 0.62), 8, Math.max(1, width - 6));
  const meetingRoomWidth = fitSize(width - meetingRoomX - 1, 4, 5);
  const meetingRoomHeight = fitSize(Math.floor(height * 0.33), 3, 4);

  const deskWidth = fitSize(Math.floor(width * 0.2), 3, 4);
  const deskLeftX = 2;
  const deskTopY = clamp(Math.floor(height * 0.22), 2, Math.max(1, height - 4));
  const deskBottomY = clamp(deskTopY + 2, 3, Math.max(1, height - 3));

  const loungeY = Math.max(height - 3, 1);

  return [
    rect(room, "reception", "리셉션", 1, 1, fitSize(3, 2, 4), 1, true),
    rect(room, "meeting-room", "회의실", meetingRoomX, 1, meetingRoomWidth, meetingRoomHeight, true),
    rect(room, "wall-divider", "파티션 벽", Math.max(Math.floor(width * 0.52), 5), 1, 1, fitSize(Math.floor(height * 0.55), 4, 6), true),
    rect(room, "whiteboard", "화이트보드", Math.max(meetingRoomX - 2, 1), 1, 1, fitSize(meetingRoomHeight, 3, 4), false),
    rect(room, "desk-a", "업무 책상", deskLeftX, deskTopY, deskWidth, 1, true),
    rect(room, "chair-a", "의자", deskLeftX + deskWidth - 1, deskTopY + 1, 1, 1, true),
    rect(room, "desk-b", "업무 책상", deskLeftX, deskBottomY, deskWidth, 1, true),
    rect(room, "chair-b", "의자", deskLeftX + deskWidth - 1, deskBottomY + 1, 1, 1, true),
    rect(room, "cabinet", "서랍장", 1, loungeY, fitSize(3, 2, 3), 1, true),
    rect(room, "plant", "식물", Math.max(width - 3, 1), loungeY, 1, 1, true),
    rect(room, "lounge", "라운지", Math.max(Math.floor(width * 0.42), 4), Math.max(Math.floor(height * 0.58), 4), fitSize(3, 2, 4), 1, false),
    rect(room, "door", "출입구", Math.max(Math.floor(width / 2) - 1, 1), height - 1, fitSize(2, 2, 3), 1, false),
  ];
}

function rect(
  room: Pick<Room, "width" | "height">,
  id: string,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  blocked: boolean,
): OfficeObject {
  const safeWidth = fitSize(width, 1, room.width);
  const safeHeight = fitSize(height, 1, room.height);
  const safeX = clamp(x, 0, Math.max(0, room.width - safeWidth));
  const safeY = clamp(y, 0, Math.max(0, room.height - safeHeight));

  return {
    id,
    label,
    kind: idToKind(id),
    x: safeX,
    y: safeY,
    width: safeWidth,
    height: safeHeight,
    blocked,
  };
}

function idToKind(id: string): OfficeObjectKind {
  if (id.startsWith("desk")) {
    return "desk";
  }
  if (id.startsWith("chair")) {
    return "chair";
  }
  if (id === "meeting-room") {
    return "meetingRoom";
  }
  if (id === "wall-divider") {
    return "wall";
  }
  if (id === "reception") {
    return "reception";
  }
  if (id === "cabinet") {
    return "cabinet";
  }
  if (id === "whiteboard") {
    return "whiteboard";
  }
  if (id === "plant") {
    return "plant";
  }
  if (id === "door") {
    return "door";
  }
  return "lounge";
}

function fitSize(value: number, min: number, max: number) {
  if (max < min) {
    return Math.max(1, Math.min(value, Math.max(max, 1)));
  }

  return clamp(value, min, max);
}

function clamp(value: number, min: number, max: number) {
  if (max < min) {
    return Math.max(0, max);
  }

  return Math.min(Math.max(value, min), max);
}

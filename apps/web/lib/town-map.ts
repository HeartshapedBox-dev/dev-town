import type { Room } from "./types";

export type TownTileKind =
  | "floor"
  | "wall"
  | "desk"
  | "chair"
  | "meeting"
  | "plant"
  | "equipment"
  | "window"
  | "carpet";

export type TownObject = {
  id: string;
  kind: TownTileKind;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  blocked: boolean;
};

export type TownLayout = {
  width: number;
  height: number;
  tiles: TownTileKind[][];
  objects: TownObject[];
  blockedTiles: Set<string>;
};

export const TILE_SIZE = 48;

export function buildTownLayout(room: Room): TownLayout {
  const width = Math.max(room.width, 4);
  const height = Math.max(room.height, 4);

  const tiles: TownTileKind[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => "floor" as TownTileKind),
  );
  const blockedTiles = new Set<string>();
  const objects: TownObject[] = [];

  const paint = (object: TownObject) => {
    const startX = clamp(object.x, 0, width - 1);
    const startY = clamp(object.y, 0, height - 1);
    const endX = clamp(object.x + object.width - 1, 0, width - 1);
    const endY = clamp(object.y + object.height - 1, 0, height - 1);

    if (endX < startX || endY < startY) {
      return;
    }

    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        tiles[y][x] = object.kind;
        if (object.blocked) {
          blockedTiles.add(tileKey(x, y));
        }
      }
    }

    objects.push({
      ...object,
      x: startX,
      y: startY,
      width: endX - startX + 1,
      height: endY - startY + 1,
    });
  };

  const addRect = (
    id: string,
    kind: TownTileKind,
    label: string,
    x: number,
    y: number,
    widthSize: number,
    heightSize: number,
    blocked = true,
  ) => {
    paint({ id, kind, label, x, y, width: widthSize, height: heightSize, blocked });
  };

  const topWindowWidth = Math.min(Math.max(width - 2, 1), 8);
  addRect("window-strip", "window", "Glass Wall", 1, 0, topWindowWidth, 1, false);

  const meetingRoomWidth = Math.min(6, Math.max(width - 6, 3));
  const meetingRoomHeight = Math.min(4, Math.max(height - 3, 3));
  const meetingRoomX = Math.max(width - meetingRoomWidth - 1, Math.floor(width / 2) + 1);
  const meetingRoomY = 1;

  addRect("meeting-wall-top", "wall", "회의실", meetingRoomX, meetingRoomY, meetingRoomWidth, 1, true);
  addRect(
    "meeting-wall-bottom",
    "wall",
    "회의실",
    meetingRoomX,
    meetingRoomY + meetingRoomHeight - 1,
    meetingRoomWidth,
    1,
    true,
  );
  addRect("meeting-wall-left", "wall", "회의실", meetingRoomX, meetingRoomY, 1, meetingRoomHeight, true);
  addRect(
    "meeting-wall-right",
    "wall",
    "회의실",
    meetingRoomX + meetingRoomWidth - 1,
    meetingRoomY,
    1,
    meetingRoomHeight,
    true,
  );
  addRect(
    "meeting-table",
    "meeting",
    "회의 테이블",
    meetingRoomX + 1,
    meetingRoomY + 1,
    Math.max(meetingRoomWidth - 2, 1),
    Math.max(meetingRoomHeight - 2, 1),
    true,
  );

  const deskWidth = Math.min(5, Math.max(width - 5, 3));
  addRect("desk-row-a", "desk", "업무 데스크", 2, 2, deskWidth, 2, true);
  addRect("desk-row-b", "chair", "작업 의자", 2, 5, Math.min(4, deskWidth), 1, true);
  addRect("desk-row-c", "desk", "협업 데스크", 2, 7, Math.min(6, width - 4), 2, true);

  addRect("coffee-bar", "equipment", "커피 바", 2, Math.max(height - 2, 2), Math.min(5, width - 3), 1, true);
  addRect("printer", "equipment", "프린터", Math.max(Math.floor(width / 2) - 1, 0), Math.max(Math.floor(height / 2) - 1, 0), 2, 1, true);
  addRect("plant-left", "plant", "식물", 1, Math.max(height - 2, 0), 1, 1, true);
  addRect("plant-right", "plant", "식물", Math.max(width - 2, 0), 1, 1, 1, true);

  addRect("glass-divider", "wall", "유리 파티션", Math.max(Math.floor(width / 2) - 2, 0), 3, 1, Math.max(height - 4, 1), false);

  // 통로는 남겨두기 위해 중앙 일부는 다시 floor로 덮는다.
  addRect("corridor", "carpet", "동선", Math.max(Math.floor(width / 2) - 1, 0), Math.max(height / 2 - 1, 0), 3, 2, false);

  return {
    width,
    height,
    tiles,
    objects,
    blockedTiles,
  };
}

export function getTileKind(layout: TownLayout, x: number, y: number) {
  return layout.tiles[y]?.[x] ?? "floor";
}

export function isBlockedTile(layout: TownLayout, x: number, y: number) {
  return layout.blockedTiles.has(tileKey(x, y));
}

export function canMoveTo(layout: TownLayout, x: number, y: number) {
  if (x < 0 || y < 0 || x >= layout.width || y >= layout.height) {
    return false;
  }

  return !isBlockedTile(layout, x, y);
}

export function tileKey(x: number, y: number) {
  return `${x}:${y}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

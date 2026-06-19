import type { Room } from "./types";
import type { OfficeObject } from "./town-layout";

export function createBlockedTileSet(
  room: Pick<Room, "width" | "height">,
  objects: OfficeObject[],
) {
  const blocked = new Set<string>();

  for (const object of objects) {
    if (!object.blocked) {
      continue;
    }

    for (let y = object.y; y < object.y + object.height; y += 1) {
      for (let x = object.x; x < object.x + object.width; x += 1) {
        if (x >= 0 && x < room.width && y >= 0 && y < room.height) {
          blocked.add(getTileKey(x, y));
        }
      }
    }
  }

  return blocked;
}

export function isBlockedTile(blockedTiles: Set<string>, x: number, y: number) {
  return blockedTiles.has(getTileKey(x, y));
}

export function getTileKey(x: number, y: number) {
  return `${x}:${y}`;
}

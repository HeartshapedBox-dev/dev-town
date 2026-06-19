export const TOWN_TILE_SIZE = 42;

export function getTileCenter(tileX: number, tileY: number, tileSize = TOWN_TILE_SIZE) {
  return {
    left: tileX * tileSize + tileSize / 2,
    top: tileY * tileSize + tileSize / 2,
  };
}

export function getObjectStyle(x: number, y: number, width: number, height: number, tileSize = TOWN_TILE_SIZE) {
  return {
    left: `${x * tileSize}px`,
    top: `${y * tileSize}px`,
    width: `${width * tileSize}px`,
    height: `${height * tileSize}px`,
  };
}

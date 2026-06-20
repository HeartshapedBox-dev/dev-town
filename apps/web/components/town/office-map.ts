export type OfficeTileKind = "floor" | "carpet" | "walkway";

export type OfficeFurnitureKind =
  | "desk"
  | "chair"
  | "conference"
  | "plant"
  | "cabinet"
  | "waterCooler"
  | "whiteboard"
  | "sofa"
  | "coffee";

export type OfficeTile = {
  x: number;
  y: number;
  kind: OfficeTileKind;
};

export type OfficeFurniture = {
  id: string;
  kind: OfficeFurnitureKind;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  blocksMovement: boolean;
  layer: "back" | "front";
};

export type OfficeLayout = {
  width: number;
  height: number;
  tiles: OfficeTile[];
  furniture: OfficeFurniture[];
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const key = (x: number, y: number) => `${x}:${y}`;

function fillRect(
  tiles: OfficeTile[],
  width: number,
  height: number,
  kind: OfficeTileKind,
  x: number,
  y: number,
  rectWidth: number,
  rectHeight: number,
) {
  const startX = clamp(x, 0, Math.max(width - 1, 0));
  const startY = clamp(y, 0, Math.max(height - 1, 0));
  const endX = clamp(x + rectWidth - 1, 0, Math.max(width - 1, 0));
  const endY = clamp(y + rectHeight - 1, 0, Math.max(height - 1, 0));

  for (let currentY = startY; currentY <= endY; currentY += 1) {
    for (let currentX = startX; currentX <= endX; currentX += 1) {
      const index = currentY * width + currentX;
      if (tiles[index]) {
        tiles[index] = {
          x: currentX,
          y: currentY,
          kind,
        };
      }
    }
  }
}

function addFurniture(
  furniture: OfficeFurniture[],
  kind: OfficeFurnitureKind,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  blocksMovement = true,
  layer: OfficeFurniture["layer"] = "front",
) {
  furniture.push({
    id: `${kind}-${x}-${y}-${width}-${height}-${furniture.length}`,
    kind,
    label,
    x,
    y,
    width,
    height,
    blocksMovement,
    layer,
  });
}

function scaledPosition(value: number, span: number, size: number, margin = 1) {
  if (size <= margin * 2) {
    return 0;
  }

  const usable = Math.max(size - margin * 2 - span, 0);
  return clamp(Math.round(margin + usable * value), margin, Math.max(size - margin - span, margin));
}

export function buildOfficeLayout(width: number, height: number): OfficeLayout {
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);
  const tiles: OfficeTile[] = [];
  const furniture: OfficeFurniture[] = [];

  for (let y = 0; y < safeHeight; y += 1) {
    for (let x = 0; x < safeWidth; x += 1) {
      tiles.push({
        x,
        y,
        kind: "floor",
      });
    }
  }

  const deskX = clamp(safeWidth >= 12 ? 2 : scaledPosition(0.22, 3, safeWidth, 1), 0, Math.max(safeWidth - 3, 0));
  const deskY = clamp(safeHeight >= 11 ? 2 : scaledPosition(0.18, 2, safeHeight, 1), 0, Math.max(safeHeight - 3, 0));
  const meetingX = clamp(safeWidth >= 12 ? 7 : scaledPosition(0.63, 4, safeWidth, 1), 0, Math.max(safeWidth - 4, 0));
  const meetingY = clamp(safeHeight >= 11 ? 2 : scaledPosition(0.2, 3, safeHeight, 1), 0, Math.max(safeHeight - 3, 0));
  const boardX = clamp(safeWidth >= 12 ? 9 : scaledPosition(0.82, 2, safeWidth, 1), 0, Math.max(safeWidth - 2, 0));
  const boardY = clamp(safeHeight >= 11 ? 3 : scaledPosition(0.28, 3, safeHeight, 1), 0, Math.max(safeHeight - 3, 0));
  const cabinetX = clamp(safeWidth >= 12 ? 9 : scaledPosition(0.78, 2, safeWidth, 1), 0, Math.max(safeWidth - 2, 0));
  const cabinetY = clamp(safeHeight >= 11 ? 7 : scaledPosition(0.7, 2, safeHeight, 1), 0, Math.max(safeHeight - 2, 0));
  const loungeX = clamp(safeWidth >= 12 ? 7 : scaledPosition(0.72, 3, safeWidth, 1), 0, Math.max(safeWidth - 3, 0));
  const loungeY = clamp(safeHeight >= 11 ? 8 : scaledPosition(0.8, 2, safeHeight, 1), 0, Math.max(safeHeight - 2, 0));
  const coffeeX = clamp(safeWidth >= 12 ? 5 : scaledPosition(0.52, 2, safeWidth, 1), 0, Math.max(safeWidth - 2, 0));
  const coffeeY = clamp(safeHeight >= 11 ? 7 : scaledPosition(0.62, 2, safeHeight, 1), 0, Math.max(safeHeight - 1, 0));
  const coolerX = clamp(safeWidth >= 12 ? 1 : scaledPosition(0.2, 1, safeWidth, 1), 0, Math.max(safeWidth - 1, 0));
  const coolerY = clamp(safeHeight >= 11 ? 5 : scaledPosition(0.56, 2, safeHeight, 1), 0, Math.max(safeHeight - 2, 0));

  fillRect(tiles, safeWidth, safeHeight, "carpet", meetingX - 1, meetingY - 1, 6, 4);
  fillRect(tiles, safeWidth, safeHeight, "walkway", Math.max(2, Math.floor(safeWidth / 2) - 1), 0, 2, safeHeight);
  fillRect(tiles, safeWidth, safeHeight, "walkway", 0, Math.max(2, Math.floor(safeHeight / 2) - 1), safeWidth, 2);
  fillRect(tiles, safeWidth, safeHeight, "carpet", loungeX - 1, loungeY - 1, 4, 3);

  addFurniture(furniture, "conference", "회의 테이블", meetingX, meetingY, 3, 1, true, "back");
  addFurniture(furniture, "chair", "회의 의자", meetingX - 1, meetingY, 1, 1, false, "front");
  addFurniture(furniture, "chair", "회의 의자", meetingX + 3, meetingY, 1, 1, false, "front");
  addFurniture(furniture, "chair", "회의 의자", meetingX, meetingY - 1, 1, 1, false, "front");
  addFurniture(furniture, "chair", "회의 의자", meetingX + 2, meetingY - 1, 1, 1, false, "front");
  addFurniture(furniture, "desk", "공용 책상", deskX, deskY, 3, 2, true, "back");
  addFurniture(furniture, "chair", "책상 의자", deskX, deskY + 2, 1, 1, false, "front");
  addFurniture(furniture, "chair", "책상 의자", deskX + 2, deskY + 2, 1, 1, false, "front");
  addFurniture(furniture, "plant", "식물", Math.max(0, safeWidth - 2), 0, 1, 1, true, "front");
  addFurniture(furniture, "plant", "식물", 0, Math.max(0, safeHeight - 1), 1, 1, true, "front");
  addFurniture(furniture, "cabinet", "수납장", cabinetX, cabinetY, 2, 2, true, "back");
  addFurniture(furniture, "whiteboard", "회의실 보드", boardX, boardY, 2, 3, true, "back");
  addFurniture(furniture, "sofa", "라운지 소파", loungeX, loungeY, 3, 1, true, "front");
  addFurniture(furniture, "coffee", "커피 테이블", coffeeX, coffeeY, 2, 1, true, "front");
  addFurniture(furniture, "waterCooler", "워터쿨러", coolerX, coolerY, 1, 2, true, "front");

  return {
    width: safeWidth,
    height: safeHeight,
    tiles,
    furniture,
  };
}

export function isBlockedTile(layout: OfficeLayout, x: number, y: number) {
  return getBlockingFurniture(layout, x, y) !== null;
}

export function getBlockingFurniture(layout: OfficeLayout, x: number, y: number) {
  return layout.furniture.find((item) => {
    if (!item.blocksMovement) {
      return false;
    }

    return x >= item.x && x < item.x + item.width && y >= item.y && y < item.y + item.height;
  }) ?? null;
}

export function getTileClassName(kind: OfficeTileKind) {
  switch (kind) {
    case "carpet":
      return "carpet";
    case "walkway":
      return "walkway";
    case "floor":
    default:
      return "floor";
  }
}

export function getFurnitureClassName(kind: OfficeFurnitureKind) {
  switch (kind) {
    case "desk":
      return "desk";
    case "chair":
      return "chair";
    case "conference":
      return "conference";
    case "plant":
      return "plant";
    case "cabinet":
      return "cabinet";
    case "whiteboard":
      return "whiteboard";
    case "sofa":
      return "sofa";
    case "coffee":
      return "coffee";
    case "waterCooler":
      return "waterCooler";
  }
}

export function createTileKey(x: number, y: number) {
  return key(x, y);
}

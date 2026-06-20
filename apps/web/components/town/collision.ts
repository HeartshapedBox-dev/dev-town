import type { DeveloperSession } from "../../lib/types";
import type { OfficeLayout, OfficeFurniture } from "./office-map";
import { getBlockingFurniture, isBlockedTile } from "./office-map";

export function canMoveTo(layout: OfficeLayout, x: number, y: number) {
  if (x < 0 || y < 0 || x >= layout.width || y >= layout.height) {
    return false;
  }

  return !isBlockedTile(layout, x, y);
}

export function getBlockingItem(layout: OfficeLayout, x: number, y: number): OfficeFurniture | null {
  return getBlockingFurniture(layout, x, y);
}

export function getBlockingSession(
  sessions: DeveloperSession[],
  selfSessionId: string,
  x: number,
  y: number,
) {
  return sessions.find((candidate) => {
    if (candidate.id === selfSessionId || candidate.status !== "ONLINE") {
      return false;
    }

    return candidate.positionX === x && candidate.positionY === y;
  }) ?? null;
}

export function getBlockedMoveMessage(blockingItem: OfficeFurniture | null) {
  if (!blockingItem) {
    return "그 위치로는 이동할 수 없습니다.";
  }

  switch (blockingItem.kind) {
    case "desk":
      return "책상에 막혀 이동할 수 없습니다.";
    case "conference":
      return "회의 테이블에 막혀 이동할 수 없습니다.";
    case "plant":
      return "식물 자리에 막혀 이동할 수 없습니다.";
    case "cabinet":
      return "수납장에 막혀 이동할 수 없습니다.";
    case "whiteboard":
      return "회의실 보드에 막혀 이동할 수 없습니다.";
    case "sofa":
      return "라운지 소파에 막혀 이동할 수 없습니다.";
    case "coffee":
      return "커피 테이블에 막혀 이동할 수 없습니다.";
    case "chair":
      return "의자에 막혀 이동할 수 없습니다.";
    default:
      return "그 위치로는 이동할 수 없습니다.";
  }
}

export function getBlockedSessionMoveMessage() {
  return "다른 사용자가 있어 이동할 수 없습니다";
}

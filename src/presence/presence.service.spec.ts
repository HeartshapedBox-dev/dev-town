import { PresenceService } from "./presence.service";

describe("PresenceService", () => {
  const presenceService = new PresenceService({} as never);

  // 마주보는 두 세션이면 채팅이 열릴 수 있는 상태인지 확인한다.
  it("returns true when two sessions face each other", () => {
    const left = {
      id: "session-a",
      roomId: "room-1",
      positionX: 1,
      positionY: 1,
      direction: "RIGHT",
    } as never;
    const right = {
      id: "session-b",
      roomId: "room-1",
      positionX: 2,
      positionY: 1,
      direction: "LEFT",
    } as never;

    expect(presenceService.canStartConversation(left, right)).toBe(true);
  });

  // 위치나 방향이 어긋나면 채팅을 열 수 없는지 확인한다.
  it("returns false when facing condition breaks", () => {
    const left = {
      id: "session-a",
      roomId: "room-1",
      positionX: 1,
      positionY: 1,
      direction: "RIGHT",
    } as never;
    const right = {
      id: "session-b",
      roomId: "room-1",
      positionX: 3,
      positionY: 1,
      direction: "LEFT",
    } as never;

    expect(presenceService.canStartConversation(left, right)).toBe(false);
  });
});

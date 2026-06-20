import { PresenceService } from "./presence.service";

describe("PresenceService", () => {
  const presenceRepository = {
    create: jest.fn(),
    findRoomById: jest.fn(),
    listOnlineByRoom: jest.fn(),
    updatePosition: jest.fn(),
  };
  const prismaService = {
    room: {
      updateMany: jest.fn(),
    },
  };
  const presenceService = new PresenceService(presenceRepository as never, prismaService as never);

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

  it("blocks moving into a tile occupied by another online session", async () => {
    presenceRepository.findRoomById.mockResolvedValue({
      id: "room-1",
      width: 12,
      height: 11,
    });
    presenceRepository.listOnlineByRoom.mockResolvedValue([
      {
        id: "session-a",
        roomId: "room-1",
        positionX: 6,
        positionY: 9,
        direction: "RIGHT",
        status: "ONLINE",
      },
      {
        id: "session-b",
        roomId: "room-1",
        positionX: 7,
        positionY: 9,
        direction: "LEFT",
        status: "ONLINE",
      },
    ]);

    await expect(
      presenceService.updatePosition("session-a", {
        roomId: "room-1",
        positionX: 7,
        positionY: 9,
        direction: "RIGHT",
      }),
    ).rejects.toThrow("다른 사용자가 있어 이동할 수 없습니다");
  });

  it("allows moving into an empty tile", async () => {
    presenceRepository.findRoomById.mockResolvedValue({
      id: "room-1",
      width: 12,
      height: 11,
    });
    presenceRepository.listOnlineByRoom.mockResolvedValue([]);
    presenceRepository.updatePosition.mockResolvedValue({
      id: "session-a",
      roomId: "room-1",
      positionX: 6,
      positionY: 10,
      direction: "DOWN",
      status: "ONLINE",
    });

    await expect(
      presenceService.updatePosition("session-a", {
        roomId: "room-1",
        positionX: 6,
        positionY: 10,
        direction: "DOWN",
      }),
    ).resolves.toMatchObject({
      positionX: 6,
      positionY: 10,
    });
  });

  it("blocks moving outside the room bounds", async () => {
    presenceRepository.findRoomById.mockResolvedValue({
      id: "room-1",
      width: 12,
      height: 11,
    });
    presenceRepository.listOnlineByRoom.mockResolvedValue([]);

    await expect(
      presenceService.updatePosition("session-a", {
        roomId: "room-1",
        positionX: 12,
        positionY: 9,
        direction: "RIGHT",
      }),
    ).rejects.toThrow("이동하려는 위치는 보이는 맵 밖입니다");
  });

  it("spawns the first session at the origin", async () => {
    presenceRepository.findRoomById.mockResolvedValue({
      id: "room-1",
      width: 12,
      height: 11,
    });
    presenceRepository.listOnlineByRoom.mockResolvedValue([]);
    presenceRepository.create.mockResolvedValue({
      id: "session-a",
      roomId: "room-1",
      positionX: 0,
      positionY: 0,
      direction: "UP",
      status: "ONLINE",
    });
    prismaService.room.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      presenceService.createSession({
        roomId: "room-1",
        displayName: "tester1",
      } as never),
    ).resolves.toMatchObject({
      positionX: 0,
      positionY: 0,
    });

    expect(presenceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        positionX: 0,
        positionY: 0,
      }),
    );
  });

  it("creates a session in a free spawn tile when other sessions already occupy the room", async () => {
    presenceRepository.findRoomById.mockResolvedValue({
      id: "room-1",
      width: 12,
      height: 11,
    });
    presenceRepository.listOnlineByRoom.mockResolvedValue([
      {
        id: "session-a",
        roomId: "room-1",
        positionX: 0,
        positionY: 0,
        direction: "RIGHT",
        status: "ONLINE",
      },
    ]);
    presenceRepository.create.mockResolvedValue({
      id: "session-c",
      roomId: "room-1",
      positionX: 0,
      positionY: 1,
      direction: "UP",
      status: "ONLINE",
    });
    prismaService.room.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      presenceService.createSession({
        roomId: "room-1",
        displayName: "tester3",
      } as never),
    ).resolves.toMatchObject({
      positionX: 0,
      positionY: 1,
    });

    expect(presenceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        positionX: 0,
        positionY: 1,
      }),
    );
    expect(prismaService.room.updateMany).toHaveBeenCalledWith({
      where: {
        id: "room-1",
        ownerSessionId: null,
      },
      data: {
        ownerSessionId: "session-c",
      },
    });
  });
});

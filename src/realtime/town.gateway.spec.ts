import { TownGateway } from "./town.gateway";

type MockSocket = {
  id: string;
  rooms: Set<string>;
  join: jest.Mock<Promise<void>, [string]>;
  leave: jest.Mock<Promise<void>, [string]>;
  emit: jest.Mock<void, [string, unknown]>;
};

type SessionLike = {
  id: string;
  positionX: number;
  positionY: number;
  direction: string;
};

function createMockSocket(id: string): MockSocket {
  const rooms = new Set<string>();

  return {
    id,
    rooms,
    join: jest.fn(async (room: string) => {
      rooms.add(room);
    }),
    leave: jest.fn(async (room: string) => {
      rooms.delete(room);
    }),
    emit: jest.fn(),
  };
}

function createServerMock() {
  const emit = jest.fn();
  return {
    to: jest.fn(() => ({ emit })),
    emit,
  };
}

describe("TownGateway", () => {
  // 이 테스트는 실제 게이트웨이의 실시간 상태 전환만 검증하도록 최소한의 목을 만든다.
  const room = { id: "room-1", width: 20, height: 12 };
  const conversation = {
    id: "conversation-1",
    roomId: room.id,
    participantAId: "session-a",
    participantBId: "session-b",
  };

  let gateway: TownGateway;
  let presenceService: {
    listRoomSessions: jest.Mock;
    updatePosition: jest.Mock;
    canStartConversation: jest.Mock;
  };
  let chatService: {
    findOrCreateConversation: jest.Mock;
    sendMessage: jest.Mock;
  };
  let roomsService: {
    joinByInviteCode: jest.Mock;
  };
  let server: ReturnType<typeof createServerMock>;
  let socketA: MockSocket;
  let socketB: MockSocket;
  let sessionA: Record<string, unknown>;
  let sessionBAfterJoin: Record<string, unknown>;
  let sessionBAfterMoveAway: Record<string, unknown>;
  let roomSessions: Array<Record<string, unknown>>;

  beforeEach(() => {
    // 각 테스트는 독립적인 소켓/서버/서비스 목을 사용해서 상태 오염을 막는다.
    socketA = createMockSocket("socket-a");
    socketB = createMockSocket("socket-b");
    server = createServerMock();

    sessionA = {
      id: "session-a",
      roomId: room.id,
      positionX: 1,
      positionY: 1,
      direction: "RIGHT",
    };
    sessionBAfterJoin = {
      id: "session-b",
      roomId: room.id,
      positionX: 2,
      positionY: 1,
      direction: "LEFT",
    };
    sessionBAfterMoveAway = {
      id: "session-b",
      roomId: room.id,
      positionX: 5,
      positionY: 5,
      direction: "LEFT",
    };
    roomSessions = [sessionA];

    presenceService = {
      listRoomSessions: jest.fn(async () => roomSessions),
      updatePosition: jest.fn(async () => sessionA),
      canStartConversation: jest.fn((left: SessionLike, right: SessionLike) => {
        return (
          (left?.id === "session-a" &&
            right?.id === "session-b" &&
            left.positionX + 1 === right.positionX &&
            left.positionY === right.positionY &&
            left.direction === "RIGHT" &&
            right.direction === "LEFT") ||
          (left?.id === "session-b" &&
            right?.id === "session-a" &&
            left.positionX - 1 === right.positionX &&
            left.positionY === right.positionY &&
            left.direction === "LEFT" &&
            right.direction === "RIGHT")
        );
      }),
    };

    chatService = {
      findOrCreateConversation: jest.fn(async () => conversation),
      sendMessage: jest.fn(),
    };

    roomsService = {
      joinByInviteCode: jest.fn(),
    };

    gateway = new TownGateway(
      presenceService as never,
      chatService as never,
      roomsService as never,
    );
    (gateway as unknown as { server: typeof server }).server = server;
  });

  // 서로 마주봤을 때 conversationOpened가 발생하고 room join이 일어나는지 확인한다.
  it("opens a conversation and joins the conversation room when two characters face each other", async () => {
    roomsService.joinByInviteCode
      .mockResolvedValueOnce({ room, session: sessionA })
      .mockResolvedValueOnce({ room, session: sessionBAfterJoin });

    // 첫 캐릭터는 아직 상대가 없으므로 채팅방이 열리지 않는다.
    await gateway.joinByInviteCode(socketA as never, { inviteCode: "ABCD12" } as never);
    roomSessions = [sessionA, sessionBAfterJoin];
    // 두 번째 캐릭터가 들어와 마주보게 되면 채팅방이 자동으로 열린다.
    await gateway.joinByInviteCode(socketB as never, { inviteCode: "ABCD12" } as never);

    expect(chatService.findOrCreateConversation).toHaveBeenCalledWith({
      requesterSessionId: "session-b",
      peerSessionId: "session-a",
    });
    expect(server.to).toHaveBeenCalledWith("conversation:conversation-1");
    expect(server.emit).toHaveBeenCalledWith("conversationOpened", conversation);
    expect(socketA.join).toHaveBeenCalledWith("conversation:conversation-1");
    expect(socketB.join).toHaveBeenCalledWith("conversation:conversation-1");
  });

  // 떨어지거나 방향이 바뀌어 조건이 깨지면 conversationClosed가 발생하고 room에서 이탈하는지 확인한다.
  it("closes a conversation and leaves the conversation room when the facing condition breaks", async () => {
    roomsService.joinByInviteCode
      .mockResolvedValueOnce({ room, session: sessionA })
      .mockResolvedValueOnce({ room, session: sessionBAfterJoin });
    presenceService.updatePosition.mockResolvedValue(sessionBAfterMoveAway);

    // 먼저 마주보는 상태를 만들어 채팅방이 열린 상태로 시작한다.
    await gateway.joinByInviteCode(socketA as never, { inviteCode: "ABCD12" } as never);
    roomSessions = [sessionA, sessionBAfterJoin];
    await gateway.joinByInviteCode(socketB as never, { inviteCode: "ABCD12" } as never);

    // 이후 두 번째 캐릭터가 멀어지면 채팅방이 닫혀야 한다.
    roomSessions = [sessionA, sessionBAfterMoveAway];
    await gateway.move(socketB as never, {
      sessionId: "session-b",
      roomId: room.id,
      positionX: 5,
      positionY: 5,
      direction: "LEFT",
    } as never);

    expect(presenceService.updatePosition).toHaveBeenCalledWith("session-b", {
      roomId: room.id,
      positionX: 5,
      positionY: 5,
      direction: "LEFT",
    });
    expect(server.to).toHaveBeenCalledWith("conversation:conversation-1");
    expect(server.emit).toHaveBeenCalledWith("conversationClosed", {
      conversationId: "conversation-1",
      participantAId: "session-a",
      participantBId: "session-b",
    });
    expect(socketA.leave).toHaveBeenCalledWith("conversation:conversation-1");
    expect(socketB.leave).toHaveBeenCalledWith("conversation:conversation-1");
  });

  // 방향만 바뀌어도 마주보기 조건이 깨지면 채팅방이 닫혀야 한다.
  it("closes a conversation when direction changes break the facing condition", async () => {
    roomsService.joinByInviteCode
      .mockResolvedValueOnce({ room, session: sessionA })
      .mockResolvedValueOnce({ room, session: sessionBAfterJoin });

    await gateway.joinByInviteCode(socketA as never, { inviteCode: "ABCD12" } as never);
    roomSessions = [sessionA, sessionBAfterJoin];
    await gateway.joinByInviteCode(socketB as never, { inviteCode: "ABCD12" } as never);

    // 위치는 유지하지만 방향만 바꾸면 더 이상 서로를 바라보지 않게 된다.
    roomSessions = [
      sessionA,
      {
        ...sessionBAfterJoin,
        direction: "RIGHT",
      },
    ];
    await gateway.move(socketB as never, {
      sessionId: "session-b",
      roomId: room.id,
      positionX: 2,
      positionY: 1,
      direction: "RIGHT",
    } as never);

    expect(server.emit).toHaveBeenCalledWith("conversationClosed", {
      conversationId: "conversation-1",
      participantAId: "session-a",
      participantBId: "session-b",
    });
    expect(socketA.leave).toHaveBeenCalledWith("conversation:conversation-1");
    expect(socketB.leave).toHaveBeenCalledWith("conversation:conversation-1");
  });
});

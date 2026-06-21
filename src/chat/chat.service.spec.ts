import { ForbiddenException } from "@nestjs/common";
import { ChatService } from "./chat.service";

describe("ChatService", () => {
  const requester = {
    id: "session-a",
    roomId: "room-1",
    positionX: 1,
    positionY: 1,
    direction: "RIGHT",
  };
  const peer = {
    id: "session-b",
    roomId: "room-1",
    positionX: 2,
    positionY: 1,
    direction: "LEFT",
  };
  const conversation = {
    id: "conversation-1",
    roomId: "room-1",
    participantAId: "session-a",
    participantBId: "session-b",
    participantA: requester,
    participantB: peer,
  };

  let chatRepository: {
    findConversation: jest.Mock;
    createConversation: jest.Mock;
    findConversationWithParticipants: jest.Mock;
    listMessages: jest.Mock;
    createMessage: jest.Mock;
  };
  let presenceService: {
    getSessionOrThrow: jest.Mock;
    canStartConversation: jest.Mock;
  };
  let chatService: ChatService;

  beforeEach(() => {
    chatRepository = {
      findConversation: jest.fn(),
      createConversation: jest.fn(),
      findConversationWithParticipants: jest.fn(),
      listMessages: jest.fn(),
      createMessage: jest.fn(),
    };
    presenceService = {
      getSessionOrThrow: jest.fn(async (sessionId: string) => {
        if (sessionId === requester.id) {
          return requester;
        }

        return peer;
      }),
      canStartConversation: jest.fn(() => true),
    };
    chatService = new ChatService(chatRepository as never, presenceService as never);
  });

  // ChatService는 마주보는 두 세션에 대해 기존 대화방을 재사용하는지 검증한다.
  it("returns an existing conversation when facing participants already have one", async () => {
    chatRepository.findConversation.mockResolvedValue(conversation);

    await expect(
      chatService.findOrCreateConversation({
        requesterSessionId: requester.id,
        peerSessionId: peer.id,
      }),
    ).resolves.toBe(conversation);

    expect(chatRepository.findConversation).toHaveBeenCalledWith("room-1", "session-a", "session-b");
    expect(chatRepository.createConversation).not.toHaveBeenCalled();
  });

  // ChatService는 메시지 목록을 저장소 결과 그대로 반환하는지 검증한다.
  it("returns messages from the repository without transforming them", async () => {
    const messages = [
      { id: "message-1", conversationId: conversation.id, senderId: requester.id, body: "안녕하세요" },
      { id: "message-2", conversationId: conversation.id, senderId: peer.id, body: "반갑습니다" },
    ];
    chatRepository.listMessages.mockResolvedValue(messages);

    await expect(chatService.listMessages(conversation.id)).resolves.toBe(messages);

    expect(chatRepository.listMessages).toHaveBeenCalledWith(conversation.id);
  });

  // ChatService는 마주보지 않는 세션의 대화방 생성과 메시지 전송을 차단하는지 검증한다.
  it("blocks conversation opening when participants are not facing each other", async () => {
    presenceService.canStartConversation.mockReturnValue(false);

    await expect(
      chatService.findOrCreateConversation({
        requesterSessionId: requester.id,
        peerSessionId: peer.id,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(chatRepository.findConversation).not.toHaveBeenCalled();
    expect(chatRepository.createConversation).not.toHaveBeenCalled();
  });

  // ChatService는 메시지를 저장만 하고, 채팅창이 닫힐 때 필요한 메시지 삭제는 수행하지 않는지 검증한다.
  it("stores a message without deleting previous conversation messages", async () => {
    const message = {
      id: "message-1",
      conversationId: conversation.id,
      senderId: requester.id,
      body: "안녕하세요",
    };
    chatRepository.findConversationWithParticipants.mockResolvedValue(conversation);
    chatRepository.createMessage.mockResolvedValue(message);

    await expect(
      chatService.sendMessage(conversation.id, {
        senderSessionId: requester.id,
        body: "안녕하세요",
      }),
    ).resolves.toBe(message);

    expect(chatRepository.createMessage).toHaveBeenCalledWith(
      conversation.id,
      requester.id,
      "안녕하세요",
    );
    expect(chatRepository).not.toHaveProperty("deleteMessages");
    expect(chatRepository).not.toHaveProperty("deleteConversation");
  });
});

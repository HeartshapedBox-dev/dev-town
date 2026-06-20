import { RoomsService } from "./rooms.service";

describe("RoomsService", () => {
  const roomsRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByInviteCode: jest.fn(),
    deleteById: jest.fn(),
  };
  const presenceService = {
    createRandomSession: jest.fn(),
  };
  let transaction: {
    chatMessage: { deleteMany: jest.Mock };
    conversation: { deleteMany: jest.Mock };
    developerSession: { deleteMany: jest.Mock };
    room: { delete: jest.Mock };
  } | null = null;
  const prismaService = {
    $transaction: jest.fn(async (callback: (tx: {
      chatMessage: { deleteMany: jest.Mock };
      conversation: { deleteMany: jest.Mock };
      developerSession: { deleteMany: jest.Mock };
      room: { delete: jest.Mock };
    }) => Promise<void>) => {
      transaction = {
        chatMessage: { deleteMany: jest.fn() },
        conversation: { deleteMany: jest.fn() },
        developerSession: { deleteMany: jest.fn() },
        room: { delete: jest.fn() },
      };

      await callback(transaction);
      return transaction;
    }),
  };
  const roomsService = new RoomsService(
    roomsRepository as never,
    presenceService as never,
    prismaService as never,
  );

  it("deletes room data in the correct order", async () => {
    await roomsService.destroyRoom("room-1");

    expect(prismaService.$transaction).toHaveBeenCalled();
    expect(transaction).not.toBeNull();
    if (!transaction) {
      return;
    }

    expect(transaction.chatMessage.deleteMany).toHaveBeenCalledWith({
      where: {
        conversation: {
          roomId: "room-1",
        },
      },
    });
    expect(transaction.conversation.deleteMany).toHaveBeenCalledWith({
      where: { roomId: "room-1" },
    });
    expect(transaction.developerSession.deleteMany).toHaveBeenCalledWith({
      where: { roomId: "room-1" },
    });
    expect(transaction.room.delete).toHaveBeenCalledWith({
      where: { id: "room-1" },
    });
  });
});

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

// 대화방과 메시지 저장소 접근을 Prisma 계층으로 분리한다.
@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  findConversation(roomId: string, participantAId: string, participantBId: string) {
    return this.prisma.conversation.findUnique({
      where: {
        roomId_participantAId_participantBId: {
          roomId,
          participantAId,
          participantBId,
        },
      },
    });
  }

  createConversation(roomId: string, participantAId: string, participantBId: string) {
    return this.prisma.conversation.create({
      data: {
        roomId,
        participantAId,
        participantBId,
      },
    });
  }

  findConversationWithParticipants(conversationId: string) {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participantA: true,
        participantB: true,
      },
    });
  }

  listMessages(conversationId: string) {
    return this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
  }

  createMessage(conversationId: string, senderId: string, body: string) {
    return this.prisma.chatMessage.create({
      data: {
        conversationId,
        senderId,
        body,
      },
    });
  }
}

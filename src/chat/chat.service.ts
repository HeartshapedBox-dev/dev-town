import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { DeveloperSession } from "@prisma/client";
import { PresenceService } from "../presence/presence.service";
import { FindOrCreateConversationDto } from "./dto/find-or-create-conversation.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { ChatRepository } from "./repositories/chat.repository";

// 대화방 열기와 메시지 전송 전에 마주보기 조건을 검증한다.
@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly presenceService: PresenceService,
  ) {}

  async findOrCreateConversation(dto: FindOrCreateConversationDto) {
    const requester = await this.presenceService.getSessionOrThrow(dto.requesterSessionId);
    const peer = await this.presenceService.getSessionOrThrow(dto.peerSessionId);

    this.assertCanChat(requester, peer);

    const [participantAId, participantBId] = this.sortParticipants(requester.id, peer.id);
    const existing = await this.chatRepository.findConversation(
      requester.roomId,
      participantAId,
      participantBId,
    );

    return existing ?? this.chatRepository.createConversation(
      requester.roomId,
      participantAId,
      participantBId,
    );
  }

  listMessages(conversationId: string) {
    return this.chatRepository.listMessages(conversationId);
  }

  async sendMessage(conversationId: string, dto: SendMessageDto) {
    const conversation = await this.chatRepository.findConversationWithParticipants(conversationId);
    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    const sender = this.getParticipant(conversation, dto.senderSessionId);
    const peer = sender.id === conversation.participantAId
      ? conversation.participantB
      : conversation.participantA;

    this.assertCanChat(sender, peer);

    return this.chatRepository.createMessage(conversationId, sender.id, dto.body);
  }

  private assertCanChat(requester: DeveloperSession, peer: DeveloperSession) {
    if (!this.presenceService.canStartConversation(requester, peer)) {
      throw new ForbiddenException("Characters must be facing each other to chat");
    }
  }

  private sortParticipants(a: string, b: string) {
    return [a, b].sort() as [string, string];
  }

  private getParticipant(
    conversation: Awaited<ReturnType<ChatRepository["findConversationWithParticipants"]>>,
    senderSessionId: string,
  ) {
    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    if (conversation.participantAId === senderSessionId) {
      return conversation.participantA;
    }

    if (conversation.participantBId === senderSessionId) {
      return conversation.participantB;
    }

    throw new ForbiddenException("Sender is not a conversation participant");
  }
}

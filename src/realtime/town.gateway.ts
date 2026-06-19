import { UsePipes, ValidationPipe } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { DeveloperSession } from "@prisma/client";
import { Server, Socket } from "socket.io";
import { ChatService } from "../chat/chat.service";
import { FindOrCreateConversationDto } from "../chat/dto/find-or-create-conversation.dto";
import { PresenceService } from "../presence/presence.service";
import { JoinRoomByInviteDto } from "../rooms/dto/join-room-by-invite.dto";
import { RoomsService } from "../rooms/rooms.service";
import { JoinConversationDto } from "./dto/join-conversation.dto";
import { JoinRoomDto } from "./dto/join-room.dto";
import { MoveCharacterDto } from "./dto/move-character.dto";
import { SendRealtimeMessageDto } from "./dto/send-realtime-message.dto";
import { UpdatePositionDto } from "../presence/dto/update-position.dto";

type ConversationState = {
  id: string;
  participantAId: string;
  participantBId: string;
  roomId: string;
};

// 캐릭터 이동과 채팅 상태를 Socket.IO room 단위로 전달한다.
// 여기서는 "마주보면 열림, 조건이 깨지면 닫힘" 상태 전이를 실시간으로 계산한다.
@WebSocketGateway({
  namespace: "town",
  cors: {
    origin: true,
    credentials: true,
  },
})
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class TownGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server!: Server;

  // 소켓 단위로 세션을 추적해서 같은 캐릭터의 여러 탭/연결을 함께 관리한다.
  private readonly sessionSockets = new Map<string, Set<string>>();
  // 세션 ID와 연결된 실제 소켓 인스턴스를 보관한다.
  private readonly sockets = new Map<string, Socket>();
  // 현재 실시간 채팅이 열려 있다고 판단한 대화방을 메모리에서 추적한다.
  private readonly activeConversations = new Map<string, ConversationState>();

  constructor(
    private readonly presenceService: PresenceService,
    private readonly chatService: ChatService,
    private readonly roomsService: RoomsService,
  ) {}

  // 소켓이 끊기면 세션-소켓 매핑만 즉시 정리한다.
  // 대화 종료는 이동/상태 변화 시점에 다시 계산되므로, 여기서는 room 정리만 최소화한다.
  handleDisconnect(client: Socket) {
    this.sockets.delete(client.id);

    for (const [sessionId, socketIds] of this.sessionSockets.entries()) {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.sessionSockets.delete(sessionId);
      }
    }
  }

  @SubscribeMessage("joinByInviteCode")
  async joinByInviteCode(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomByInviteDto,
  ) {
    // 초대코드로 입장하면 세션을 등록하고, 같은 방의 채팅 상태도 즉시 다시 계산한다.
    const result = await this.roomsService.joinByInviteCode(payload);
    this.registerSessionSocket(result.session.id, client);
    await client.join(result.room.id);
    this.server.to(result.room.id).emit("characterJoined", result.session);
    await this.syncConversationState(result.session);
    return result;
  }

  @SubscribeMessage("joinRoom")
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomDto,
  ) {
    await client.join(payload.roomId);
    return this.presenceService.listRoomSessions(payload.roomId);
  }

  @SubscribeMessage("move")
  async move(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MoveCharacterDto,
  ) {
    // 이동 요청이 들어오면 좌표 갱신 후, 마주보기 조건 변화에 따른 채팅 상태를 다시 계산한다.
    const { sessionId, ...position } = payload;
    const session = await this.presenceService.updatePosition(
      sessionId,
      position as UpdatePositionDto,
    );
    this.registerSessionSocket(session.id, client);
    await client.join(session.roomId);
    this.server.to(session.roomId).emit("characterMoved", session);
    await this.syncConversationState(session);
    return session;
  }

  @SubscribeMessage("openConversation")
  async openConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: FindOrCreateConversationDto,
  ) {
    // 명시적으로 대화방을 열 때도 같은 세션 추적과 room join을 재사용한다.
    const conversation = await this.chatService.findOrCreateConversation(payload);
    this.registerSessionSocket(payload.requesterSessionId, client);
    await this.activateConversation(conversation);
    return conversation;
  }

  @SubscribeMessage("joinConversation")
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinConversationDto,
  ) {
    // 이미 열려 있는 대화방 room에만 참여시키고, 메시지 이력은 그대로 유지한다.
    await client.join(this.getConversationRoom(payload.conversationId));
    return { conversationId: payload.conversationId, joined: true };
  }

  @SubscribeMessage("sendMessage")
  async sendMessage(
    @MessageBody() payload: SendRealtimeMessageDto,
  ) {
    // 메시지는 conversation room에 브로드캐스트되며, 조건이 깨졌다면 서비스 단계에서 차단된다.
    const message = await this.chatService.sendMessage(payload.conversationId, payload);
    this.server
      .to(this.getConversationRoom(payload.conversationId))
      .emit("messageCreated", message);
    return message;
  }

  private async syncConversationState(session: DeveloperSession) {
    // 현재 세션이 바라보고 있는 상대를 계산해서 열어야 할 대화방과 닫아야 할 대화방을 구분한다.
    const peers = await this.presenceService.listRoomSessions(session.roomId);
    const eligiblePairs = new Set<string>();

    for (const peer of peers) {
      if (peer.id === session.id) {
        continue;
      }

      if (!this.presenceService.canStartConversation(session, peer)) {
        continue;
      }

      const pairKey = this.getConversationPairKey(session.id, peer.id);
      eligiblePairs.add(pairKey);

      const activeConversation = this.activeConversations.get(pairKey);
      if (activeConversation) {
        // 이미 열려 있는 대화방이면 room 참여만 보강하고 중복 open 이벤트는 피한다.
        const newlyJoinedSockets = await this.joinConversationSockets(activeConversation);
        for (const socket of newlyJoinedSockets) {
          socket.emit("conversationOpened", activeConversation);
        }
        continue;
      }

      // 새로 마주본 상대라면 conversation을 만들거나 재사용하고 open 이벤트를 전달한다.
      const conversation = await this.chatService.findOrCreateConversation({
        requesterSessionId: session.id,
        peerSessionId: peer.id,
      });

      await this.activateConversation(conversation);
    }

    for (const [pairKey, conversation] of this.activeConversations.entries()) {
      if (!this.isConversationInvolvingSession(pairKey, session.id)) {
        continue;
      }

      if (eligiblePairs.has(pairKey)) {
        continue;
      }

      // 더 이상 마주보지 않으면 채팅창을 닫고 conversation room에서 이탈시킨다.
      await this.deactivateConversation(conversation);
    }
  }

  private async activateConversation(conversation: ConversationState) {
    const pairKey = this.getConversationPairKey(conversation.participantAId, conversation.participantBId);
    const wasActive = this.activeConversations.has(pairKey);

    this.activeConversations.set(pairKey, conversation);
    const newlyJoinedSockets = await this.joinConversationSockets(conversation);

    if (!wasActive) {
      // 최초로 열린 경우에는 room 전체에 open 이벤트를 브로드캐스트한다.
      this.server.to(this.getConversationRoom(conversation.id)).emit("conversationOpened", conversation);
    } else {
      // 기존 대화방에 새 소켓이 붙은 경우에는 해당 소켓에만 open 이벤트를 보낸다.
      for (const socket of newlyJoinedSockets) {
        socket.emit("conversationOpened", conversation);
      }
    }

    return conversation;
  }

  private async deactivateConversation(conversation: ConversationState) {
    const pairKey = this.getConversationPairKey(conversation.participantAId, conversation.participantBId);
    const activeConversation = this.activeConversations.get(pairKey);

    if (!activeConversation || activeConversation.id !== conversation.id) {
      return;
    }

    this.server.to(this.getConversationRoom(conversation.id)).emit("conversationClosed", {
      conversationId: conversation.id,
      participantAId: conversation.participantAId,
      participantBId: conversation.participantBId,
    });

    // 닫힐 때는 room에서 빠지게만 하고, 대화 메시지는 DB에 그대로 남긴다.
    await this.leaveConversationSockets(conversation);
    this.activeConversations.delete(pairKey);
  }

  private async joinConversationSockets(conversation: ConversationState) {
    const room = this.getConversationRoom(conversation.id);
    const participantSockets = this.getParticipantSockets(conversation);
    const newlyJoinedSockets = participantSockets.filter((socket) => !socket.rooms.has(room));

    // 소켓 room 참여는 브로드캐스트 대상과 직접 메시지 대상이 모두 일치하도록 동기화한다.
    await Promise.all(participantSockets.map((socket) => socket.join(room)));
    return newlyJoinedSockets;
  }

  private async leaveConversationSockets(conversation: ConversationState) {
    const room = this.getConversationRoom(conversation.id);
    const participantSockets = this.getParticipantSockets(conversation);

    // room 이탈은 화면에서 채팅창을 닫기 위한 상태 전환에만 사용하고, 기록은 지우지 않는다.
    await Promise.all(participantSockets.map((socket) => socket.leave(room)));
  }

  private registerSessionSocket(sessionId: string, client: Socket) {
    // 같은 세션이 여러 소켓으로 연결되어도 모두 추적할 수 있게 저장한다.
    this.sockets.set(client.id, client);

    const socketIds = this.sessionSockets.get(sessionId) ?? new Set<string>();
    socketIds.add(client.id);
    this.sessionSockets.set(sessionId, socketIds);
  }

  private getParticipantSockets(conversation: Pick<ConversationState, "participantAId" | "participantBId">) {
    const participantIds = [conversation.participantAId, conversation.participantBId];

    return participantIds.flatMap((sessionId) => {
      const socketIds = this.sessionSockets.get(sessionId) ?? new Set<string>();
      return Array.from(socketIds)
        .map((socketId) => this.sockets.get(socketId))
        .filter((socket): socket is Socket => Boolean(socket));
    });
  }

  private getConversationRoom(conversationId: string) {
    return `conversation:${conversationId}`;
  }

  private getConversationPairKey(a: string, b: string) {
    // 참가자 순서를 고정해 같은 두 세션을 항상 같은 키로 묶는다.
    return [a, b].sort().join(":");
  }

  private isConversationInvolvingSession(pairKey: string, sessionId: string) {
    const [participantAId, participantBId] = pairKey.split(":");
    return participantAId === sessionId || participantBId === sessionId;
  }
}

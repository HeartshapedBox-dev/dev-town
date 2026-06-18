import { UsePipes, ValidationPipe } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChatService } from "../chat/chat.service";
import { FindOrCreateConversationDto } from "../chat/dto/find-or-create-conversation.dto";
import { PresenceService } from "../presence/presence.service";
import { JoinConversationDto } from "./dto/join-conversation.dto";
import { JoinRoomDto } from "./dto/join-room.dto";
import { MoveCharacterDto } from "./dto/move-character.dto";
import { SendRealtimeMessageDto } from "./dto/send-realtime-message.dto";
import { JoinRoomByInviteDto } from "../rooms/dto/join-room-by-invite.dto";
import { RoomsService } from "../rooms/rooms.service";

// 캐릭터 이동과 채팅 이벤트를 Socket.IO room 단위로 전달한다.
@WebSocketGateway({ namespace: "town", cors: true })
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class TownGateway {
  @WebSocketServer()
  private readonly server!: Server;

  constructor(
    private readonly presenceService: PresenceService,
    private readonly chatService: ChatService,
    private readonly roomsService: RoomsService,
  ) {}

  @SubscribeMessage("joinByInviteCode")
  async joinByInviteCode(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomByInviteDto,
  ) {
    const result = await this.roomsService.joinByInviteCode(payload);
    await client.join(result.room.id);
    this.server.to(result.room.id).emit("characterJoined", result.session);
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
    const session = await this.presenceService.updatePosition(payload.sessionId, payload);
    await client.join(session.roomId);
    this.server.to(session.roomId).emit("characterMoved", session);
    return session;
  }

  @SubscribeMessage("openConversation")
  async openConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: FindOrCreateConversationDto,
  ) {
    const conversation = await this.chatService.findOrCreateConversation(payload);
    await client.join(this.getConversationRoom(conversation.id));
    client.emit("conversationOpened", conversation);
    return conversation;
  }

  @SubscribeMessage("joinConversation")
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinConversationDto,
  ) {
    await client.join(this.getConversationRoom(payload.conversationId));
    return { conversationId: payload.conversationId, joined: true };
  }

  @SubscribeMessage("sendMessage")
  async sendMessage(
    @MessageBody() payload: SendRealtimeMessageDto,
  ) {
    const message = await this.chatService.sendMessage(payload.conversationId, payload);
    this.server
      .to(this.getConversationRoom(payload.conversationId))
      .emit("messageCreated", message);
    return message;
  }

  private getConversationRoom(conversationId: string) {
    return `conversation:${conversationId}`;
  }
}

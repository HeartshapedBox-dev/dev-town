import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { FindOrCreateConversationDto } from "./dto/find-or-create-conversation.dto";
import { SendMessageDto } from "./dto/send-message.dto";

// 채팅 조회와 보조 전송을 위한 HTTP 엔드포인트를 제공한다.
@Controller("chats")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post("conversations")
  findOrCreateConversation(@Body() dto: FindOrCreateConversationDto) {
    return this.chatService.findOrCreateConversation(dto);
  }

  @Get("conversations/:conversationId/messages")
  listMessages(@Param("conversationId") conversationId: string) {
    return this.chatService.listMessages(conversationId);
  }

  @Post("conversations/:conversationId/messages")
  sendMessage(
    @Param("conversationId") conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(conversationId, dto);
  }
}

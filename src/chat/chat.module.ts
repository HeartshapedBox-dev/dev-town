import { Module } from "@nestjs/common";
import { PresenceModule } from "../presence/presence.module";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ChatRepository } from "./repositories/chat.repository";

// 대화방 생성, 메시지 저장, 채팅 검증 로직을 한 모듈에서 관리한다.
@Module({
  imports: [PresenceModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
  exports: [ChatService],
})
export class ChatModule {}

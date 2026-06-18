import { Module } from "@nestjs/common";
import { PresenceModule } from "../presence/presence.module";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ChatRepository } from "./repositories/chat.repository";

// 대화방과 메시지 기능 의존성을 하나의 모듈로 묶는다.
@Module({
  imports: [PresenceModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
  exports: [ChatService],
})
export class ChatModule {}

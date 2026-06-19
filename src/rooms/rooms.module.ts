import { Module } from "@nestjs/common";
import { PresenceModule } from "../presence/presence.module";
import { RoomsRepository } from "./repositories/rooms.repository";
import { RoomsController } from "./rooms.controller";
import { RoomsService } from "./rooms.service";

// 방 생성, 초대코드 입장, 세션 생성 흐름을 연결하는 모듈이다.
@Module({
  imports: [PresenceModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsRepository],
  exports: [RoomsService],
})
export class RoomsModule {}

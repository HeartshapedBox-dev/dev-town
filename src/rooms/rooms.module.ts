import { Module } from "@nestjs/common";
import { PresenceModule } from "../presence/presence.module";
import { RoomsRepository } from "./repositories/rooms.repository";
import { RoomsController } from "./rooms.controller";
import { RoomsService } from "./rooms.service";

// 방 생성과 초대코드 입장 기능을 하나의 모듈로 묶는다.
@Module({
  imports: [PresenceModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsRepository],
  exports: [RoomsService],
})
export class RoomsModule {}

import { Module } from "@nestjs/common";
import { PresenceController } from "./presence.controller";
import { PresenceService } from "./presence.service";
import { PresenceRepository } from "./repositories/presence.repository";

// 캐릭터 이동과 방 접속자 기능을 하나의 모듈로 묶는다.
@Module({
  controllers: [PresenceController],
  providers: [PresenceService, PresenceRepository],
  exports: [PresenceService],
})
export class PresenceModule {}

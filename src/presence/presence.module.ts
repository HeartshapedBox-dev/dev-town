import { Module } from "@nestjs/common";
import { PresenceController } from "./presence.controller";
import { PresenceService } from "./presence.service";
import { PresenceRepository } from "./repositories/presence.repository";

// 캐릭터 세션 생성, 위치 갱신, 방 내 온라인 목록 조회를 담당하는 모듈이다.
@Module({
  controllers: [PresenceController],
  providers: [PresenceService, PresenceRepository],
  exports: [PresenceService],
})
export class PresenceModule {}

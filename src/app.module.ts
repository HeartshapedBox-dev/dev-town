import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ChatModule } from "./chat/chat.module";
import { PresenceModule } from "./presence/presence.module";
import { PrismaModule } from "./prisma/prisma.module";
import { TownGateway } from "./realtime/town.gateway";
import { RoomsModule } from "./rooms/rooms.module";

// 개발자 타운 백엔드의 공통 인프라, 도메인 모듈, 실시간 게이트웨이를 한곳에 묶는 루트 모듈이다.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RoomsModule,
    PresenceModule,
    ChatModule,
  ],
  providers: [TownGateway],
})
export class AppModule {}

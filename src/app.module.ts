import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ChatModule } from "./chat/chat.module";
import { PresenceModule } from "./presence/presence.module";
import { PrismaModule } from "./prisma/prisma.module";
import { TownGateway } from "./realtime/town.gateway";
import { RoomsModule } from "./rooms/rooms.module";

// 개발자 타운 백엔드에서 사용하는 핵심 모듈을 연결한다.
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

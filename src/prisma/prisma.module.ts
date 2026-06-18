import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

// 모든 기능 모듈에서 하나의 Prisma 클라이언트를 공유한다.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

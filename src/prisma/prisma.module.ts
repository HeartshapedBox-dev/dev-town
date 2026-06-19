import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

// 모든 도메인 모듈이 같은 Prisma 클라이언트를 재사용하도록 제공하는 인프라 모듈이다.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

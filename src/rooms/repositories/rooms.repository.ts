import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

// 방과 초대코드 저장소 접근을 Prisma 계층으로 분리한다.
@Injectable()
export class RoomsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.RoomCreateInput) {
    return this.prisma.room.create({ data });
  }

  findByInviteCode(inviteCode: string) {
    return this.prisma.room.findUnique({ where: { inviteCode } });
  }
}

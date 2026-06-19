import { Injectable, NotFoundException } from "@nestjs/common";
import { Direction, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

// 캐릭터 세션 저장소 접근을 Prisma 계층으로 분리한다.
@Injectable()
export class PresenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.DeveloperSessionCreateInput) {
    return this.prisma.developerSession.create({ data });
  }

  findById(id: string) {
    return this.prisma.developerSession.findUnique({ where: { id } });
  }

  listOnlineByRoom(roomId: string) {
    return this.prisma.developerSession.findMany({
      where: { roomId, status: "ONLINE" },
      orderBy: { lastSeenAt: "desc" },
    });
  }

  async updatePosition(id: string, data: {
    roomId: string;
    positionX: number;
    positionY: number;
    direction: Direction;
  }) {
    const { roomId, positionX, positionY, direction } = data;
    try {
      return await this.prisma.developerSession.update({
        where: { id },
        data: {
          roomId,
          positionX,
          positionY,
          direction,
          status: "ONLINE",
          lastSeenAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException("Developer session not found");
      }
      throw error;
    }
  }
}

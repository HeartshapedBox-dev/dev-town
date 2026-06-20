import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PresenceService } from "../presence/presence.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { JoinRoomByInviteDto } from "./dto/join-room-by-invite.dto";
import { RoomsRepository } from "./repositories/rooms.repository";

// 방 생성과 초대코드 입장 흐름을 처리한다.
@Injectable()
export class RoomsService {
  constructor(
    private readonly roomsRepository: RoomsRepository,
    private readonly presenceService: PresenceService,
    private readonly prismaService: PrismaService,
  ) {}

  async createRoom(dto: CreateRoomDto) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.roomsRepository.create({
          name: dto.name ?? "개발자 타운",
          inviteCode: this.createInviteCode(),
          width: 12,
          height: 11,
        });
      } catch (error) {
        if (this.isUniqueInviteCodeError(error)) {
          continue;
        }
        throw error;
      }
    }

    throw new Error("Failed to create unique invite code");
  }

  async joinByInviteCode(dto: JoinRoomByInviteDto) {
    const room = await this.roomsRepository.findByInviteCode(dto.inviteCode.toUpperCase());
    if (!room) {
      throw new NotFoundException("Room invite code not found");
    }

    const session = await this.presenceService.createRandomSession(room, dto.displayName);
    return { room, session };
  }

  async getRoomOrThrow(roomId: string) {
    const room = await this.roomsRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException("Room not found");
    }

    return room;
  }

  async destroyRoom(roomId: string) {
    await this.prismaService.$transaction(async (tx) => {
      await tx.chatMessage.deleteMany({
        where: {
          conversation: {
            roomId,
          },
        },
      });

      await tx.conversation.deleteMany({
        where: { roomId },
      });

      await tx.developerSession.deleteMany({
        where: { roomId },
      });

      await tx.room.delete({
        where: { id: roomId },
      });
    });
  }

  private createInviteCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  }

  private isUniqueInviteCodeError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
  }
}

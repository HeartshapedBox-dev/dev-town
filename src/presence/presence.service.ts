import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { DeveloperSession, Direction } from "@prisma/client";
import { CreateSessionDto } from "./dto/create-session.dto";
import { UpdatePositionDto } from "./dto/update-position.dto";
import { PresenceRepository } from "./repositories/presence.repository";
import { PrismaService } from "../prisma/prisma.service";

// 캐릭터 세션과 마주보기 판정 규칙을 처리한다.
@Injectable()
export class PresenceService {
  constructor(
    private readonly presenceRepository: PresenceRepository,
    private readonly prismaService: PrismaService,
  ) {}

  async createSession(dto: CreateSessionDto) {
    const room = await this.getRoomOrThrow(dto.roomId);
    const spawnPoint = await this.pickSpawnPoint(room.id, room.width, room.height);

    const session = await this.presenceRepository.create({
      displayName: dto.displayName,
      avatarColor: dto.avatarColor,
      room: { connect: { id: dto.roomId } },
      positionX: spawnPoint.positionX,
      positionY: spawnPoint.positionY,
      direction: spawnPoint.direction,
    });

    await this.markRoomOwnerIfMissing(room.id, session.id);
    return session;
  }

  async createRandomSession(room: { id: string; width: number; height: number }, displayName?: string) {
    const spawnPoint = await this.pickSpawnPoint(room.id, room.width, room.height);

    const session = await this.presenceRepository.create({
      displayName: displayName ?? this.pickRandomName(),
      avatarColor: this.pickRandomColor(),
      room: { connect: { id: room.id } },
      positionX: spawnPoint.positionX,
      positionY: spawnPoint.positionY,
      direction: spawnPoint.direction,
    });

    await this.markRoomOwnerIfMissing(room.id, session.id);
    return session;
  }

  listRoomSessions(roomId: string) {
    return this.presenceRepository.listOnlineByRoom(roomId);
  }

  markOffline(sessionId: string) {
    return this.presenceRepository.markOffline(sessionId);
  }

  async updatePosition(sessionId: string, dto: UpdatePositionDto) {
    const { roomId, positionX, positionY, direction } = dto;
    await this.assertNoSessionCollision(sessionId, roomId, positionX, positionY);
    return this.presenceRepository.updatePosition(sessionId, {
      roomId,
      positionX,
      positionY,
      direction,
    });
  }

  async getSessionOrThrow(sessionId: string) {
    const session = await this.presenceRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException("Developer session not found");
    }
    return session;
  }

  canStartConversation(a: DeveloperSession, b: DeveloperSession) {
    if (a.id === b.id || a.roomId !== b.roomId) {
      return false;
    }

    return this.isFacingEachOther(a, b);
  }

  private isFacingEachOther(a: DeveloperSession, b: DeveloperSession) {
    return (
      this.pointsTo(a, b.positionX, b.positionY) &&
      this.pointsTo(b, a.positionX, a.positionY)
    );
  }

  private pointsTo(session: DeveloperSession, targetX: number, targetY: number) {
    const expected: Record<Direction, [number, number]> = {
      UP: [session.positionX, session.positionY - 1],
      DOWN: [session.positionX, session.positionY + 1],
      LEFT: [session.positionX - 1, session.positionY],
      RIGHT: [session.positionX + 1, session.positionY],
    };

    const [x, y] = expected[session.direction];
    return x === targetX && y === targetY;
  }

  private pickRandomName() {
    const names = ["Backend", "Frontend", "DevOps", "Tester", "Reviewer"];
    return `${names[this.pickRandomNumber(names.length)]}-${this.pickRandomNumber(1000)}`;
  }

  private pickRandomColor() {
    const colors = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c"];
    return colors[this.pickRandomNumber(colors.length)];
  }

  private pickRandomDirection() {
    const directions: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];
    return directions[this.pickRandomNumber(directions.length)];
  }

  private pickRandomNumber(max: number) {
    return Math.floor(Math.random() * Math.max(max, 1));
  }

  private async getRoomOrThrow(roomId: string) {
    const room = await this.presenceRepository.findRoomById(roomId);
    if (!room) {
      throw new NotFoundException("Room not found");
    }

    return room;
  }

  private async pickSpawnPoint(roomId: string, width: number, height: number) {
    const occupiedSessions = await this.listRoomSessions(roomId);
    const occupied = new Set(occupiedSessions.map((session) => `${session.positionX}:${session.positionY}`));
    const coordinates: Array<{ positionX: number; positionY: number }> = [];

    for (let positionY = 0; positionY < Math.max(height, 1); positionY += 1) {
      for (let positionX = 0; positionX < Math.max(width, 1); positionX += 1) {
        if (!occupied.has(`${positionX}:${positionY}`)) {
          coordinates.push({ positionX, positionY });
        }
      }
    }

    const position =
      coordinates.length > 0
        ? coordinates[this.pickRandomNumber(coordinates.length)]
        : {
            positionX: this.pickRandomNumber(width),
            positionY: this.pickRandomNumber(height),
          };

    return {
      ...position,
      direction: this.pickRandomDirection(),
    };
  }

  private async markRoomOwnerIfMissing(roomId: string, ownerSessionId: string) {
    await this.prismaService.room.updateMany({
      where: {
        id: roomId,
        ownerSessionId: null,
      },
      data: {
        ownerSessionId,
      },
    });
  }

  private async assertNoSessionCollision(
    sessionId: string,
    roomId: string,
    positionX: number,
    positionY: number,
  ) {
    const peers = await this.listRoomSessions(roomId);
    const blockingSession = peers.find(
      (candidate) =>
        candidate.id !== sessionId &&
        candidate.status === "ONLINE" &&
        candidate.positionX === positionX &&
        candidate.positionY === positionY,
    );

    if (blockingSession) {
      throw new ConflictException("다른 사용자가 있어 이동할 수 없습니다");
    }
  }
}

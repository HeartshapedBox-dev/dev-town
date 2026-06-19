import { Injectable, NotFoundException } from "@nestjs/common";
import { DeveloperSession, Direction } from "@prisma/client";
import { CreateSessionDto } from "./dto/create-session.dto";
import { UpdatePositionDto } from "./dto/update-position.dto";
import { PresenceRepository } from "./repositories/presence.repository";

// 캐릭터 세션과 마주보기 판정 규칙을 처리한다.
@Injectable()
export class PresenceService {
  constructor(private readonly presenceRepository: PresenceRepository) {}

  createSession(dto: CreateSessionDto) {
    return this.presenceRepository.create({
      displayName: dto.displayName,
      avatarColor: dto.avatarColor,
      room: { connect: { id: dto.roomId } },
    });
  }

  createRandomSession(room: { id: string; width: number; height: number }, displayName?: string) {
    return this.presenceRepository.create({
      displayName: displayName ?? this.pickRandomName(),
      avatarColor: this.pickRandomColor(),
      room: { connect: { id: room.id } },
      positionX: this.pickRandomNumber(room.width),
      positionY: this.pickRandomNumber(room.height),
      direction: this.pickRandomDirection(),
    });
  }

  listRoomSessions(roomId: string) {
    return this.presenceRepository.listOnlineByRoom(roomId);
  }

  updatePosition(sessionId: string, dto: UpdatePositionDto) {
    return this.presenceRepository.updatePosition(sessionId, dto);
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
}

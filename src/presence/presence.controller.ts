import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { CreateSessionDto } from "./dto/create-session.dto";
import { UpdatePositionDto } from "./dto/update-position.dto";
import { PresenceService } from "./presence.service";

// 방 접속자와 캐릭터 이동을 위한 HTTP 엔드포인트를 제공한다.
@Controller("presence")
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Post("sessions")
  createSession(@Body() dto: CreateSessionDto) {
    return this.presenceService.createSession(dto);
  }

  @Get("rooms/:roomId/sessions")
  listRoomSessions(@Param("roomId") roomId: string) {
    return this.presenceService.listRoomSessions(roomId);
  }

  @Patch("sessions/:sessionId/position")
  updatePosition(
    @Param("sessionId") sessionId: string,
    @Body() dto: UpdatePositionDto,
  ) {
    return this.presenceService.updatePosition(sessionId, dto);
  }
}

import { Body, Controller, Post } from "@nestjs/common";
import { CreateRoomDto } from "./dto/create-room.dto";
import { JoinRoomByInviteDto } from "./dto/join-room-by-invite.dto";
import { RoomsService } from "./rooms.service";

// 초대코드 기반 방 생성과 입장 API를 제공한다.
@Controller("rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  createRoom(@Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(dto);
  }

  @Post("join")
  joinRoom(@Body() dto: JoinRoomByInviteDto) {
    return this.roomsService.joinByInviteCode(dto);
  }
}

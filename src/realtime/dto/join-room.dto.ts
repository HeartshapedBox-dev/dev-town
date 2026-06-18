import { IsString, MinLength } from "class-validator";

// 클라이언트가 입장할 사무실 방 식별자를 검증한다.
export class JoinRoomDto {
  @IsString()
  @MinLength(1)
  roomId!: string;
}
